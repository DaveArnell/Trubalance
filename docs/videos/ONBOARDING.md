# Onboarding teaching clips

Paste each published Vimeo URL into [`src/content/videos.ts`](../src/content/videos.ts).  
UI slots: setup onboarding (`SetupVideoSlot`) and matching guided-tour steps (see [TOUR_REUSE.md](./TOUR_REUSE.md)).

Brand rules: **Cash Prophet Balance**; enemy = unreliable bank balance; calm, practical tone.

---

## Core set (produce first)

### 1. Welcome to Cash Prophet  
**Key:** `onboarding-welcome` · 45–75s

**VO**  
Most owners check the bank, then run through everything that’s coming in their head before they trust the number. Cash Prophet does that work for you. It continuously accounts for meaningful commitments and gives you one trusted figure — your Cash Prophet Balance — so you can see where the business really stands, day to day. In the next steps we’ll set up your structure, walk through how costs and receipts work, then get you onto the live screens.

**Shots:** brand / CPB hero → short equation → soft cut to dashboard overview.

---

### 2. Businesses, sites and accounts  
**Key:** `onboarding-structure` · 45–90s

**VO**  
Start with the business you want to track. Add sites if you have more than one location. Then add every current and savings account that business holds, so Cash Prophet can see all the money in the bank. Do not add a reserve account here — that links later when you set up the Reserve Planner.

**Shots:** structure tree · add business · add site · add current account · save.

---

### 3. How monthly costs build  
**Key:** `onboarding-monthly-costs` · 45–90s

**VO**  
Costs that come round every month — rent, wages and similar — build a little each day toward the month’s total. Early in the month only a fraction is spoken for; by due date most of it is. That way your Cash Prophet Balance already reflects them before payday. Add one row per recurring cost.

**Shots:** accruing list with partial purple washes · KPI strip (monthly total / accrued now / per day) · add a cost.

---

### 4. Paying what is due  
**Key:** `onboarding-due` · 45–75s

**VO**  
When a monthly cost reaches its due date, or you add a one-off you’ve set aside, it appears under Due. These amounts count as deductions when Cash Prophet calculates your Cash Prophet Balance. Mark them paid once the money has left the account. If what you paid differs from the estimate, enter the real amount so that period’s history matches reality.

**Shots:** Due panel · mark paid · adjust amount if needed.

---

### 5. Expected receipts  
**Key:** `onboarding-receipts` · 45–75s

**VO**  
Add income you are confident will arrive — invoices, grants, refunds. They can count toward your Cash Prophet Balance before the cash lands. Mark received when it arrives so the number stays up to date.

**Shots:** Expected receipts panel · add receipt · mark received.

---

### 6. Your balance over time  
**Key:** `onboarding-trends` · 45–75s

**VO**  
Each time you save bank balances, that day is stored. Trends shows whether your Cash Prophet Balance is moving up or down over time. Use it as a habit check — not a forecast — so you can see how you’re travelling.

**Shots:** save balances on overview · Trends chart · optional balance log row.

---

## Follow-up set

### 7. Reading the month chart  
**Key:** `onboarding-month-view` · 45–75s

**VO**  
Month view draws how committed money rises through the month, then falls when you mark bills paid. It helps you see tight weeks and how much needs to be assigned at different points — without turning Cash Prophet into a full cash-flow forecast.

**Shots:** switch to Month view · point at rise and drop on a due day.

---

### 8. Funding VAT and big bills  
**Key:** `onboarding-reserve` · 60–90s

**VO**  
VAT, insurance and other large bills that don’t come every month belong in the Reserve Planner. You provision for them month by month so your Cash Prophet Balance stays a true reflection once those bills are accounted for. Each month Cash Prophet tells you how much to move into the reserve account — or how much you can transfer back — depending on what’s due. Follow that figure and the reserve stays on track.

**Shots:** reserve bill grid · monthly transfer prompt · sawtooth outlook with bill drops · buffer line.

---

### 9. Using a bank export with ChatGPT  
**Key:** `onboarding-statement` · 60–90s

**VO**  
Optional speed-up: download a transaction history for this business, paste our prompt into ChatGPT, and get a draft list of monthly costs and reserve bills. You still type the figures into Cash Prophet yourself — the helper just shortens the blank-page problem. Skip this if you prefer to enter costs from memory or invoices.

**Shots:** statement helper step · export mention · prompt paste (blur sensitive data) · draft list → type into accruing / reserve.
