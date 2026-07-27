# DIY ChatGPT prompt — statement → Cash Prophet setup

## How Cash Prophet will use this (product note)

During onboarding (per business):

1. Ask: **“What is a meaningful monthly amount for this business?”**  
   Default suggestion: **£200** (user can change).
2. Show **Copy prompt** — their number is already filled in (replaces `{{MIN_MONTHLY}}`).
3. User pastes into their own ChatGPT + uploads **that business’s** statement/CSV.
4. They enter the tables into Cash Prophet for that business (repeat per business if needed).

Most customers = one business. Multi-business = one pass per business.

This prompt must stay **generic** — any UK bank, any sector, any payees. Do not bake in one company’s suppliers.

---

## Prompt (copy from here)

For a manual test: replace every `{{MIN_MONTHLY}}` with e.g. `200` before pasting into ChatGPT.

```
You are helping me set up Cash Prophet (UK small-business cash position tool — not bookkeeping software).

I will upload bank statement(s) or a transaction export for ONE business (CSV preferred; PDF/Excel also fine). Banks, payees and industries vary — work only from the file I give you. Do not assume a particular type of business.

GOAL
A short FIRST DRAFT of what I should type into Cash Prophet for this business:
A) Monthly commitments (dashboard)
B) Reserve Planner (less frequent bills)

Tables first. No essay. No columns beyond the headers below.

MY MEANINGFUL MONTHLY THRESHOLD = £{{MIN_MONTHLY}}
- Use this only to drop small recurring noise below about that amount per month → Not imported.
- Do not drop a clear monthly cost just because the amount varies, or because it sits near the threshold.
- If a payee looks monthly and is typically around or above £{{MIN_MONTHLY}}, include it (with a single estimated amount).

WEEKLY VS MONTHLY
- Roughly every 7 days, or several payments to the same payee in most months → frequent/weekly operational spend → Not imported. Do not collapse those into a fake monthly line.
- Monthly = about one payment per calendar month (or one clear monthly standing order / direct debit), payment day usually within about ±3 days.

WHAT GOES WHERE
MONTHLY
- Recurs about once a month.
- Variable amount is still Monthly (tax deductions, utilities, revolving credit repayments, finance instalments, etc.) — use 🟠 or 🔴, not Reserve.
- If a monthly finance or subscription amount changed but still pays every month, keep it Monthly; use the latest normal amount or a recent median; mark 🟠 if uncertain.
- Sort by Day of month (1 → 31).
- Give each row a distinct Name (do not merge different payees under one vague label).

RESERVE PLANNER
- Only non-monthly patterns: quarterly, six-monthly, annual, or large bills that clearly do not fall every month.
- Quarterly / cyclical: list every due month in the cycle (e.g. all four quarter-months), even if the file only shows some occurrences; mark 🟠 or 🔴 if evidence is incomplete.
- Also include material annual or irregular bills when the history supports them (insurance, licences, large yearly charges). Prefer larger items — skip small annual noise.
- Never put a payment that happens every month into Reserve.

PAYROLL
- If several payments to different people cluster in the same few days each month (payroll/wage/salary wording helps), output ONE Monthly row named Payroll with one total from a typical recent run.
- Not one row per person. Exclude dividends and one-off personal transfers.

AMOUNTS
- Always one number — never a range.
- Same amount every time → that amount.
- Stable but variable → median of recent comparable payments (about the last 6), rounded sensibly.
- Clear recent change in level → weight the latest few payments more than older history.
- Large but variable monthly costs → still include; estimate with recent average/median; Status 🟠 or 🔴.

NAMES
- Name = short label for Cash Prophet (you may clarify a payee into a plain English label when confident).
- Bank payee = as on the statement, for matching.
- If purpose is unclear, do not invent it — keep a payee-based Name and use Status 🔴.

STATUS
🟢 = amount and day highly consistent — safe to enter
🟠 = clear schedule, amount estimated — enter then check
🔴 = include as a draft but I must decide (highly variable, purpose unknown, or incomplete cycle)

OUTPUT — exact headers only

### Monthly commitments
| Status | Name | Bank payee | Day of month | Amount (£) |
| --- | --- | --- | --- | --- |

### Reserve Planner
| Status | Name | Bank payee | Due day | Due months | Amount (£) |
| --- | --- | --- | --- | --- | --- |

### Not imported (noticed only)
| Bank payee | Why excluded |
| --- | --- |

After the tables, only:
1) “Confirm these first” — max 5 bullets
2) One line: 🟢 enter · 🟠 enter then check · 🔴 decide before trusting
```

---

## Internal testing notes (not part of the prompt)

When cold-testing, use different businesses/statements. Check that the model:

- Respects the user’s `{{MIN_MONTHLY}}` without wiping variable monthlies above it  
- Excludes true weeklies / multi-per-month payees  
- Keeps variable-but-monthly items in Monthly (not Reserve)  
- Lists full due-month cycles for quarterly/annual patterns  
- Stays generic (no assumptions about industry)

Do not add named suppliers from one test business back into the copy-paste prompt.
