# DIY ChatGPT prompt — statement → Cash Prophet setup

Copy everything in the **Prompt** section into a **fresh ChatGPT** chat, then upload your bank statement / transaction CSV (or PDF). Use the tables to type into Cash Prophet.

**Use this version only** — older prompts return extra columns and too many small lines.

---

## Prompt (copy from here)

```
You are helping me set up Cash Prophet (UK small-business cash position tool — not bookkeeping software).

I will upload bank statement(s) or a transaction export (CSV preferred, PDF/Excel also fine). Read the outgoings carefully across the whole period.

GOAL
A short FIRST DRAFT of what I should type into Cash Prophet — only meaningful recurring costs.
Tables only first. No essay. No extra columns.

HARD FILTER — READ BEFORE ANYTHING ELSE
- MONTHLY table: only include a row if the typical amount is £200 or more per month.
- Drop anything under £200/month (internet, small software, card terminal fees, small cylinders, etc.) → Not imported.
- RESERVE table: only quarterly / six-monthly / annual patterns. A single payment is usually worth listing if about £500+.
- If a payee is paid weekly or several times a month (e.g. entertainment / machine / drinks suppliers with multiple DDs), do NOT put them in Monthly. Put them in Not imported as “frequent operational spend”.

WHAT GOES WHERE (strict)
MONTHLY = one payment (or one clear monthly total) about once per calendar month, day usually within ±3 days.
RESERVE = not monthly. Spacing roughly 80–100 days (quarterly), ~6 months, or ~yearly.
- If it happens every month, it is MONTHLY — never Reserve. Example: HMRC SDDS every month → Monthly, not Reserve.
- If it is quarterly, list ALL four due months even if the file only shows two (e.g. Mar/Jun seen → still output Mar, Jun, Sep, Dec) and use 🟠 or 🔴.
- Never put a normal monthly bill in Reserve.

PAYROLL
- Cluster of payments to different people early in the month (payroll/wage group) → ONE Monthly row: Name = Payroll, one total from a recent run.
- Not one row per employee. Exclude dividends.

AMOUNTS
- One number only — never ranges.
- Fixed repeats → latest repeated amount.
- Variable but stable → median of last ~6, rounded.
- Recent jump (e.g. electricity) → weight last 3–4 much more than older history.

NAMES
- Name = short label for Cash Prophet (Electricity, Business Rates, Quantum Funding, Arkle Finance — keep finance lines DISTINCT, do not rename all to “Finance”).
- Bank payee = exact-ish statement name for matching.
- If purpose unknown, Name can match the payee; Status must be 🔴.

STATUS (only these meanings)
🟢 Green = amount and day almost the same each time — enter as-is
🟠 Amber = clear schedule, amount estimated — enter then check
🔴 Red = draft only — I must decide (variable, purpose unknown, or incomplete history)

OUTPUT — use EXACTLY these headers. Do not add Category, Notes, or “How you got the amount”.

Sort Monthly by Day of month (1→31).

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

## What this run taught us (Laser Quest sample)

ChatGPT’s first reply was useful but used an older wide table and failed several rules. Expected cleanup:

**Keep as Monthly (£200+)**  
Payroll · Quantum Funding · NNDR · Arkle · Close Brothers · TNT Sports · Scanlite · ENGIE · Veolia · NEST  
(Accountant £158 is under £200 — exclude unless you lower the threshold.)

**Drop from Monthly (under £200 or multi-per-month)**  
Zen · Intuit · TakePayments ×2 · BOC · 501 Entertainment → Not imported

**Reserve**  
- VAT quarterly → Mar/Jun/Sep/Dec  
- Papas £9,000 → Mar/Jun/**Sep/Dec** (all four), 🔴 purpose  
- HMRC SDDS monthly → **Monthly**, not Reserve  
- Riva insurance annual → Reserve, 🔴 confirm

---

## Testing notes

- Fresh chat every time; paste **this** prompt only  
- Fail the run if: any monthly row &lt; £200; monthly item in Reserve; quarterly missing months; extra columns  
- Paste the next reply here to iterate again
