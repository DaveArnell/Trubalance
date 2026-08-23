/**
 * DIY ChatGPT prompt for statement → Cash Prophet setup.
 * Keep generic — any UK business / bank. Inject monthly threshold before copy.
 *
 * Same rules as the copy-paste ChatGPT prompt. Keep the edge function in sync.
 * Must stay generic — any UK bank, any sector, any payees.
 */

export const DIY_STATEMENT_DEFAULT_MIN_MONTHLY = 200

const DIY_STATEMENT_PROMPT_TEMPLATE = `You are helping me set up Cash Prophet (UK small-business cash position tool — not bookkeeping).

I will upload bank statement(s) or a transaction export for ONE business (CSV preferred). Work only from this file. Do not assume industry or known suppliers.

GOAL
FIRST DRAFT for Cash Prophet:
A) Monthly commitments
B) Reserve Planner (quarterly / six-monthly / annual / large non-monthly)

Tables first. No essay. Exact headers only.

MEANINGFUL MONTHLY THRESHOLD = £{{MIN_MONTHLY}}
(If you still see the literal text "{{MIN_MONTHLY}}", treat it as 200.)
- Drop anything under this amount per month → Not imported. Do not list it in Monthly.
- Do not drop clear monthly costs that are around/above the threshold just because the amount varies.

ONE DAY ONLY
- Day of month and Due day must be a single integer 1–31 (e.g. 2 or 24).
- Never output ranges like 1–2 or 26–30. Use the most common day, or the median of recent days if it wobbles.
- NEVER default every row to day 1. Only use 1 when payments clearly cluster on the 1st.

WEEKLY VS MONTHLY VS RESERVE
- Several times most months / ~weekly → Not imported (do not invent a monthly total).
- About once per calendar month → Monthly.
- Roughly every 3 / 6 / 12 months, or same month(s) each year → Reserve Planner — even if the payee name looks odd, like a person, brand, or “transfer”.
- Do NOT dump large cyclical payments into Not imported as “irregular” or “internal” if the amount and spacing clearly repeat.

MONTHLY RULES
- Variable monthly (tax, utilities, finance, revolving credit) stays Monthly — 🟠/🔴, not Reserve.
- Must appear in most months across a meaningful stretch. If it only appears a few times a year, or only in a short recent window without a clear every-month pattern, do NOT force it into Monthly — put it in Reserve (if large/cyclical) or Not imported (if unclear).
- Sort Monthly by Day of month ascending.
- Distinct Names per payee (do not merge different finance agreements into one vague name).

RESERVE PLANNER RULES (important — do not under-fill this table)
First estimate a typical “meaningful monthly” total for this business from the Monthly candidates (rough sense of scale).
Include in Reserve when ANY of these fit:
1) Quarterly-ish spacing (~80–100 days) or the same 4 month-slots each year — list ALL due months in the cycle (e.g. Mar, Jun, Sep, Dec) even if only some appear in the file; 🟠/🔴 if incomplete.
2) Six-monthly or annual repeats (same month ± a few weeks across years).
3) Large non-monthly bills that matter for cash planning: tax (VAT / corporation tax when identifiable), insurance, licences, large landlord/management/property-style payments, other big yearly charges.
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
- Short Cash Prophet label + Bank payee for matching.
- Use a recognised purpose when the statement makes it obvious (generic UK only): NEST → Pension; Mailchimp (not the parent company name); HMRC VAT / HMRC monthly payment / HMRC annual payment; Payroll.
- Do not invent purpose when unsure → 🔴.

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

export function buildDiyStatementPrompt(options: { minMonthly: number }): string {
  const minMonthly = Math.max(1, Math.round(options.minMonthly))
  return DIY_STATEMENT_PROMPT_TEMPLATE.replaceAll('{{MIN_MONTHLY}}', String(minMonthly))
}
