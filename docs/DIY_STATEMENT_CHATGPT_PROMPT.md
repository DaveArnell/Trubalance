# DIY ChatGPT prompt — statement → Cash Prophet setup

Copy everything in the **Prompt** section into a **fresh ChatGPT** chat, then upload your bank statement / transaction CSV (or PDF). Use the tables to type into Cash Prophet.

---

## Prompt (copy from here)

```
You are helping me set up Cash Prophet (UK small-business cash position tool — not bookkeeping software).

I will upload bank statement(s) or a transaction export (CSV preferred, PDF/Excel also fine). Read the outgoings carefully across the whole file.

GOAL
Produce a short, usable FIRST DRAFT of what I should type into Cash Prophet:
A) Monthly commitments on the dashboard
B) Reserve Planner bills (quarterly / six-monthly / annual only)

Do NOT write a long essay. Tables first. Keep the list lean.

MEANINGFUL AMOUNT FILTER (important)
- Only include an item if its typical monthly total is about £200 or more (or a quarterly/annual bill whose single payment is material, generally £500+).
- Ignore small subscriptions, tiny standing orders, and low-value noise unless I ask.
- If the same payee appears as several small weekly payments, do NOT invent a monthly line for them — exclude as weekly ops spend.

WHAT GOES WHERE
1) MONTHLY COMMITMENTS
   - Happens about once per month (roughly every 25–35 days), or once per calendar month on a recognisable day.
   - Output: Status, Name, Bank payee, Day of month, Amount (£).
   - One amount only — never a range.
   - Sort the monthly table by Day of month ascending (1 → 31).

2) RESERVE PLANNER (not monthly)
   - Only if the pattern is clearly quarterly, six-monthly, or annual.
   - You MUST list EVERY due month in the cycle (e.g. rent every quarter → Mar, Jun, Sep, Dec — all four, not two).
   - If you only see two of four quarters in the file, still propose the full cycle if the spacing is clearly quarterly, and mark Status 🟠 or 🔴 with that limitation.
   - Do NOT put ordinary monthly bills in Reserve Planner.
   - Output: Status, Name, Bank payee, Due day, Due months, Amount (£).
   - Sort by next logical due month / day if possible.

PAYROLL
- If many payments to different people cluster in the first few working days of each month (payroll/wage wording helps), output ONE monthly row named "Payroll" with the total of a typical recent payroll run.
- Exclude dividends, reimbursements, and one-off transfers to individuals.

AMOUNT RULES
- Always ONE number (e.g. 2950 not 2000–3000).
- Identical repeats → latest repeated amount.
- Stable but variable → median of last ~6 comparable payments, rounded sensibly.
- Clear recent change (e.g. electricity jumped) → weight last 3–4 payments much more than older history.
- Prefer recent run-rate over long historical average.

NAMING
- "Name" = what I should type in Cash Prophet (short label). You may clarify (ENGIE → Electricity) OR keep the bank name if purpose is unclear.
- Always keep "Bank payee" as seen on the statement so I can match it.
- Do NOT invent purpose. If unsure (e.g. large quarterly transfer that might be rent), Name can stay as the payee and Status must be 🔴.

EXCLUDE
- Internal transfers between own accounts
- Refunds / money in / card settlement income
- One-offs and noise under the £200 monthly threshold
- Weekly operational suppliers (list under Not imported only)
- Do not turn weekly spend into a fake monthly commitment

STATUS COLOURS (use exactly these meanings)
🟢 Green = highly consistent amount and timing — safe default to enter
🟠 Amber = clear pattern, but amount or date needed estimating — enter then check
🔴 Red = still worth entering as a draft, but I must decide (wildly variable amount, recent jump, incomplete quarter history, or purpose unknown)

OUTPUT FORMAT — exact headers, nothing extra in the tables

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
1) A 3–5 line "Confirm these first" checklist
2) One line explaining Status colours again (🟢 / 🟠 / 🔴)
```

---

## What good looks like

- Lean list (not dozens of tiny lines)
- Monthly sorted by day
- Payroll = one row
- Quarterly rent / similar = all due months listed
- No weekly items as monthly
- No “how you calculated” / notes columns cluttering the table

## Testing notes (for Dave)

- Fresh ChatGPT chat each run
- Check £200+ filter, day ordering, quarterly months complete, weekly excluded
- Paste the model reply back here and we’ll tighten the prompt again
