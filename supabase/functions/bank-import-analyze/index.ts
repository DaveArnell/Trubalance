import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { getAnonKey, getServiceRoleKey } from '../_shared/supabaseEnv.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Same rules as src/content/diyStatementPrompt.ts — JSON instead of markdown tables.
 * Keep in sync when the DIY prompt changes.
 */
function buildDiySystemPrompt(minMonthly: number): string {
  return `You are helping set up Cash Prophet for a UK small business.

You will receive a compact bank transaction ledger for ONE business (tab-separated: date, description, amount). Work only from this ledger. Do not assume industry or known suppliers.
You are not preparing accounts, submitting tax returns, or giving regulated financial advice.

GOAL — FIRST DRAFT for Cash Prophet (be as complete as a careful human + ChatGPT review):
A) monthly_accruing_suggestions — Monthly commitments
B) reserve_planner_suggestions — Reserve Planner (quarterly / six-monthly / annual / large non-monthly)
C) expected_receipt_suggestions — only rare non-routine future money (NOT daily card takings); usually empty
D) manual_review_items — up to 5 confirm-first questions
E) excluded_patterns — Not imported (noticed only)

MEANINGFUL MONTHLY THRESHOLD = £${minMonthly}
- Minimum size for monthly bills meaningful enough to track — not every small cost.
- Drop small recurring noise clearly under this per month → excluded_patterns.
- Do NOT drop clear monthly costs around/above the threshold just because the amount varies.

ONE DAY ONLY
- suggested_due_day / likely_due_day must be a single integer 1–31.
- Never ranges. Use the most common day, or the median of recent days if it wobbles.

WEEKLY VS MONTHLY VS RESERVE
- Several times most months / ~weekly → excluded (do not invent a monthly total).
- About once per calendar month → Monthly.
- Roughly every 3 / 6 / 12 months, or same month(s) each year → Reserve — even if the payee looks odd.
- Do NOT dump large cyclical payments into excluded as “irregular” or “internal” if amount and spacing clearly repeat.

MONTHLY RULES
- Variable monthly (tax, utilities, finance, revolving credit) stays Monthly — not Reserve.
- Must appear in most months across a meaningful stretch.
- Sort monthly_accruing_suggestions by suggested_due_day ascending.
- Distinct rows per payee / agreement — NEVER merge into vague “Utilities”, “Software”, or “Other”.
- Separate Barclaycard / Capital on Tap / GoCardless agreements with different refs into separate rows.

RESERVE PLANNER (do not under-fill)
Include when ANY fit:
1) Quarterly-ish (~80–100 days) or same 4 month-slots — list ALL due months in likely_payment_months as month names (e.g. "Mar","Jun","Sep","Dec") even if only some appear.
2) Six-monthly or annual repeats.
3) Large non-monthly bills (VAT, corporation tax when identifiable, insurance, licences, large landlord/management, big yearly charges).
4) Purpose unknown is fine: payee-based name, lower confidence, but STILL include if schedule and size qualify.
Never put every-month payments in Reserve.

PAYROLL
- Early-month cluster / payroll or wage wording → ONE Monthly row “Payroll”, one recent-run total. Not per person. Exclude dividends.

AMOUNTS
- One number only — never ranges. Keep pence (e.g. 17851.52 not 18000 or 20000).
- Fixed → latest repeated amount.
- Stable variable → median of ~last 6.
- Recent level change → weight last 3–4 more.
- For reserve: suggested_annual_amount = payment size when due (e.g. one VAT payment), NOT a rounded guess.
- suggested_monthly_reserve = payment/12 for annual, payment/4 for quarterly, etc.

NAMES
- suggested_name = short plain Cash Prophet label.
- bank_payee / supplier_group = as on the statement (may include refs).
- Do NOT put long refs in suggested_name.

CONFIDENCE
- confidence_label high ≈ 🟢 enter; medium ≈ 🟠 enter then check; low ≈ 🔴 decide first.
- confidence 0–100.

COMPLETENESS
Aim for many specific monthly rows when the ledger supports them (often 10–25 for a busy SME), plus a full Reserve table — not 2–3 vague lumps.
List meaningful exclusions in excluded_patterns with clear reasons.

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
    ledger?: string
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

  const ledger =
    typeof body.ledger === 'string' && body.ledger.trim().length > 0
      ? body.ledger.trim()
      : ''
  const groups = Array.isArray(body.groups) ? body.groups : []

  if (!ledger && groups.length === 0) {
    return jsonResponse({ error: 'No transactions to analyse' }, 400)
  }

  const admin = serviceKey ? createClient(supabaseUrl, serviceKey) : supabase

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

  // Quality first — same class of model users get good DIY results with.
  const model = Deno.env.get('OPENAI_MODEL_TEXT') ?? 'gpt-4o'

  const minMonthly =
    typeof body.minMonthlyAmount === 'number' && Number.isFinite(body.minMonthlyAmount)
      ? Math.max(1, Math.round(body.minMonthlyAmount))
      : 200

  const schemaHint = `{
  "analysis_period": { "start_date": "YYYY-MM-DD", "end_date": "YYYY-MM-DD", "months_covered": 0 },
  "monthly_accruing_suggestions": [{
    "suggested_name": "Payroll",
    "bank_payee": "PAYROLL GRP / SWINDON PAY GRP",
    "supplier_group": "PAYROLL GRP / SWINDON PAY GRP",
    "category": "payroll",
    "frequency": "monthly",
    "suggested_monthly_amount": 17851.52,
    "amount_method": "recent run total",
    "suggested_due_day": 2,
    "confidence": 75,
    "confidence_label": "medium",
    "evidence": [{ "date": "2025-01-02", "description": "PAYROLL GRP", "amount": -17851.52 }],
    "reasoning_summary": "",
    "warnings": []
  }],
  "reserve_planner_suggestions": [{
    "suggested_name": "HMRC VAT",
    "bank_payee": "HMRC E VAT 000918124048",
    "category": "hmrc",
    "schedule": "quarterly",
    "suggested_annual_amount": 23999.00,
    "suggested_monthly_reserve": 1999.92,
    "likely_payment_months": ["Mar","Jun","Sep","Dec"],
    "likely_due_day": 11,
    "amount_method": "typical payment",
    "confidence": 70,
    "confidence_label": "medium",
    "evidence": [],
    "reasoning_summary": "",
    "warnings": []
  }],
  "expected_receipt_suggestions": [],
  "manual_review_items": [{ "supplier_group": "", "issue": "", "question_for_user": "", "evidence": [] }],
  "excluded_patterns": [{ "supplier_group": "BOOKER LTD", "reason_excluded": "Irregular purchase activity" }]
}`

  const userContent = ledger
    ? `Schema (keep pence; many specific rows):\n${schemaHint}\n\nAnalysis period: ${JSON.stringify(body.analysisPeriod ?? null)}\nMeaningful monthly threshold: £${minMonthly}\nFile: ${body.fileName ?? 'statement'}\n\nLedger (date\\tdescription\\tamount):\n${ledger}`
    : `Schema:\n${schemaHint}\n\nFallback grouped data (prefer ledger when available):\n${JSON.stringify({ analysis_period: body.analysisPeriod, groups: groups.slice(0, 80) })}`

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
          { role: 'system', content: buildDiySystemPrompt(minMonthly) },
          { role: 'user', content: userContent },
        ],
        temperature: 0.1,
        max_tokens: 12000,
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
