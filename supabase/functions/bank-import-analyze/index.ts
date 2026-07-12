import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `You are assisting a UK small-business owner in setting up a simple financial management system.

You are not preparing accounts, submitting tax returns or giving regulated financial advice.

Analyse the supplied bank transaction groups and identify patterns that may help pre-fill:

A. Monthly Accruing — costs that build up continuously or recur regularly (payroll, rent, utilities, finance agreements, regular software).

B. Reserve Planner — irregular, quarterly, annual or uneven bills where money should be built up in advance (VAT, corporation tax, annual insurance, licences, quarterly rent).

C. Expected Receipts — only identifiable, non-routine future money that is sufficiently certain. Do NOT treat daily card takings as expected receipts.

D. Manual Review — uncertain HMRC payments, credit-card repayments (double-count risk), ambiguous items.

Exclude internal transfers, refunds, normal card settlement income, and random one-off purchases.

Never silently assume every HMRC payment is VAT or corporation tax.

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
  const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
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
    fileName?: string
  }

  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid request body' }, 400)
  }

  const groups = body.groups ?? []
  if (!Array.isArray(groups) || groups.length === 0) {
    return jsonResponse({ error: 'No transaction groups to analyse' }, 400)
  }

  const model = Deno.env.get('OPENAI_MODEL_TEXT') ?? 'gpt-4o-mini'
  const maxGroups = 40
  const chunk = groups.slice(0, maxGroups)

  const userPayload = {
    analysis_period: body.analysisPeriod,
    scope: { level: body.scopeLevel, id: body.scopeId },
    transaction_groups: chunk,
    instructions:
      'Suggest monthly_accruing_suggestions, reserve_planner_suggestions, expected_receipt_suggestions, manual_review_items, excluded_patterns. Include evidence dates and amounts. Confidence 0-100.',
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

    return jsonResponse({ analysis: parsed })
  } catch (err) {
    console.error(err)
    return jsonResponse({ error: 'AI analysis failed unexpectedly.' }, 500)
  }
})
