# Statement → Cash Prophet onboarding (AI prefill)

**Status:** Product + engineering source of truth for one-time statement onboarding.  
**Audience:** Cursor / implementers.  
**Brand:** Follow `docs/BRAND_AND_PRODUCT_FOUNDATION.md`. Spelling: **Cash Prophet** (not Profit / True Balance).  
**Goal:** After one upload of bank/accounting transaction history, pre-fill monthly commitments and Reserve Planner items so the user reviews a checklist and lands on a usable Cash Prophet Balance — not a blank slate.

---

## 1. Product intent

Infer **future cash commitments** from historical bank behaviour.

Not: “list every recurring payment.”  
Yes: propose a **first draft** of:

1. Monthly accruing commitments (one amount, one day of month).
2. Reserve Planner items (one amount, **explicit due months**, one due day).
3. Grouped payroll as **one** monthly commitment.
4. Variable but still monthly items, clearly marked for review.

**AI proposes → Cash Prophet validates → user confirms.**  
Nothing activates until the user confirms. No ongoing per-customer model training. Each upload is a **stateless, one-off** job under the same versioned rules.

---

## 2. Entitlements (commercial)

| Who | What |
|-----|------|
| Trial | **One analysis per trial account** (one business). |
| Paying | **One analysis per business** included on the plan (explicit “run again” only). |
| Cap | Soft business-count abuse protection later if needed; do not block launch on this. |

**Hard rules**

1. Store the successful analysis result; reopening the review **must not** call OpenAI again.
2. Changing names, categories, amounts, or dates on the review screen (or after import) **must not** call OpenAI again — only your saved draft / Cash Prophet data changes.
3. A new AI analysis only runs when the user **explicitly** uploads again or clicks “Analyse again”, and only if they still have entitlement left.
4. Prefer CSV/XLSX over PDF where the user has a choice (cheaper, clearer).

**Onboarding placement (agreed):** Option **B** — after teaching / structure, at the end of Getting started as “Prefill from statement” (or skip and enter manually on the dashboard). Manual path still lands ready to enter numbers live.
5. **One pass** for normal jobs. No automatic multi-pass re-analysis. If evidence is thin, fall back to user review / manual fill — do not burn budget retrying.
6. Optional fallback: give the user a **copy-pasteable ChatGPT prompt** + schema so they can run analysis themselves and enter results manually (trial multi-business or failed upload path).

---

## 3. Cost controls (must stay viable)

**Targets**

- Average: **under £0.75 per business**
- Normal max: **~£2**
- Hard automated spend cap: **£5** — if approached, stop and ask for CSV / clearer export

**How to stay cheap**

1. Prefer CSV/Excel.
2. Use cost-efficient model first (e.g. GPT-5 mini / current `OPENAI_MODEL_TEXT` equivalent).
3. Return **onboarding candidates + compact evidence only** — never a full rewritten ledger of thousands of txs in the model output.
4. Escalate to a stronger model **only** when validation fails (optional later). Default: one pass, then user fixes.
5. Log every job: model, input/output tokens, estimated cost, format, page/tx count, outcome.
6. Do not use Batch API for live onboarding (async 24h); only if offering “email when ready.”

**Do not** design as three full-document AI passes by default.

---

## 4. Input formats

Accept (AI or parser must understand them):

- CSV / Excel transaction exports (**preferred**)
- Text-based PDF bank statements
- Scanned PDF (supported but costlier; may hit quality gate)
- Accounting-software transaction reports
- Multiple files / periods for one business

Copy: *“Download your transaction history. CSV is recommended; PDF statements are also accepted. Longer history (ideally 1–3 years) improves quarterly, annual and seasonal detection. Six months can still help for monthly items.”*

If unrecognisable: stop and ask for another export — do not retry spend.

---

## 5. Outcomes for every detected outgoing

| Outcome | Required fields | Default UI |
|---------|-----------------|------------|
| Regular monthly commitment | One `suggested_amount`, one `payment_day`, frequency monthly | Prefill; green/amber selectable |
| Variable monthly commitment | Same + `review_required: true` | Prefill; red needs decision |
| Reserve Planner item | One amount, **`payment_months[]`**, one `payment_day`, schedule | Prefill with months listed |
| Excluded / uncertain | Shown under “Other payments we noticed” | Not imported |

**Never return amount ranges.** Always one number.

---

## 6. Two confidence dimensions + traffic lights

Keep **pattern** separate from **classification**.

Example: Papas Fish & Chips — pattern can be 🟢 (quarterly £9,000) while purpose is 🔴 (not fish & chips; user renames to Rent). Low classification confidence must **not** block importing a strong cash pattern.

### Overall traffic light (per item)

| Light | Meaning | Import default |
|-------|---------|----------------|
| 🟢 Green | High confidence on frequency, date, and amount | Selected for import; still editable |
| 🟠 Amber | Clear pattern; amount estimated (median / recent weight) | Selected; show how amount was calculated |
| 🔴 Red | Belongs in forecast but needs a user decision | Prefill in checklist; **do not activate without user action** |
| — Not imported | Below evidence threshold | Optional “noticed” list only |

### Suggested thresholds (tune with eval set)

**Green (monthly fixed-ish)**

- ≥3 qualifying occurrences (monthly)
- Amount variation ≤ ~5%
- At least 3 of last 4 expected periods present
- Payment day usually within ±3 calendar days
- Pattern score ≥ ~85

**Amber**

- Pattern ≥ ~70
- Amount variation ~5–25%, or date window wider but still monthly
- Or stable amount but weaker category
- Or recent-trend weighting used

**Red**

- Pattern ≥ ~55 but amount variation > ~25%
- Material recent increase/decrease
- Revolving credit / Capital-on-Tap style
- Thin history, missing periods, transfer ambiguity
- Strong pattern + unknown purpose (e.g. landlord trading as merchant name)

**Not imported**

- One-offs, isolated purchases, no monthly/quarterly/6‑monthly/annual schedule
- Ordinary weekly card/ops spend (v1: detect and exclude with message)

Quarterly ideally ≥3 occurrences; six-monthly ≥2; annual ≥2 different years. One annual occurrence → “possible annual — insufficient history,” not auto-add.

---

## 7. Naming (always three fields)

1. **`bank_payee`** — exact / normalised bank description (never overwrite; used for future matching).
2. **`suggested_name`** — human label (Electricity / ENGIE Power / user override).
3. **`suggested_category`** — Utilities, Finance, Payroll, Pension, Waste, Rates, Tax, Insurance, Software, Premises/rent, Unknown, etc.

UI: Keep bank name / use suggestion / enter my own.

---

## 8. Frequency rules (generic — not Laser Quest-specific)

### Monthly

- Intervals mostly 25–35 days **or** once per calendar month around a recognisable day
- Allow weekend / bank-holiday displacement
- One missing month does not kill the pattern
- Multiple same-month payments: decide one bill vs weekly — **v1 does not auto-import weekly**

### Weekly (v1)

- May detect; **do not auto-import** as weekly cycle engine
- Optional later: “convert to monthly allowance” (`weekly × 52 / 12`)
- Accrue-over-7-days cycle is a **later product** change — out of scope for v1 onboarding

### Quarterly / six-monthly / annual → Reserve Planner

- Quarterly: ~80–100 day spacing **or** same four month positions each year
- Six-monthly: ~170–195 days
- Annual: same month across ≥2 years
- Output **must** list every expected month (e.g. `[3,6,9,12]`), not merely `"quarterly"`
- Choose one standard `payment_day` from observed history

### Variable ≠ irregular

- Capital on Tap: monthly + variable amount → monthly commitment, red review  
- Papas: quarterly + fixed → Reserve Planner  
- ENGIE: monthly + variable + recent rise → monthly, red, recency-weighted amount  

---

## 9. Amount method (one number)

Order of preference:

1. **Fixed repeated** → latest established repeated value (do not blend old and new fixed prices).
2. **Stable variable** → median of latest ~6 comparable payments.
3. **Clear run-rate change** → recency-weighted (e.g. newest 40%, then 30%, 20%, 10%). Regime change overrides mechanical weights.
4. **Seasonal** → prefer equivalent recent-season values; with &lt;1 year use one current estimate; month-by-month seasonal map is a **later** enhancement if Cash Prophet supports it.
5. **Insufficient evidence** → do not pre-add.

Always set `amount_method` on the suggestion (`fixed_recent` | `median_recent` | `recent_weighted` | `seasonal_comparable` | …).

---

## 10. Payroll (special case)

Detect as a **cluster**, not per employee:

- Descriptions: payroll / wage / salary / pay group variants
- Multiple payments to **individuals** within ~3 working days
- Cluster recurs monthly around same window
- **Exclude:** dividends, director loans, reimbursements, isolated personal transfers, refunds

**Output:** one monthly commitment, e.g. Payroll · day 2 · one rounded amount from **recent payroll-run totals** (weight last ~3 months), not a range.

Traffic light reflects **total payroll variability**, not staff churn.

---

## 11. Reserve Planner output + post-confirm onboarding

For each reserve item return:

- amount (one number)
- `payment_months[]`
- `payment_day`
- schedule
- confidence lights + review reason
- compact evidence dates/amounts

**After user confirms reserve items**, onboarding should also:

1. Compute how much should already be set aside (from last payment / next due / today).
2. Ask: current reserve balance held.
3. Show opening shortfall/surplus.
4. Recommend a **separate, easily transferable business savings account** (interest where practical — do not absolutise “high interest”).
5. User updates reserve balance in Cash Prophet; activate planner view (expected vs actual, contribution, next liability).

Do not invent purpose (VAT vs CT vs rent). Ask when unknown. VAT is medium confidence even with a clear payment — amount can vary; mandatory confirmation.

---

## 12. Review UI (traffic-light checklist)

Sections:

1. Upload history  
2. Monthly commitments — Green / Amber / Red tabs  
3. Reserve Planner — same lights; show months explicitly  
4. Naming / purpose questions for low classification confidence  
5. Confirm → load dashboard + Reserve Planner  

Copy tone: calm, practical. Not “AI magic.” Not accounting advice.

Red example:

> Capital on Tap · £4,300 · 24th monthly · 🔴 Amount varies substantially — how should Cash Prophet treat this?

Papas example:

> £9,000 · 24 Mar / Jun / Sep / Dec · 🟢 Pattern · 🔴 Purpose unknown — rename to Rent?

---

## 13. Architecture (aligned with what actually works)

**Evidence from product owner:** conventional PDF table parsing was unreliable; giving statements to a capable AI worked. Prefer **AI-first interpretation** with **app-side validation**, not brittle custom PDF parsers as the foundation.

### Preferred cost-controlled pipeline (v1)

1. User uploads file(s).
2. Extract or group transactions as cheaply as possible:
   - **CSV/XLSX:** deterministic parse → group by merchant (existing `bankImport` path).
   - **PDF:** if local parse is weak, allow AI file/vision path **or** ask for CSV — measure cost; do not assume multi-pass PDF is free.
3. **One** OpenAI call with **Structured Outputs** / strict JSON schema → onboarding candidates + compact evidence.
4. App validates: positive amounts, dates, no duplicates, months in 1–12, due day 1–31, entitlement, spend cap.
5. Review UI; on confirm, apply to commitments + reserve bills (create planner if needed).
6. Persist analysis JSON for the business so review is free to reopen.

### Existing code to extend (do not orphan)

| Area | Location |
|------|----------|
| Types / AI schema | `src/bankImport/analysisSchema.ts`, `types.ts` |
| Grouping / payroll flags | `src/bankImport/prepareForAi.ts`, `categorize.ts` |
| Edge function + prompt | `supabase/functions/bank-import-analyze/index.ts` |
| Map / apply | `mapAiSuggestions.ts`, `applySuggestions.ts` |
| Review UI | `BankImportSuggestionReview.tsx`, `BankStatementImportPanel.tsx` |
| Flags / copy | `src/config/setupAutomation.ts`, `src/content/guidedSetup.ts` |

**Known gaps to close**

- Wire panel into onboarding / Settings (`BANK_IMPORT_ENABLED` is true but UI largely orphaned).
- Statement path in guided setup is unused (manual-only wizard).
- Apply reserve bills: create planner if missing; expand `likely_payment_months` into full `monthAmounts`.
- Upgrade schema/prompt for traffic lights, dual confidence, `bank_payee`, `review_required`, amount methods, explicit months.
- Entitlement + result caching + cost logging.
- Optional: user-facing “DIY ChatGPT prompt” fallback.

---

## 14. JSON shape (target — evolve `AiAnalysisResult`)

Each item should support fields equivalent to:

```json
{
  "bank_payee": "ENGIE POWER",
  "suggested_name": "Electricity",
  "suggested_category": "Utilities – electricity",
  "destination": "building_commitment",
  "frequency": "monthly",
  "suggested_amount": 2950,
  "payment_day": 27,
  "payment_months": null,
  "amount_method": "recent_weighted",
  "pattern_confidence": 90,
  "amount_confidence": 55,
  "date_confidence": 85,
  "classification_confidence": 80,
  "overall_status": "red",
  "review_required": true,
  "review_reason": "Recent bills much higher than earlier history.",
  "evidence": [
    { "date": "2026-03-26", "amount": 648.82 },
    { "date": "2026-04-29", "amount": 3267.53 },
    { "date": "2026-05-28", "amount": 2992.07 },
    { "date": "2026-06-26", "amount": 2964.94 }
  ]
}
```

Reserve example:

```json
{
  "bank_payee": "PAPAS FISH AND CHI",
  "suggested_name": "Papas Fish & Chips",
  "suggested_category": "Unknown — confirm purpose",
  "destination": "reserve_bill",
  "frequency": "quarterly",
  "suggested_amount": 9000,
  "payment_day": 24,
  "payment_months": [3, 6, 9, 12],
  "overall_status": "red",
  "review_required": true,
  "review_reason": "Strong quarterly pattern; purpose cannot be inferred from payee name."
}
```

Payroll: single monthly item; evidence may list one sample run’s total, not every employee.

---

## 15. System prompt rules (for edge function rewrite)

Condense into the live system prompt:

- UK SMB Cash Prophet setup assistant — not accounts, tax advice, or regulated advice.
- Prefill monthly commitments + Reserve Planner + grouped payroll; exclude transfers, refunds, daily card income as receipts.
- **One amount, one day**; reserve items list **exact months**.
- Separate pattern vs classification confidence; traffic-light `overall_status`.
- Never invent purpose; keep `bank_payee`.
- Recency over long averages when run rate changed.
- Payroll = one grouped commitment; exclude dividends.
- Weekly ops spend: exclude from auto-import (note only).
- Compact evidence only; JSON schema only.

---

## 16. Evaluation

Build a small anonymised eval set (several businesses, not one venue):

- Expected monthly / reserve / payroll suggestions
- Known false positives (transfers, weekly suppliers)
- Score: amount within tolerance, correct day ±3, correct months, traffic light sensible

Rerun after prompt/schema changes.

---

## 17. Out of scope for v1

- Ongoing learning / fine-tuning per user  
- Full weekly cycle accrual engine  
- Open banking / Xero / QB live feeds (keep “coming soon”)  
- Automatic activation of red items  
- Multi-pass full-document AI by default  
- Claiming VAT/CT labels without confirmation  

---

## 18. Implementation order (when building)

1. Extend schema + edge prompt to match this doc (traffic lights, dual confidence, months, amount methods).  
2. Persist analysis per business; entitlement gate (1× trial / 1× per business).  
3. Fix apply path (create reserve planner; expand months).  
4. Wire review UI into Getting started + Settings; traffic-light checklist.  
5. Reserve follow-on steps (savings account guidance, opening balance shortfall).  
6. Cost logging + hard cap.  
7. DIY ChatGPT prompt fallback for extra businesses on trial.  
8. Eval set + cost measurement on real CSVs/PDFs.

---

## 19. Reference example (one business — illustrative only)

Do **not** hard-code these merchants. Rules must generalise.

**Monthly (examples):** Payroll (grouped), Quantum Funding, NNDR, NEST, accountant SO, Arkle, Close Brothers, TNT Sports, Scanlite, Veolia, Vimto; ENGIE + Capital on Tap as **red** variable monthly with recent-weighted amounts.

**Reserve:** Papas-style quarterly with months 3/6/9/12; VAT-like HMRC with months + medium confidence + confirm.

**Exclude / review:** weekly entertainment supplier totals, ambiguous internals, thin annual candidates.

---

*Derived from product-owner discussion (statement analysis → Cash Prophet onboarding), reconciled with existing `bankImport` pipeline. Prefer this document over ad-hoc chat when implementing.*
