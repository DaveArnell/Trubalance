# Full setup: Stripe + Resend (step by step)

Do these in order. Finish one step, reply to the assistant with what you have (e.g. the six `price_…` IDs), then continue. Do **not** skip ahead to Facebook ads until the final test works.

You already ran migration **027** — that part is done.

**Use Stripe Test mode first** (toggle in the Stripe Dashboard top-right). Switch to Live only after a successful test checkout.

Prices in the app (net of VAT):

| Plan | Monthly | Annual |
|------|---------|--------|
| Solo Business | £10 | £100 |
| Multi-site Business | £15 | £150 |
| Multi-business / Group | £20 | £200 |

---

## Step 1 — Stripe account + products + prices

1. Go to [https://dashboard.stripe.com](https://dashboard.stripe.com) and sign in (or create an account for Vocatio Ltd / Cash Prophet).
2. Turn **Test mode ON**.
3. Go to **Product catalogue** → **Add product**.
4. Create three products (one at a time):

### Product A — Solo Business
- Name: `Solo Business`
- Description (optional): `One business without separate venues`
- Pricing model: **Recurring**
- Add **two** prices on this product:
  - Amount `10.00` GBP, Billing period **Monthly** → Save → copy Price ID (`price_…`) → label it `SOLO_MONTHLY`
  - Amount `100.00` GBP, Billing period **Yearly** → Save → copy Price ID → label it `SOLO_ANNUAL`

### Product B — Multi-site Business
- Same pattern: `15.00` monthly → `MULTI_MONTHLY`, `150.00` yearly → `MULTI_ANNUAL`

### Product C — Multi-business / Group
- Same pattern: `20.00` monthly → `GROUP_MONTHLY`, `200.00` yearly → `GROUP_ANNUAL`

5. Paste your six IDs somewhere safe like this:

```
SOLO_MONTHLY=price_...
SOLO_ANNUAL=price_...
MULTI_MONTHLY=price_...
MULTI_ANNUAL=price_...
GROUP_MONTHLY=price_...
GROUP_ANNUAL=price_...
```

**Stop here and send those six IDs to the assistant before continuing.**

---

## Step 2 — Stripe Customer Portal + Tax

1. Stripe Dashboard → **Settings** → **Billing** → **Customer portal**.
2. Activate the portal. Allow customers to:
   - Update payment methods
   - View invoices
   - Cancel subscriptions (optional but recommended for monthly)
3. **Settings** → **Tax** → enable **Stripe Tax** for the UK if you want VAT added at checkout (recommended).  
   If Tax is off for now, checkout still works; you just won’t auto-add VAT until you turn it on.

**Reply “portal done” when finished.**

---

## Step 3 — Stripe API keys (Test mode)

1. Stripe → **Developers** → **API keys**.
2. Copy:
   - **Publishable key** `pk_test_…` (you may not need it in the app today — checkout uses the server)
   - **Secret key** `sk_test_…` → keep private; this becomes `STRIPE_SECRET_KEY`

Do **not** put the secret key in Vercel as a `VITE_` variable (anything `VITE_` is public in the browser).

**Reply when you have `sk_test_…` ready (do not paste the full secret in chat if you prefer — just confirm you have it).**

---

## Step 4 — Resend (email)

1. Go to [https://resend.com](https://resend.com) and create/sign in.
2. **API Keys** → Create key → copy `re_…` → this is `RESEND_API_KEY`.
3. **Domains** → Add `cashprophet.co.uk` (or your sending domain) and add the DNS records Resend shows (SPF/DKIM).
4. Wait until the domain shows **Verified**.
5. Choose a from-address you will use, e.g. `Cash Prophet <hello@cashprophet.co.uk>`.

Until the domain is verified, Resend only lets you send to your own signup email (fine for testing admin codes; not fine for real customer trial emails).

**Reply when the domain is verified (or say you’re stuck on DNS).**

---

## Step 5 — Vercel environment variables

Vercel project → **Settings** → **Environment Variables** → Production (and Preview if you want):

```
VITE_STRIPE_PRICE_SOLO_MONTHLY=<SOLO_MONTHLY>
VITE_STRIPE_PRICE_SOLO_ANNUAL=<SOLO_ANNUAL>
VITE_STRIPE_PRICE_MULTI_MONTHLY=<MULTI_MONTHLY>
VITE_STRIPE_PRICE_MULTI_ANNUAL=<MULTI_ANNUAL>
VITE_STRIPE_PRICE_GROUP_MONTHLY=<GROUP_MONTHLY>
VITE_STRIPE_PRICE_GROUP_ANNUAL=<GROUP_ANNUAL>
```

Then **Redeploy** production (Deployments → … → Redeploy), or ask the assistant to run `npx vercel --prod`.

---

## Step 6 — Supabase Edge Function secrets

Supabase → your project → **Project Settings** → **Edge Functions** → **Secrets**.

Add (values from Steps 1–4):

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_SOLO_MONTHLY=price_...
STRIPE_PRICE_SOLO_ANNUAL=price_...
STRIPE_PRICE_MULTI_MONTHLY=price_...
STRIPE_PRICE_MULTI_ANNUAL=price_...
STRIPE_PRICE_GROUP_MONTHLY=price_...
STRIPE_PRICE_GROUP_ANNUAL=price_...
SITE_URL=https://www.cashprophet.co.uk
RESEND_API_KEY=re_...
PRODUCT_FROM_EMAIL=Cash Prophet <hello@cashprophet.co.uk>
ADMIN_FROM_EMAIL=Cash Prophet Admin <hello@cashprophet.co.uk>
TRIAL_EMAIL_CRON_SECRET=<make up a long random string>
```

Also set this secret (required for checkout + webhook to update the database). Supabase blocks custom secrets named `SUPABASE_*`, so use this name:

```
SERVICE_ROLE_KEY=<Project Settings → API → service_role key>
```

Confirm these already exist for Edge Functions (often auto-injected; if a function says “Billing not configured”, set them manually too):

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` (or `ANON_KEY`)

Leave `STRIPE_WEBHOOK_SECRET` empty until Step 8.

---

## Step 7 — Deploy edge functions

From the project folder, logged into the Supabase CLI with an account that **owns** the project:

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase functions deploy create-checkout-session
npx supabase functions deploy create-billing-portal
npx supabase functions deploy stripe-webhook --no-verify-jwt
npx supabase functions deploy send-trial-emails --no-verify-jwt
```

Your project ref is the subdomain in `https://xxxxx.supabase.co`.

If deploy returns **403**, the CLI user does not have access — use the owner login or invite that user as Owner/Developer in Supabase.

---

## Step 8 — Stripe webhook

1. Stripe → **Developers** → **Webhooks** → **Add endpoint** (still in **Test mode**).
2. Endpoint URL:

```
https://<your-project-ref>.supabase.co/functions/v1/stripe-webhook
```

3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
4. Add endpoint → reveal **Signing secret** `whsec_…`.
5. Put that in Supabase secrets as `STRIPE_WEBHOOK_SECRET`.

---

## Step 9 — End-to-end test (Test mode)

1. Open an **incognito** window → https://www.cashprophet.co.uk/signup → create a throwaway account.
2. In the app: **Settings → Your plan**.
3. Click subscribe monthly (or annual) on Solo.
4. Stripe Checkout should open. Use test card `4242 4242 4242 4242`, any future expiry, any CVC.
5. After success you should still be on trial (not charged yet). In Stripe → **Subscriptions**, open the sub and confirm **Trial end** is set.
6. In Admin → **Payments**, you may not see cash until a real invoice pays; MRR can still update from the subscription row once webhooks sync.

If Checkout fails, tell the assistant the exact error message on screen or in the browser Network tab for `create-checkout-session`.

---

## Step 10 — Trial email cron (after Resend domain works)

Call once per day (GitHub Action, cron-job.org, or Supabase scheduled trigger):

```
POST https://<project-ref>.supabase.co/functions/v1/send-trial-emails
Authorization: Bearer <same TRIAL_EMAIL_CRON_SECRET>
```

You can test manually with curl once secrets are set.

---

## Step 11 — Go Live (only after Test works)

1. Stripe: toggle **Test mode OFF**.
2. Recreate the same three products/prices in **Live** (or clone) → new `price_…` IDs.
3. Copy **live** `sk_live_…` and live price IDs into Vercel + Supabase (replace test values).
4. Add a **Live** webhook to the same Supabase URL; put the new `whsec_…` in `STRIPE_WEBHOOK_SECRET`.
5. Redeploy Vercel + confirm checkout with a real card on a tiny amount or cancel immediately after.

---

## After Live works

Use this Facebook boost destination only:

```
https://www.cashprophet.co.uk/?utm_source=meta&utm_medium=paid&utm_campaign=fb_boost_test_aug26&utm_content=boosted_post
```

Then watch Admin → Ads & campaigns for campaign `fb_boost_test_aug26` only.
