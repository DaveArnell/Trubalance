import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { getAnonKey, getServiceRoleKey } from '../_shared/supabaseEnv.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Exact DIY ChatGPT prompt (src/content/diyStatementPrompt.ts).
 * Keep in sync — this is what produced the good ChatGPT DIY results.
 */
function buildDiyPrompt(minMonthly: number): string {
  return `You are helping me set up Cash Prophet (UK small-business cash position tool — not bookkeeping).

I will upload bank statement(s) or a transaction export for ONE business (CSV preferred). Work only from this file. Do not assume industry or known suppliers.

GOAL
FIRST DRAFT for Cash Prophet:
A) Monthly commitments
B) Reserve Planner (quarterly / six-monthly / annual / large non-monthly)

Tables first. No essay. Exact headers only.

MEANINGFUL MONTHLY THRESHOLD = £${minMonthly}
(If you still see the literal text "{{MIN_MONTHLY}}", treat it as 200.)
- Drop anything under this amount per month → Not imported. Do not list it in Monthly.
- Do not drop clear monthly costs that are around/above the threshold just because the amount varies.

ONE DAY ONLY
- Day of month and Due day must be a single integer 1–31 (e.g. 2 or 24).
- Never output ranges like 1–2 or 26–30. Use the most common day, or the median of recent days if it wobbles.
- NEVER default every row to day 1. Only use 1 when payments clearly cluster on the 1st.

WEEKLY VS MONTHLY VS RESERVE
- Several times most months / ~weekly → Not imported (do not invent a monthly total).
- Dividends → Not imported (not a monthly commitment).
- About once per calendar month → Monthly. Include council / business rates / NNDR instalments even if they skip a month or two. Water / waste is often quarterly or six-monthly — do not force those into Monthly.
- Roughly every 3 / 6 / 12 months, or same month(s) each year → Reserve Planner — even if the payee name looks odd, like a person, brand, or “transfer”.
- Large one-off or once-in-the-file bills at or above about 5× the monthly threshold → Reserve Planner (due month = the month it fell). That is what Reserve is for.
- Do NOT dump large cyclical or large irregular payments into Not imported as “irregular” or “internal”. Not imported is for weekly noise, transfers, income, and small stuff.

MONTHLY RULES
- Variable monthly (tax, utilities, finance, revolving credit, business rates) stays Monthly — 🟠/🔴, not Reserve.
- Must appear in most months across a meaningful stretch. If it only appears a few times a year, or only in a short recent window without a clear every-month pattern, do NOT force it into Monthly — put it in Reserve if it is material.
- Sort Monthly by Day of month ascending.
- Distinct Names per payee (do not merge different finance agreements into one vague name).

RESERVE PLANNER RULES (important — do not under-fill this table)
First estimate a typical “meaningful monthly” total for this business from the Monthly candidates (rough sense of scale).
Include in Reserve when ANY of these fit:
1) Quarterly-ish spacing (~80–100 days) or the same 4 month-slots each year — list ALL due months in the cycle (e.g. Mar, Jun, Sep, Dec) even if only some appear in the file; 🟠/🔴 if incomplete.
2) Six-monthly or annual repeats (same month ± a few weeks across years).
3) Large non-monthly bills that matter for cash planning: tax (VAT / corporation tax when identifiable), insurance, licences, annual software, large landlord/management/property-style payments, other big yearly or one-off charges.
4) Size guide: include only if (typical amount × due months in a year) is at least about 5× the monthly threshold (threshold £200 → about £1,000+ per year), or a single payment is at least about 2× the threshold. Skip small annual noise (streaming, small shops).
5) Same payee, mixed sizes: if a payee has a regular large repeating amount plus smaller extras, keep ONLY the large repeating cluster. Do not average or merge the small ones in.
6) HMRC: VAT is usually one quarterly row (e.g. Mar, Jun, Sep, Dec). Annual corporation-tax style payments (often “Shipley”) are ONE month and the large payment only — do not merge two different months into one row.

Purpose unknown is fine: keep a payee-based Name, Status 🔴, but STILL list it in Reserve if the schedule and size qualify.
Never put every-month payments in Reserve.

PAYROLL
- Early-month cluster to multiple people / payroll or wage wording → ONE Monthly row “Payroll”, one recent-run total. Not per person. Exclude dividends.

AMOUNTS
- One number only — never ranges.
- Keep pence where the statement shows them.
- Fixed → latest repeated amount.
- Stable variable → median of ~last 6.
- Recent level change → weight last 3–4 more.
- Large variable monthly → include with estimate; 🟠 or 🔴.

NAMES
- Short name from the bank payee. Keep it generic — any UK business.
- Only use a purpose label when those words are on the payee (Payroll, HMRC, NEST, Mailchimp, business rates). Never put HMRC or Payroll on a different supplier.
- Do not invent purpose when unsure — keep the cleaned payee name.

STATUS
🟢 consistent — enter
🟠 estimated — enter then check
🔴 draft — decide first

OUTPUT

### Monthly commitments
| Status | Name | Bank payee | Day of month | Amount (£) |
| --- | --- | --- | --- | --- |

### Reserve Planner
| Status | Name | Bank payee | Due day | Due months | Amount (£) |
| --- | --- | --- | --- | --- | --- |

### Not imported (noticed only)
| Bank payee | Why excluded |
| --- | --- |

After tables, only:
1) “Confirm these first” — max 5 bullets (advisory notes only — do NOT invent table rows for these)
2) 🟢 enter · 🟠 enter then check · 🔴 decide before trusting`
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

function splitMarkdownRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '')
  return trimmed.split('|').map((cell) => cell.trim())
}

function isSeparatorRow(cells: string[]): boolean {
  return cells.length > 0 && cells.every((cell) => /^:?-+:?$/.test(cell.replace(/\s/g, '')))
}

function parseMarkdownTables(markdown: string): Record<string, string[][]> {
  const lines = markdown.split(/\r?\n/)
  const tables: Record<string, string[][]> = {}
  let currentTitle = ''
  let currentRows: string[][] = []

  const flush = () => {
    if (currentTitle && currentRows.length > 0) {
      tables[currentTitle] = currentRows
    }
    currentRows = []
  }

  for (const line of lines) {
    const heading = line.match(/^#{1,6}\s*(.+?)\s*$/)
    if (heading) {
      flush()
      currentTitle = heading[1]!.toLowerCase()
      continue
    }
    if (!line.trim().startsWith('|')) continue
    const cells = splitMarkdownRow(line)
    if (cells.length === 0 || isSeparatorRow(cells)) continue
    currentRows.push(cells)
  }
  flush()
  return tables
}

function findTable(tables: Record<string, string[][]>, ...needles: string[]): string[][] {
  for (const [title, rows] of Object.entries(tables)) {
    if (needles.some((n) => title.includes(n))) return rows
  }
  // Fallback: scan all rows for a header that matches
  for (const rows of Object.values(tables)) {
    if (rows.length === 0) continue
    const header = rows[0]!.join(' ').toLowerCase()
    if (needles.some((n) => header.includes(n))) return rows
  }
  return []
}

function parseAmount(raw: string): number {
  const cleaned = raw.replace(/[£$,\s]/g, '').replace(/[^\d.-]/g, '')
  const n = Number(cleaned)
  return Number.isFinite(n) ? Math.round(Math.abs(n) * 100) / 100 : 0
}

function parseDay(raw: string): number | null {
  const trimmed = raw.trim()
  // Exact day cell only — avoid pulling "1" out of amounts or month lists.
  if (/^(?:[1-9]|[12]\d|3[01])(?:st|nd|rd|th)?$/i.test(trimmed)) {
    return Number(trimmed.replace(/\D/g, ''))
  }
  const match = trimmed.match(/^(?:day\s*)?([1-9]|[12]\d|3[01])$/i)
  if (!match) return null
  return Number(match[1])
}

function statusToConfidence(status: string): { confidence: number; label: 'high' | 'medium' | 'low' } {
  if (status.includes('🟢') || /consistent|high/i.test(status)) {
    return { confidence: 85, label: 'high' }
  }
  if (status.includes('🔴') || /draft|decide|low/i.test(status)) {
    return { confidence: 40, label: 'low' }
  }
  return { confidence: 70, label: 'medium' }
}

function parseConfirmNotes(markdown: string): string[] {
  const section = markdown.split(/Confirm these first/i)[1] ?? ''
  return section
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*•\d.)\s]+/, '').trim())
    .filter((line) => line.length > 8 && !line.startsWith('🟢') && !/^confirm$/i.test(line))
    .slice(0, 5)
}

function analysisFromDiyMarkdown(
  markdown: string,
  analysisPeriod: unknown,
): Record<string, unknown> {
  const tables = parseMarkdownTables(markdown)
  const monthlyRows = findTable(tables, 'monthly commitment', 'monthly')
  const reserveRows = findTable(tables, 'reserve planner', 'reserve')
  const excludedRows = findTable(tables, 'not imported', 'excluded')

  const monthlyHeader = monthlyRows[0]?.map((c) => c.toLowerCase()) ?? []
  const monthlyData = monthlyHeader.some((h) => h.includes('status'))
    ? monthlyRows.slice(1)
    : monthlyRows

  const reserveHeader = reserveRows[0]?.map((c) => c.toLowerCase()) ?? []
  const reserveData = reserveHeader.some((h) => h.includes('status'))
    ? reserveRows.slice(1)
    : reserveRows

  const excludedHeader = excludedRows[0]?.map((c) => c.toLowerCase()) ?? []
  const excludedData = excludedHeader.some((h) => h.includes('payee') || h.includes('why'))
    ? excludedRows.slice(1)
    : excludedRows

  const monthly_accruing_suggestions = monthlyData
    .filter((row) => row.length >= 4)
    .map((row) => {
      const status = row[0] ?? ''
      const name = row[1] ?? ''
      const bankPayee = row[2] ?? ''
      const day = parseDay(row[3] ?? '')
      const amount = parseAmount(row[4] ?? row[3] ?? '0')
      const { confidence, label } = statusToConfidence(status)
      return {
        suggested_name: name || bankPayee || 'Monthly cost',
        bank_payee: bankPayee,
        supplier_group: bankPayee,
        category: /payroll/i.test(name) ? 'payroll' : /hmrc|vat|tax/i.test(`${name} ${bankPayee}`) ? 'hmrc' : 'supplier',
        frequency: 'monthly',
        suggested_monthly_amount: amount,
        amount_method: 'DIY table',
        suggested_due_day: day,
        confidence,
        confidence_label: label,
        evidence: [],
        reasoning_summary: '',
        warnings: [],
      }
    })
    .filter((row) => row.suggested_monthly_amount > 0 || row.suggested_name)

  const reserve_planner_suggestions = reserveData
    .filter((row) => row.length >= 5)
    .map((row) => {
      const status = row[0] ?? ''
      const name = row[1] ?? ''
      const bankPayee = row[2] ?? ''
      const day = parseDay(row[3] ?? '')
      const months = (row[4] ?? '')
        .split(/[,;/]/)
        .map((m) => m.trim())
        .filter(Boolean)
      const amount = parseAmount(row[5] ?? '0')
      const { confidence, label } = statusToConfidence(status)
      return {
        suggested_name: name || bankPayee || 'Reserve bill',
        bank_payee: bankPayee,
        category: /hmrc|vat|tax/i.test(`${name} ${bankPayee}`) ? 'hmrc' : 'other',
        schedule: months.length >= 4 ? 'quarterly' : months.length <= 1 ? 'annual' : 'specific_months',
        suggested_annual_amount: amount,
        suggested_monthly_reserve: Math.round((amount / 12) * 100) / 100,
        likely_payment_months: months,
        likely_due_day: day,
        amount_method: 'DIY table',
        confidence,
        confidence_label: label,
        evidence: [],
        reasoning_summary: '',
        warnings: [],
      }
    })
    .filter((row) => row.suggested_annual_amount > 0 || row.suggested_name)

  const excluded_patterns = excludedData
    .filter((row) => row.length >= 1 && (row[0] ?? '').trim())
    .map((row) => ({
      supplier_group: row[0] ?? '',
      reason_excluded: row[1] ?? 'Not imported',
    }))

  return {
    analysis_period: analysisPeriod,
    monthly_accruing_suggestions,
    reserve_planner_suggestions,
    expected_receipt_suggestions: [],
    manual_review_items: [],
    confirm_notes: parseConfirmNotes(markdown),
    excluded_patterns,
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
    ledger?: string
    payeeEvidence?: string
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

  const ledger = typeof body.ledger === 'string' ? body.ledger.trim() : ''
  const payeeEvidence =
    typeof body.payeeEvidence === 'string' ? body.payeeEvidence.trim() : ''
  if (!ledger && !payeeEvidence) {
    return jsonResponse({ error: 'No statement transactions to analyse.' }, 400)
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

  // Prefer the same quality class as ChatGPT DIY. Override with OPENAI_MODEL_TEXT if needed.
  const preferredModel = Deno.env.get('OPENAI_MODEL_TEXT') ?? 'gpt-4o'

  const minMonthly =
    typeof body.minMonthlyAmount === 'number' && Number.isFinite(body.minMonthlyAmount)
      ? Math.max(1, Math.round(body.minMonthlyAmount))
      : 200

  const diyPrompt = buildDiyPrompt(minMonthly)
  const lineCount = ledger.split('\n').filter((l) => l.trim()).length
  const evidenceBlock = payeeEvidence
    ? `PAYEE EVIDENCE (computed from the full statement — use due_day, typical_amount, and payment_months when the bank_payee matches; do not invent day 1 or round away pence):

\`\`\`csv
${payeeEvidence}
\`\`\`
`
    : ''

  const ledgerBlock = ledger
    ? `Below is a compact CSV extract for ONE business (date, description, amount).
Negative amounts are money out. Use this for anything missing from PAYEE EVIDENCE (e.g. rent / landlord / large one-offs).

\`\`\`csv
date,description,amount
${ledger
  .split('\n')
  .filter((l) => l.trim())
  .map((line) => {
    const [date, description, amount] = line.split('\t')
    const desc = (description ?? '').replace(/"/g, '""')
    return `${date ?? ''},"${desc}",${amount ?? ''}`
  })
  .join('\n')}
\`\`\`
`
    : ''

  const userContent = `File name: ${body.fileName ?? 'statement.csv'}
Analysis period: ${JSON.stringify(body.analysisPeriod ?? null)}
Rows in ledger extract: ${lineCount} (money-out lines; most recent history preferred)

${evidenceBlock}
${ledgerBlock}
Follow the instructions exactly. Output the three markdown tables with Exact headers only.
Fill Monthly and Reserve thoroughly (payroll, utilities, finance, VAT/tax, rent/property, insurance, licences) when the evidence supports them.
Never invent blank “Confirm” table rows.`

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

  function retryWaitMs(response: Response): number {
    const header = response.headers.get('retry-after')
    if (header) {
      const asSeconds = Number(header)
      if (Number.isFinite(asSeconds) && asSeconds > 0) {
        return Math.min(70_000, Math.max(20_000, Math.round(asSeconds * 1000)))
      }
    }
    return 55_000
  }

  async function callOpenAi(modelName: string): Promise<Response> {
    return fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: 'system', content: diyPrompt },
          { role: 'user', content: userContent },
        ],
        temperature: 0.1,
        max_tokens: 8000,
      }),
    })
  }

  try {
    let response = await callOpenAi(preferredModel)
    // One patient retry only — repeated retries burn tokens/minute and make limits worse.
    if (response.status === 429) {
      const waitMs = retryWaitMs(response)
      console.warn(`OpenAI 429 — single wait ${waitMs}ms then one retry`)
      await sleep(waitMs)
      response = await callOpenAi(preferredModel)
    }

    if (!response.ok) {
      const errText = await response.text()
      console.error('OpenAI error', response.status, errText.slice(0, 800))
      let detail = 'AI analysis failed. Please try again later.'
      if (response.status === 429) {
        detail =
          'Analysis is queued behind OpenAI capacity. Keep this page open and try once more in about a minute — do not upload repeatedly.'
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

    const analysis = analysisFromDiyMarkdown(content, body.analysisPeriod ?? null)
    const monthlyCount = Array.isArray(analysis.monthly_accruing_suggestions)
      ? analysis.monthly_accruing_suggestions.length
      : 0

    if (monthlyCount === 0) {
      console.error('DIY markdown parse produced no monthly rows. Snippet:', content.slice(0, 500))
      return jsonResponse(
        {
          error:
            'AI returned a draft we could not read as tables. Please try again in a minute.',
          code: 'DIY_TABLE_PARSE_EMPTY',
        },
        502,
      )
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
      return jsonResponse({ analysis, businessId, usedAt, diyMarkdown: content })
    }

    return jsonResponse({ analysis, businessId, usedAt: null, diyMarkdown: content })
  } catch (err) {
    console.error(err)
    return jsonResponse({ error: 'AI analysis failed unexpectedly.' }, 500)
  }
})
