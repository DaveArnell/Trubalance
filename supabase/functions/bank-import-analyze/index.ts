import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { getAnonKey, getServiceRoleKey } from '../_shared/supabaseEnv.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `You are assisting a UK small-business owner setting up Cash Prophet.

You are not preparing accounts, submitting tax returns or giving regulated financial advice.
Work only from the supplied transaction groups. Do not invent industry-specific suppliers.

Identify patterns to pre-fill:
A. Monthly Accruing — about once per calendar month (payroll, rent, utilities, finance, regular software). Variable monthly stays Monthly, not Reserve.
B. Reserve Planner — quarterly / six-monthly / annual / large non-monthly bills (VAT, corporation tax when identifiable, insurance, licences, large landlord-style payments). Prefer material amounts.
C. Expected Receipts — only identifiable, non-routine future money that is sufficiently certain. Do NOT treat daily card takings as expected receipts.
D. Manual Review — uncertain HMRC, credit-card repayments (double-count risk), ambiguous items.
E. Excluded — weekly noise, internal transfers, refunds, random one-offs, small recurring under the meaningful monthly threshold.

Rules:
- Respect MEANINGFUL_MONTHLY_THRESHOLD when provided: drop clear small noise under it; do not drop larger variable monthly costs just because they wobble.
- One due day only (integer 1–31), never ranges. One amount only, never ranges.
- Payroll: one Monthly row “Payroll” with a recent-run total — not per person.
- Names: short plain Cash Prophet labels; keep bank payee separately in supplier_group when useful.
- Purpose unknown is fine: still include strong patterns with lower confidence.
- Never silently assume every HMRC payment is VAT or corporation tax.

Return ONLY valid JSON matching the schema provided. No markdown.`

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

  // Resolve workspace + enforce one successful analysis per business (server-side).
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

  const model = Deno.env.get('OPENAI_MODEL_TEXT') ?? 'gpt-4o-mini'
  const maxGroups = 40
  const chunk = groups.slice(0, maxGroups)

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
      'Suggest monthly_accruing_suggestions, reserve_planner_suggestions, expected_receipt_suggestions, manual_review_items, excluded_patterns. Include evidence dates and amounts. Confidence 0-100. Obey meaningful_monthly_threshold when set.',
  }

  const schemaHint = `{
  "analysis_period": { "start_date": "YYYY-MM-DD", "end_date": "YYYY-MM-DD", "months_covered": 0 },
  "monthly_accruing_suggestions": [{ "suggested_name": "", "supplier_group": "", "category": "", "frequency": "monthly", "suggested_monthly_amount": 0, "amount_method": "", "suggested_due_day": null, "confidence": 0, "confidence_label": "medium", "evidence": [{ "date": "", "description": "", "amount": 0 }], "reasoning_summary": "", "warnings": [] }],
  "reserve_planner_suggestions": [{ "suggested_name": "", "category": "", "schedule": "quarterly", "suggested_annual_amount": 0, "suggested_monthly_reserve": 0, "likely_payment_months": [], "likely_due_day": null, "amount_method": "", "confidence": 0, "confidence_label": "medium", "evidence": [], "reasoning_summary": "", "warnings": [] }],
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
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Schema:\n${schemaHint}\n\nData:\n${JSON.stringify(userPayload)}`,
          },
        ],
        temperature: 0.2,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('OpenAI error', response.status, errText)
      return jsonResponse({ error: 'AI analysis failed. Please try again later.' }, 502)
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

    // Mark used only after a successful analysis — refresh / new browser cannot bypass this.
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
