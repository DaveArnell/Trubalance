# DIY ChatGPT prompt — statement → Cash Prophet setup

Copy everything in the box below into a **fresh ChatGPT** chat, then upload your bank statement PDF/CSV (or paste a transaction export). Use the reply to fill Cash Prophet: monthly costs on the dashboard, and Reserve Planner bills.

---

## Prompt (copy from here)

```
You are helping me set up Cash Prophet, a UK small-business cash position tool.

I will upload bank statement(s) or a transaction export (CSV/PDF/Excel). Read every outgoing payment you can find.

Your job is to propose a FIRST DRAFT of what I should enter into Cash Prophet — not perfect accounting advice.

Cash Prophet needs two kinds of entries:

1) MONTHLY COMMITMENTS (dashboard)
   For each: one display name, one amount (single number, never a range), one day of the month (1–31).
   These are regular costs that accrue through the month (rent-like finance, utilities, rates, pension, software, payroll as ONE total, etc.).

2) RESERVE PLANNER ITEMS (less frequent)
   For each: one display name, one amount (single number), one due day of the month, and the EXPLICIT months it falls due (e.g. March, June, September, December).
   Use for quarterly / six-monthly / annual payments (VAT-like HMRC, insurance, large quarterly transfers, corporation tax if clear, etc.).

Rules you MUST follow:
- Always output ONE amount and ONE date — never ranges like "£7–8k".
- Prefer RECENT amounts when the bill has clearly changed (e.g. electricity jumped). Weight the last 3–4 payments more heavily than old history.
- For stable variable bills, use the median of the last ~6 comparable payments, then round sensibly.
- For fixed standing orders / identical repeats, use the latest repeated amount.
- Group PAYROLL: many payments to different people in the first few working days of each month → ONE "Payroll" monthly commitment with the total for a typical recent payroll run. Exclude dividends and one-off transfers to individuals.
- Do NOT invent what a payee is. Keep the bank payee name. You may SUGGEST a clearer name (e.g. ENGIE → Electricity) and a category, but mark purpose as Unknown when unsure (e.g. a large quarterly transfer that might be rent).
- Exclude: internal transfers between own accounts (unless I ask), refunds, card settlement income, random one-offs, ordinary weekly shopping that is not a fixed monthly bill.
- Weekly operational spend: note it briefly but do NOT add as a weekly commitment.
- Traffic lights:
  🟢 Green = same amount/date almost every time
  🟠 Amber = clear monthly/quarterly pattern but amount varies a bit — you estimated
  🔴 Red = still include with your best single amount/date, but I must review (highly variable, recent jump, or purpose unknown)

Output EXACTLY in this format (markdown tables). No long essay before the tables.

### Monthly commitments
| Status | Name to enter | Bank payee | Category suggestion | Day of month | Amount (£) | How you got the amount | Notes for me |
| --- | --- | --- | --- | --- | --- | --- | --- |

### Reserve Planner
| Status | Name to enter | Bank payee | Category suggestion | Due day | Due months | Amount (£) | How you got the amount | Notes for me |
| --- | --- | --- | --- | --- | --- | --- | --- |

### Not imported (noticed only)
| Bank payee | Why excluded |
| --- | --- |

### How to enter in Cash Prophet
- Monthly: open Dashboard → add monthly accruing cost → name, amount, due day → assign to the right business/account if asked.
- Payroll: one line called Payroll for the total, not one line per employee.
- Reserve Planner: open Reserve Planner → add bill → name → fill each due month with the amount and due day → confirm purpose/name if Unknown.
- Start with 🟢 then check 🟠 then decide on 🔴.

After the tables, give a short checklist of the top 5 things I should confirm before trusting the draft.
```

---

## What you should get back

Tables you can walk through while entering Cash Prophet — not a vague essay.

## Testing notes (for Dave)

- Run in a **fresh** ChatGPT chat each time.
- Try CSV vs PDF; note which is cleaner.
- Check: payroll is one row; Papas-like quarterly has **months listed**; ENGIE uses recent weight not ancient average; purpose-unknown stays red.
- Iterate this prompt here until cold tests are consistently usable, then we embed it in Getting started / Settings as “Use your own ChatGPT”.
