# Stripe billing — go-live checklist

Use this before spending on Facebook ads. Until checkout works end-to-end, do not send paid traffic.

Live site: **https://www.cashprophet.co.uk**

---

## 1. Stripe Dashboard

1. Create (or confirm) products for **Solo**, **Multi-site**, **Multi-business / Group**.
2. For each product, create **monthly** and **annual** prices (GBP, net of VAT if you charge VAT at checkout via Stripe Tax).
3. Copy each Price ID (`price_…`).
4. Enable **Customer portal** (cancel, update payment method, invoices).
5. Turn on **Stripe Tax** if you want UK VAT added at checkout (recommended).

---

## 2. Vercel env (frontend)

Set these production env vars (then redeploy):

```
VITE_STRIPE_PRICE_SOLO_MONTHLY=
VITE_STRIPE_PRICE_SOLO_ANNUAL=
VITE_STRIPE_PRICE_MULTI_MONTHLY=
VITE_STRIPE_PRICE_MULTI_ANNUAL=
VITE_STRIPE_PRICE_GROUP_MONTHLY=
VITE_STRIPE_PRICE_GROUP_ANNUAL=
```

Billing is considered “configured” in the app when Solo monthly is set (and Supabase is configured). Prefer setting all six.

---

## 3. Supabase Edge Function secrets

In Supabase → Project Settings → Edge Functions → Secrets:

```
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_SOLO_MONTHLY=
STRIPE_PRICE_SOLO_ANNUAL=
STRIPE_PRICE_MULTI_MONTHLY=
STRIPE_PRICE_MULTI_ANNUAL=
STRIPE_PRICE_GROUP_MONTHLY=
STRIPE_PRICE_GROUP_ANNUAL=
SITE_URL=https://www.cashprophet.co.uk
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ANON_KEY=
RESEND_API_KEY=
PRODUCT_FROM_EMAIL=Cash Prophet <hello@cashprophet.co.uk>
TRIAL_EMAIL_CRON_SECRET=
```

(`PRODUCT_FROM_EMAIL` must use a domain verified in Resend.)

---

## 4. Deploy edge functions

From the project root (account with Supabase deploy access):

```bash
npx supabase functions deploy create-checkout-session
npx supabase functions deploy create-billing-portal
npx supabase functions deploy stripe-webhook --no-verify-jwt
npx supabase functions deploy send-trial-emails --no-verify-jwt
```

`stripe-webhook` and `send-trial-emails` must allow unauthenticated Stripe/cron callers (`--no-verify-jwt`).

---

## 5. Stripe webhook

Endpoint:

`https://<project-ref>.supabase.co/functions/v1/stripe-webhook`

Events to enable:

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid` (or `invoice.payment_succeeded`)
- `invoice.payment_failed`

Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.

---

## 6. Trial emails (cron)

Call once per day (Supabase cron, GitHub Action, or external ping):

```
POST https://<project-ref>.supabase.co/functions/v1/send-trial-emails
Authorization: Bearer <TRIAL_EMAIL_CRON_SECRET>
```

Sends:

- Mid-trial (~7 days in) — ask to choose a plan and add a card
- Trial ending (3 days left)
- Trial ended (day after end)

---

## 7. End-to-end test

1. Sign up a fresh test account (or use Stripe test mode keys).
2. Open Settings → Your plan → choose monthly or annual on a plan.
3. Complete Checkout with a test card; confirm trial still shows remaining days.
4. In Stripe, confirm subscription has `trial_end` matching workspace `trial_ends_at`.
5. Confirm webhook updated `subscriptions` / `workspaces`.
6. After a paid invoice (or force in test), confirm Admin → Payments shows cash / MRR.

---

## Card timing (product rule)

- **No card at signup** — Start Free stays free.
- **Mid-trial + near end** — in-app prompts + emails ask them to pick a plan; Checkout collects the card and defers the first charge until trial end (`deferUntilTrialEnd`).
