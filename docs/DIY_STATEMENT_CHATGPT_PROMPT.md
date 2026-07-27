# DIY ChatGPT prompt — statement → Cash Prophet setup

## How Cash Prophet will use this (product note)

During onboarding (per business):

1. Ask: **“What is a meaningful monthly amount for this business?”**  
   Default suggestion: **£200** (user can change — e.g. £150 or £500).
2. Show **Copy prompt** — the copied text already has their number filled in (replace `{{MIN_MONTHLY}}` below).
3. User pastes into their own ChatGPT + uploads that business’s statement/CSV.
4. They enter the tables into Cash Prophet for **that business** (repeat per business / as needed for multi-venue setups).

Most customers = one business. Multi-business = one analysis pass per business.

---

## Prompt (copy from here)

For a manual test: replace every `{{MIN_MONTHLY}}` with e.g. `200` before pasting into ChatGPT.

```
You are helping me set up Cash Prophet (UK small-business cash position tool — not bookkeeping).

I will upload bank statement(s) or a transaction export for ONE business (CSV preferred).

GOAL
A short FIRST DRAFT of what I should type into Cash Prophet for this business:
A) Monthly commitments (dashboard)
B) Reserve Planner (quarterly / six-monthly / annual / large irregular)

Tables first. No essay. No extra columns beyond the headers given.

MY MEANINGFUL MONTHLY THRESHOLD
- Ignore tiny recurring noise under about £{{MIN_MONTHLY}} per month (small software, tiny terminal fees, etc.) → Not imported.
- DO NOT use that threshold as an excuse to drop important regular costs that are clearly monthly but variable, or that sit near the line.
- If a monthly payee is typically around or above £{{MIN_MONTHLY}}, INCLUDE it (use an average / median / recent weight as appropriate).
- Examples that should usually STILL be included when they recur monthly: finance agreements, pensions, rates, utilities, waste, sports/TV if regular, drinks/wholesale if clearly monthly, HMRC monthly tax deductions, large revolving credit repayments (e.g. Capital on Tap) even when the amount moves.

WEEKLY VS MONTHLY (critical)
- If the same payee is paid roughly every 7 days, or several times in most months, that is WEEKLY / frequent operational spend → Not imported. Do NOT invent a single “monthly” total for it.
- Entertainment / machine / supplier DDs that fire multiple times per month are weekly-style — exclude from Monthly.
- Monthly = about one payment per calendar month (or one clear monthly standing order), day usually within ±3 days.

WHAT GOES WHERE
MONTHLY
- Once per month (≈25–35 day spacing or once per calendar month).
- Variable monthly is still MONTHLY (HMRC SDDS, Capital on Tap, utilities) — use 🟠 or 🔴, not Reserve.
- Finance DDs that continue every month stay Monthly even if the amount changed once — use latest normal instalment or recent median; 🟠 if restructuring/uncertain.
- Sort by Day of month (1→31).
- Keep distinct Names (Quantum Funding, Arkle Finance, Close Brothers — not three rows all called “Finance”).

RESERVE PLANNER
- Only non-monthly: quarterly, six-monthly, annual, or large once-a-year style bills.
- Quarterly: list ALL due months in the cycle (e.g. Mar, Jun, Sep, Dec) even if the file only shows some of them; mark 🟠/🔴 if incomplete evidence.
- Also include large annual / irregular bills (insurance, licences, big one-offs that repeat yearly). Prefer items roughly in the thousands, or at least about half of a typical month’s total meaningful commitments for this business — skip small annual noise.
- Never put a every-month payment in Reserve.

PAYROLL
- Early-month cluster to multiple people / PAYROLL or WAGE group → ONE Monthly row “Payroll” with one recent-run total. Not per employee. Exclude dividends.

AMOUNTS
- One number only — never ranges.
- Fixed → latest repeated amount.
- Stable variable → median of last ~6.
- Recent jump → weight last 3–4 more heavily.
- Large variable monthly (credit facility / tax) → recent average or median, Status 🔴 or 🟠, still INCLUDE in Monthly.

NAMES
- Short Cash Prophet label + Bank payee for matching.
- Unknown purpose (e.g. large quarterly transfer) → keep payee-like Name, Status 🔴.

STATUS
🟢 = consistent amount and day — enter as-is
🟠 = clear schedule, amount estimated — enter then check
🔴 = include as draft but I must decide (highly variable, purpose unknown, or incomplete cycle)

OUTPUT — exact headers only (no Category, Notes, or “how calculated”)

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
2) One line: 🟢 enter · 🟠 enter then check · 🔴 decide before trusting
```

---

## Verdict on the second test run (for iteration)

**Better:** leaner table, correct columns, VAT + Papas with full quarter months, payroll one line, ENGIE recent-weighted.

**Too aggressive / wrong exclusions:**
- Dropped TNT, Vimto, Arkle, HMRC SDDS, Capital on Tap — those should stay as Monthly (variable → 🟠/🔴).
- Included 501 Entertainment as Monthly — should be Not imported (weekly / multi-per-month).
- Reserve only VAT + Papas — also hunt large annuals (insurance etc.) when evidence exists.

**Product fix:** `{{MIN_MONTHLY}}` is filled from the user’s onboarding answer (default 200), not hard-coded forever.

---

## Testing

1. Replace `{{MIN_MONTHLY}}` with `200` (or your chosen floor).  
2. Fresh ChatGPT chat + this prompt + statement.  
3. Expect: Arkle / Cap on Tap / HMRC monthly / TNT / Vimto in Monthly if ≥ threshold; 501 out; Papas+VAT in Reserve; more annual larges if present.
