import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { getAnonKey, getServiceRoleKey } from '../_shared/supabaseEnv.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Same rules as the DIY ChatGPT statement prompt — JSON output instead of markdown tables.
 * Keep in sync with src/content/diyStatementPrompt.ts
 */
function buildSystemPrompt(minMonthly: number | null): string {
  const threshold =
    minMonthly != null && minMonthly > 0
      ? `£${minMonthly}`
      : '£200 (default — caller did not override)'

  return `You are helping set up Cash Prophet for a UK small business from ONE bank statement’s transaction groups.

You are not preparing accounts, submitting tax returns, or giving regulated financial advice.
Work ONLY from the supplied transaction_groups. Do not invent industry or known suppliers.

GOAL — FIRST DRAFT for Cash Prophet:
A) monthly_accruing_suggestions — about once per calendar month
B) reserve_planner_suggestions — quarterly / six-monthly / annual / large non-monthly
C) expected_receipt_suggestions — only identifiable non-routine future money (NOT daily card takings)
D) manual_review_items — uncertain items needing a human question
E) excluded_patterns — weekly noise, transfers, refunds, small/unclear patterns

MEANINGFUL MONTHLY THRESHOLD = ${threshold}
- Minimum size for monthly bills meaningful enough to track — not every small cost.
- Drop small recurring noise clearly under this per month → excluded_patterns.
- Do NOT drop clear monthly costs around/above the threshold just because the amount varies.

CRITICAL OUTPUT QUALITY (match a careful human review):
- Prefer MANY specific payee rows over a few vague lumps. NEVER merge unrelated suppliers into “Utilities”, “Software”, or “Other”.
- Separate finance agreements / policies to the same lender or insurer into separate rows when amounts or schedules differ (e.g. two Barclaycard agreements).
- Keep bank-facing text in supplier_group; suggested_name = short plain Cash Prophet label (Property payment, Payroll, Nest pension, Mailchimp, British Gas, HMRC VAT, etc.).
- Amounts: ONE number with pence when the statement has pence. Do NOT round to nearest thousand or even nearest £10. Fixed → latest repeated amount; stable variable → median of ~last 6; recent level change → weight last 3–4.
- One due day only: integer 1–31, never ranges.
- Payroll: ONE monthly row “Payroll” with a recent-run total (cluster early-month / payroll wording) — not per person. Exclude dividends from Payroll.
- Variable monthly (tax, utilities, finance, revolving credit) stays Monthly — not Reserve.
- Must appear in most months across a meaningful stretch for Monthly. Short recent window only → Reserve (if large/cyclical) or excluded (if unclear).
- Weekly / several times most months → excluded (do not invent a monthly total).

RESERVE PLANNER (do not under-fill):
Include when ANY fit:
1) Quarterly-ish (~80–100 days) or same 4 month-slots each year — list ALL due months in likely_payment_months (e.g. Mar, Jun, Sep, Dec) even if only some appear in the file.
2) Six-monthly or annual repeats.
3) Large non-monthly bills that matter for cash planning (VAT, corporation tax when identifiable, insurance, licences, large landlord/management payments, big yearly charges).
4) Purpose unknown is fine: keep payee-based name, lower confidence, but STILL include if schedule and size qualify.
Never put every-month payments in Reserve.

For reserve_planner_suggestions:
- suggested_annual_amount = the payment size when due (same sense as a “Amount (£)” column on a reserve table) — e.g. one VAT payment ≈ 23999.00, not a monthly slice and not a round 12000.
- suggested_monthly_reserve = suggested_annual_amount / 12 for annual, or payment/4 for quarterly, etc. (secondary; prefer accurate payment size in suggested_annual_amount).
- schedule: quarterly | annual | specific_months | other as appropriate.
- likely_payment_months: month names as in data (e.g. "Mar","Jun","Sep","Dec").

CONFIDENCE
- high / 🟢-like when consistent; medium / 🟠 when estimated; low / 🔴 when draft / decide first.
- confidence 0–100; confidence_label high|medium|low.

EXCLUSIONS
List meaningful noticed-but-not-imported patterns in excluded_patterns with a clear reason_excluded (weekly; below threshold; purchase activity; transfers; unclear pattern; etc.).

Return ONLY valid JSON matching the schema. No markdown.`
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function validateAnalysis(raw: Record<string, unknown>): boolean {
  return (
    Array.isArray(raw.monthly_accruing_suggestions) &&
    Array.isArray(raw.reserve_planner_suggestions) &&
    Array.isArray(raw.expected_receipt_suggestions) &&
    Array.isArray(raw.manual_review_items) &&
    Array.isArray(raw.excluded_patterns)
  )
}

function asUsageMap(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === 'string' && value.trim()) out[key] = value
  }
  return out
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const openAiKey = Deno.env.get('OPENAI_API_KEY')
  if (!openAiKey) {
    return jsonResponse(
      {
        error:
          'AI analysis is not configured. Add OPENAI_API_KEY in Supabase Edge Function secrets.',
      },
      503,
    )
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = getServiceRoleKey()
  const anonKey = getAnonKey() || Deno.env.get('SUPABASE_ANON_KEY')!
  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  let body: {
    groups?: unknown[]
    analysisPeriod?: { start_date: string; end_date: string; months_covered: number }
    scopeLevel?: string
    scopeId?: string
    businessId?: string
    fileName?: string
    minMonthlyAmount?: number
  }

  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid request body' }, 400)
  }

  const businessId = typeof body.businessId === 'string' ? body.businessId.trim() : ''
  if (!businessId) {
    return jsonResponse({ error: 'businessId is required for statement analysis.' }, 400)
  }

  const groups = body.groups ?? []
  if (!Array.isArray(groups) || groups.length === 0) {
    return jsonResponse({ error: 'No transaction groups to analyse' }, 400)
  }

  const admin = serviceKey
    ? createClient(supabaseUrl, serviceKey)
    : supabase

  const { data: member } = await admin
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  let workspaceId = member?.workspace_id as string | undefined
  if (!workspaceId) {
    const { data: owned } = await admin
      .from('workspaces')
      .select('id')
      .eq('owner_id', user.id)
      .limit(1)
      .maybeSingle()
    workspaceId = owned?.id as string | undefined
  }

  if (!workspaceId) {
    return jsonResponse({ error: 'No workspace found for this account.' }, 403)
  }

  const { data: workspace, error: workspaceError } = await admin
    .from('workspaces')
    .select('id, statement_ai_unlimited, statement_ai_usage')
    .eq('id', workspaceId)
    .maybeSingle()

  if (workspaceError || !workspace) {
    console.error('workspace entitlement load failed', workspaceError)
    return jsonResponse(
      {
        error:
          'Statement AI entitlement is not available yet. Please run the latest Supabase SQL migration, then try again.',
        code: 'STATEMENT_AI_ENTITLEMENT_UNAVAILABLE',
      },
      503,
    )
  }

  const unlimited = Boolean(workspace.statement_ai_unlimited)
  const usage = asUsageMap(workspace.statement_ai_usage)
  if (!unlimited && usage[businessId]) {
    return jsonResponse(
      {
        error:
          'This business has already used its statement analysis. Open the saved review, or ask support to unlock another pass.',
        code: 'STATEMENT_AI_ALREADY_USED',
      },
      403,
    )
  }

  // Prefer a stronger model when set. Default mini for reliability on large statements.
  const model = Deno.env.get('OPENAI_MODEL_TEXT') ?? 'gpt-4o-mini'
  const maxGroups = 80
  const chunk = (groups as Record<string, unknown>[])
    .slice(0, maxGroups)
    .map((group) => {
      const txs = Array.isArray(group.transactions) ? group.transactions.slice(-12) : []
      return {
        ...group,
        sample_descriptions: Array.isArray(group.sample_descriptions)
          ? group.sample_descriptions.slice(0, 4)
          : [],
        transactions: txs,
      }
    })

  const minMonthly =
    typeof body.minMonthlyAmount === 'number' && Number.isFinite(body.minMonthlyAmount)
      ? Math.max(0, Math.round(body.minMonthlyAmount))
      : null

  const userPayload = {
    analysis_period: body.analysisPeriod,
    scope: { level: body.scopeLevel, id: body.scopeId },
    meaningful_monthly_threshold: minMonthly,
    transaction_groups: chunk,
    instructions:
      'Fill monthly_accruing_suggestions and reserve_planner_suggestions generously with specific payees (aim for completeness like a careful spreadsheet review). Keep pence. Do not lump. Obey meaningful_monthly_threshold. List exclusions.',
  }

  const schemaHint = `{
  "analysis_period": { "start_date": "YYYY-MM-DD", "end_date": "YYYY-MM-DD", "months_covered": 0 },
  "monthly_accruing_suggestions": [{ "suggested_name": "Payroll", "supplier_group": "PAYROLL GRP", "category": "payroll", "frequency": "monthly", "suggested_monthly_amount": 17851.52, "amount_method": "recent run total", "suggested_due_day": 2, "confidence": 75, "confidence_label": "medium", "evidence": [{ "date": "2025-01-02", "description": "", "amount": -17851.52 }], "reasoning_summary": "", "warnings": [] }],
  "reserve_planner_suggestions": [{ "suggested_name": "HMRC VAT", "category": "hmrc", "schedule": "quarterly", "suggested_annual_amount": 23999.00, "suggested_monthly_reserve": 1999.92, "likely_payment_months": ["Mar","Jun","Sep","Dec"], "likely_due_day": 11, "amount_method": "typical payment", "confidence": 70, "confidence_label": "medium", "evidence": [], "reasoning_summary": "", "warnings": [] }],
  "expected_receipt_suggestions": [],
  "manual_review_items": [{ "supplier_group": "", "issue": "", "question_for_user": "", "evidence": [] }],
  "excluded_patterns": [{ "supplier_group": "", "reason_excluded": "" }]
}`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: buildSystemPrompt(minMonthly) },
          {
            role: 'user',
            content: `Schema (example amounts show pence precision — copy that precision):\n${schemaHint}\n\nData:\n${JSON.stringify(userPayload)}`,
          },
        ],
        temperature: 0.15,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('OpenAI error', response.status, errText.slice(0, 800))
      let detail = 'AI analysis failed. Please try again later.'
      if (response.status === 429) {
        detail = 'The AI service is busy right now. Wait a minute and try again.'
      } else if (response.status === 401 || response.status === 403) {
        detail = 'AI analysis is not authorised. Check the OpenAI API key in Edge secrets.'
      } else if (response.status === 400) {
        detail = 'The statement was too large or complex for analysis. Try a shorter export.'
      }
      return jsonResponse({ error: detail, code: 'OPENAI_ERROR', status: response.status }, 502)
    }

    const completion = await response.json()
    const content = completion.choices?.[0]?.message?.content
    if (!content || typeof content !== 'string') {
      return jsonResponse({ error: 'AI returned an empty response.' }, 502)
    }

    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(content)
    } catch {
      return jsonResponse({ error: 'AI returned invalid JSON.' }, 502)
    }

    if (!validateAnalysis(parsed)) {
      return jsonResponse({ error: 'AI response did not match the expected structure.' }, 502)
    }

    if (!parsed.analysis_period && body.analysisPeriod) {
      parsed.analysis_period = body.analysisPeriod
    }

    if (!unlimited) {
      if (!serviceKey) {
        return jsonResponse(
          {
            error:
              'Statement AI entitlement lock is not configured (service role missing). Analysis blocked.',
            code: 'STATEMENT_AI_USAGE_LOCK_UNAVAILABLE',
          },
          503,
        )
      }
      const usedAt = new Date().toISOString()
      const nextUsage = { ...usage, [businessId]: usedAt }
      const { error: usageError } = await admin
        .from('workspaces')
        .update({ statement_ai_usage: nextUsage, updated_at: usedAt })
        .eq('id', workspaceId)
      if (usageError) {
        console.error('Failed to persist statement_ai_usage', usageError)
        return jsonResponse(
          {
            error:
              'Analysis completed but could not lock this business’s AI pass. Please contact support before retrying.',
            code: 'STATEMENT_AI_USAGE_PERSIST_FAILED',
          },
          500,
        )
      }
      return jsonResponse({ analysis: parsed, businessId, usedAt })
    }

    return jsonResponse({ analysis: parsed, businessId, usedAt: null })
  } catch (err) {
    console.error(err)
    return jsonResponse({ error: 'AI analysis failed unexpectedly.' }, 500)
  }
})
