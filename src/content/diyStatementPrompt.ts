/**
 * DIY ChatGPT prompt for statement → Cash Prophet setup.
 * Keep generic — any UK business / bank. Inject thresholds before copy.
 */

export const DIY_STATEMENT_DEFAULT_MIN_MONTHLY = 200
export const DIY_STATEMENT_DEFAULT_MIN_RESERVE_ANNUAL = 3000

const DIY_STATEMENT_PROMPT_TEMPLATE = `You are helping me set up Cash Prophet (UK small-business cash position tool — not bookkeeping).

I will upload bank statement(s) or a transaction export for ONE business (CSV preferred). Work only from this file. Do not assume industry or known suppliers.

GOAL
FIRST DRAFT for Cash Prophet:
A) Monthly commitments
B) Reserve Planner (quarterly / six-monthly / annual / large non-monthly)

Tables first. No essay. Exact headers only.

MEANINGFUL MONTHLY THRESHOLD = £{{MIN_MONTHLY}}
- Drop small recurring noise clearly under this amount per month → Not imported.
- Do not drop clear monthly costs that are around/above the threshold just because the amount varies.

RESERVE SIZE THRESHOLD = about £{{MIN_RESERVE_ANNUAL}} per year (or a single payment that is material on that scale)
- Prefer Reserve items at or above this scale. Skip small annual noise.
- A quarterly bill of about £{{MIN_RESERVE_QUARTER}} or more also qualifies.

ONE DAY ONLY
- Day of month and Due day must be a single integer 1–31 (e.g. 2 or 24).
- Never output ranges like 1–2 or 26–30. Use the most common day, or the median of recent days if it wobbles.

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
Include in Reserve when ANY of these fit:
1) Quarterly-ish spacing (~80–100 days) or the same 4 month-slots each year — list ALL due months in the cycle (e.g. Mar, Jun, Sep, Dec) even if only some appear in the file; 🟠/🔴 if incomplete.
2) Six-monthly or annual repeats (same month ± a few weeks across years).
3) Large non-monthly bills that matter for cash planning: tax (VAT / corporation tax when identifiable), insurance, licences, large landlord/management/property-style payments, other big yearly charges.
4) Respect the Reserve size threshold above.

Purpose unknown is fine: keep a payee-based Name, Status 🔴, but STILL list it in Reserve if the schedule and size qualify.

Never put every-month payments in Reserve.

PAYROLL
- Early-month cluster to multiple people / payroll or wage wording → ONE Monthly row “Payroll”, one recent-run total. Not per person. Exclude dividends.

AMOUNTS
- One number only — never ranges.
- Fixed → latest repeated amount.
- Stable variable → median of ~last 6.
- Recent level change → weight last 3–4 more.
- Large variable monthly → include with estimate; 🟠 or 🔴.

NAMES
- Name = short plain label for Cash Prophet (e.g. Electricity, Business rates, Pension, Payroll, Waste).
- Do NOT put account numbers, policy refs, agreement IDs, or long reference codes in Name — keep those only in Bank payee if present.
- Prefer a clear everyday label when the payee type is obvious; if purpose is unclear, use a short payee-based Name and Status 🔴.
- Bank payee = as on the statement, for matching (may include refs).
- Separate policies / agreements to the same insurer or lender → separate rows with distinct short Names if the amounts/schedules differ.

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
1) “Confirm these first” — max 5 bullets
2) 🟢 enter · 🟠 enter then check · 🔴 decide before trusting`

export function buildDiyStatementPrompt(options: {
  minMonthly: number
  minReserveAnnual: number
}): string {
  const minMonthly = Math.max(1, Math.round(options.minMonthly))
  const minReserveAnnual = Math.max(1, Math.round(options.minReserveAnnual))
  const minReserveQuarter = Math.max(1, Math.round(minReserveAnnual / 4))

  return DIY_STATEMENT_PROMPT_TEMPLATE.replaceAll('{{MIN_MONTHLY}}', String(minMonthly))
    .replaceAll('{{MIN_RESERVE_ANNUAL}}', String(minReserveAnnual))
    .replaceAll('{{MIN_RESERVE_QUARTER}}', String(minReserveQuarter))
}
