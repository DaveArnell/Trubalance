import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { getAnonKey, getServiceRoleKey } from '../_shared/supabaseEnv.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function buildClassifyPrompt(minMonthly: number): string {
  return `You are helping set up Cash Prophet for a UK small business.

You will receive recurring PAYEE CANDIDATES already discovered from a bank ledger (amounts, days, gaps, coverage). Your job is to CLASSIFY and NAME them — not to invent a tiny shortlist from scratch.

You are not preparing accounts, submitting tax returns, or giving regulated financial advice.

MEANINGFUL MONTHLY THRESHOLD = £${minMonthly}

For EVERY candidate, set destination to exactly one of:
- "monthly" — about once per calendar month (including variable monthly tax/utilities/finance/credit)
- "reserve" — quarterly / six-monthly / annual / large non-monthly
- "exclude" — weekly noise, transfers, refunds, purchase activity, clearly under threshold, unclear
- "manual_review" — ONLY when a human question is essential (max 5 total). Do NOT use this for ordinary monthly bills.

CRITICAL COMPLETENESS
- Prefer many specific monthly rows when candidates support them (often 10–25 for a busy SME).
- Do NOT collapse different payees into “Utilities” / “Software”.
- Separate finance agreements (different Barclaycard / Capital on Tap / GoCardless refs) stay separate.
- Payroll: if is_likely_payroll, ONE monthly row “Payroll” using recent_amount or typical_amount as a recent-run total — exclude dividends.
- Variable monthly stays monthly, not reserve.
- Weekly / several times most months → exclude (do not invent a monthly total).
- Large cyclical / same month slots → reserve; list ALL due months in the cycle (e.g. Mar, Jun, Sep, Dec) even if only some appear.
- Amounts: keep pence. Prefer typical_amount or recent_amount from the candidate — do not round to thousands.
- due_day: single integer 1–31 from suggested_due_day when sensible.
- You MUST return a classification for every candidate_id provided.
- Never leave a clear monthly candidate as manual_review with amount 0.

Return ONLY valid JSON.`
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function asUsageMap(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === 'string' && value.trim()) out[key] = value
  }
  return out
}

function money2(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function asDay(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return null
  const day = Math.round(n)
  return day >= 1 && day <= 31 ? day : null
}

type Candidate = {
  candidate_id?: string
  bank_payee?: string
  sample_descriptions?: string[]
  typical_amount?: number
  recent_amount?: number
  max_amount?: number
  suggested_due_day?: number | null
  payment_months?: string[]
  detected_frequency?: string
  is_likely_payroll?: boolean
  is_likely_hmrc?: boolean
  recent_transactions?: Array<{ date: string; description: string; amount: number }>
}

function buildAnalysisFromClassifications(
  candidates: Candidate[],
  raw: Record<string, unknown>,
  analysisPeriod: unknown,
): Record<string, unknown> {
  const byId = new Map(
    candidates
      .filter((c) => typeof c.candidate_id === 'string')
      .map((c) => [c.candidate_id as string, c]),
  )

  const classifications = Array.isArray(raw.classifications) ? raw.classifications : []
  const seen = new Set<string>()

  const monthly: unknown[] = []
  const reserve: unknown[] = []
  const manual: unknown[] = []
  const excluded: unknown[] = []

  for (const row of classifications) {
    if (!row || typeof row !== 'object') continue
    const item = row as Record<string, unknown>
    const id = asString(item.candidate_id)
    const candidate = byId.get(id)
    if (!candidate || seen.has(id)) continue
    seen.add(id)

    const destination = asString(item.destination).toLowerCase()
    const bankPayee =
      asString(item.bank_payee) ||
      asString(candidate.bank_payee) ||
      candidate.sample_descriptions?.[0] ||
      id
    const name =
      asString(item.suggested_name) ||
      (candidate.is_likely_payroll ? 'Payroll' : bankPayee)
    const amount = money2(
      item.suggested_amount ??
        candidate.recent_amount ??
        candidate.typical_amount ??
        candidate.max_amount ??
        0,
    )
    const dueDay = asDay(item.due_day) ?? asDay(candidate.suggested_due_day)
    const confidence = Math.min(100, Math.max(0, Math.round(money2(item.confidence) || 70)))
    const label = asString(item.confidence_label) || (confidence >= 80 ? 'high' : confidence >= 55 ? 'medium' : 'low')
    const evidence = Array.isArray(candidate.recent_transactions)
      ? candidate.recent_transactions.slice(-4)
      : []
    const warnings = Array.isArray(item.warnings)
      ? item.warnings.filter((w) => typeof w === 'string')
      : []
    const reasoning = asString(item.reasoning)

    if (destination === 'monthly') {
      monthly.push({
        suggested_name: candidate.is_likely_payroll ? 'Payroll' : name,
        bank_payee: bankPayee,
        supplier_group: bankPayee,
        category: candidate.is_likely_payroll
          ? 'payroll'
          : candidate.is_likely_hmrc
            ? 'hmrc'
            : asString(item.category) || 'supplier',
        frequency: 'monthly',
        suggested_monthly_amount: amount,
        amount_method: asString(item.amount_method) || 'candidate typical/recent',
        suggested_due_day: dueDay,
        confidence,
        confidence_label: label,
        evidence,
        reasoning_summary: reasoning,
        warnings,
      })
      continue
    }

    if (destination === 'reserve') {
      const months = Array.isArray(item.due_months)
        ? item.due_months.filter((m) => typeof m === 'string')
        : Array.isArray(candidate.payment_months)
          ? candidate.payment_months
          : []
      reserve.push({
        suggested_name: name,
        bank_payee: bankPayee,
        category: candidate.is_likely_hmrc ? 'hmrc' : asString(item.category) || 'other',
        schedule:
          asString(item.schedule) ||
          (candidate.detected_frequency === 'quarterly'
            ? 'quarterly'
            : candidate.detected_frequency === 'annual'
              ? 'annual'
              : 'specific_months'),
        suggested_annual_amount: amount,
        suggested_monthly_reserve: money2(amount / 12),
        likely_payment_months: months,
        likely_due_day: dueDay,
        amount_method: asString(item.amount_method) || 'candidate typical/recent',
        confidence,
        confidence_label: label,
        evidence,
        reasoning_summary: reasoning,
        warnings,
      })
      continue
    }

    if (destination === 'manual_review') {
      manual.push({
        supplier_group: bankPayee,
        issue: reasoning || 'Needs confirmation',
        question_for_user: asString(item.question_for_user) || reasoning || 'Can you confirm what this is?',
        evidence,
      })
      continue
    }

    excluded.push({
      supplier_group: bankPayee,
      reason_excluded: reasoning || asString(item.reason_excluded) || 'Excluded from setup',
    })
  }

  // Any candidate the model skipped → keep as monthly/reserve heuristically so we never return a tiny list.
  for (const candidate of candidates) {
    const id = asString(candidate.candidate_id)
    if (!id || seen.has(id)) continue
    const bankPayee = asString(candidate.bank_payee) || id
    const amount = money2(candidate.recent_amount ?? candidate.typical_amount)
    const dueDay = asDay(candidate.suggested_due_day)
    const evidence = Array.isArray(candidate.recent_transactions)
      ? candidate.recent_transactions.slice(-4)
      : []
    const freq = asString(candidate.detected_frequency)

    if (freq === 'weekly') {
      excluded.push({
        supplier_group: bankPayee,
        reason_excluded: 'Approximately weekly; no monthly total invented (model skipped)',
      })
      continue
    }

    if (freq === 'quarterly' || freq === 'annual') {
      reserve.push({
        suggested_name: candidate.is_likely_payroll ? 'Payroll' : bankPayee,
        bank_payee: bankPayee,
        category: candidate.is_likely_hmrc ? 'hmrc' : 'other',
        schedule: freq === 'quarterly' ? 'quarterly' : 'annual',
        suggested_annual_amount: amount,
        suggested_monthly_reserve: money2(amount / 12),
        likely_payment_months: Array.isArray(candidate.payment_months)
          ? candidate.payment_months
          : [],
        likely_due_day: dueDay,
        amount_method: 'candidate fallback',
        confidence: 55,
        confidence_label: 'medium',
        evidence,
        reasoning_summary: 'Included from statement pattern; model did not classify this candidate.',
        warnings: ['Review before trusting'],
      })
      continue
    }

    if (amount > 0) {
      monthly.push({
        suggested_name: candidate.is_likely_payroll ? 'Payroll' : bankPayee,
        bank_payee: bankPayee,
        supplier_group: bankPayee,
        category: candidate.is_likely_payroll
          ? 'payroll'
          : candidate.is_likely_hmrc
            ? 'hmrc'
            : 'supplier',
        frequency: 'monthly',
        suggested_monthly_amount: amount,
        amount_method: 'candidate fallback',
        suggested_due_day: dueDay,
        confidence: 55,
        confidence_label: 'medium',
        evidence,
        reasoning_summary: 'Included from statement pattern; model did not classify this candidate.',
        warnings: ['Review before trusting'],
      })
    }
  }

  const extrasMonthly = Array.isArray(raw.extra_monthly) ? raw.extra_monthly : []
  const extrasReserve = Array.isArray(raw.extra_reserve) ? raw.extra_reserve : []

  return {
    analysis_period: analysisPeriod,
    monthly_accruing_suggestions: [...monthly, ...extrasMonthly],
    reserve_planner_suggestions: [...reserve, ...extrasReserve],
    expected_receipt_suggestions: [],
    manual_review_items: Array.isArray(raw.confirm_first)
      ? [...manual, ...raw.confirm_first].slice(0, 5)
      : manual.slice(0, 5),
    excluded_patterns: excluded,
  }
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
    candidates?: Candidate[]
    ledger?: string
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

  const candidates = Array.isArray(body.candidates) ? body.candidates.slice(0, 80) : []
  if (candidates.length === 0) {
    return jsonResponse(
      { error: 'No recurring candidates found in that statement. Try a longer export.' },
      400,
    )
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

  const preferredModel = Deno.env.get('OPENAI_MODEL_TEXT') ?? 'gpt-4o'
  const fallbackModel = Deno.env.get('OPENAI_MODEL_FALLBACK') ?? 'gpt-4o-mini'

  const minMonthly =
    typeof body.minMonthlyAmount === 'number' && Number.isFinite(body.minMonthlyAmount)
      ? Math.max(1, Math.round(body.minMonthlyAmount))
      : 200

  const schemaHint = `{
  "classifications": [{
    "candidate_id": "c0",
    "destination": "monthly",
    "suggested_name": "Payroll",
    "bank_payee": "PAYROLL GRP",
    "category": "payroll",
    "suggested_amount": 17851.52,
    "due_day": 2,
    "due_months": [],
    "schedule": "",
    "confidence": 80,
    "confidence_label": "high",
    "amount_method": "recent run total",
    "reasoning": "",
    "warnings": [],
    "question_for_user": "",
    "reason_excluded": ""
  }],
  "extra_monthly": [],
  "extra_reserve": [],
  "confirm_first": []
}`

  const userContent = `Classify EVERY candidate. Meaningful monthly threshold £${minMonthly}.
Period: ${JSON.stringify(body.analysisPeriod ?? null)}
File: ${body.fileName ?? 'statement'}

Schema:
${schemaHint}

Candidates (${candidates.length}):
${JSON.stringify(candidates)}`

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

  async function callOpenAi(modelName: string): Promise<Response> {
    return fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelName,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: buildClassifyPrompt(minMonthly) },
          { role: 'user', content: userContent },
        ],
        temperature: 0.1,
        max_tokens: 8000,
      }),
    })
  }

  try {
    let response = await callOpenAi(preferredModel)
    if (response.status === 429) {
      await sleep(3000)
      response = await callOpenAi(preferredModel)
    }
    if (response.status === 429 && fallbackModel !== preferredModel) {
      await sleep(2000)
      response = await callOpenAi(fallbackModel)
    }

    if (!response.ok) {
      const errText = await response.text()
      console.error('OpenAI error', response.status, errText.slice(0, 800))
      let detail = 'AI analysis failed. Please try again later.'
      if (response.status === 429) {
        detail =
          'OpenAI is temporarily limiting requests (busy). Wait about a minute, then upload again.'
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

    const analysis = buildAnalysisFromClassifications(
      candidates,
      parsed,
      body.analysisPeriod ?? null,
    )

    if (
      !Array.isArray(analysis.monthly_accruing_suggestions) ||
      !Array.isArray(analysis.reserve_planner_suggestions)
    ) {
      return jsonResponse({ error: 'AI response did not match the expected structure.' }, 502)
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
      return jsonResponse({ analysis, businessId, usedAt })
    }

    return jsonResponse({ analysis, businessId, usedAt: null })
  } catch (err) {
    console.error(err)
    return jsonResponse({ error: 'AI analysis failed unexpectedly.' }, 500)
  }
})
