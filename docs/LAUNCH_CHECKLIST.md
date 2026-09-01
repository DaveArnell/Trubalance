# Cash Prophet — launch checklist

Live canonical: **https://www.cashprophet.co.uk**

Manual steps and verification. Code tasks are done in the repo; SQL still needs running in Supabase when noted.

---

## Decisions (confirmed)

- **Bank PDF/CSV import in-app:** not shipping for now. Users use their own AI (ChatGPT) via the optional transaction-log helper instead — avoids import cost/red tape.
- **Google Search Console:** sorted (domain + sitemap).
- **Analytics (GA4):** code wired via `VITE_GA_MEASUREMENT_ID`. Create a GA4 web stream, set the env on Vercel production, redeploy. Loads only after cookie accept.
- **ICO:** organisation-level for Vocatio Ltd. Registration **CSN6799153** is on Privacy / legal notices.
- **Support messages SQL (025):** run by Dave — Settings → Support → admin inbox should work.

---

## SEO / social share image (OG)

When someone pastes a Cash Prophet link in WhatsApp, Slack, LinkedIn, or Facebook, the preview card uses an **Open Graph (OG) image** — the picture next to the title/description.

- Wired in code to `/og-image.webp` on the live domain.
- **Check:** share `https://www.cashprophet.co.uk` in a private Slack/WhatsApp message and confirm the image looks right. If missing or wrong, replace `public/og-image.webp`.

---

## Hosting / domain

- [x] Vercel + `cashprophet.co.uk` / `www`
- [x] SSL
- [ ] Confirm production env vars on Vercel if anything still looks “demo-only”

---

## Supabase

- [x] Support messages migration **025** run
- [ ] **Marketing attribution migration 026** — run `supabase/migrations/026_marketing_attribution.sql` in Supabase SQL Editor (adds campaign tags on profiles + signup hook). Needed for Ads & campaigns admin.
- [ ] Edge functions deployed when billing/admin changes land
- [ ] Platform admin account granted for your vocatio.io user

---

## Ads & campaigns (attribution)

**Goal:** know which ads produce paying customers — not just clicks.

- **Admin:** `/platform-admin/campaigns` — funnel by campaign + copy-paste Facebook boost link.
- **Test boost URL:** `https://www.cashprophet.co.uk/?utm_source=meta&utm_medium=paid&utm_campaign=fb_boost_test_aug26&utm_content=boosted_post`
- **How it works:** tagged links remembered in the browser, saved on signup, shown as signup → setup → trial → paid.
- **Requires:** migration **026** run in Supabase.
- Early rows may be your own test accounts — judge the named campaign after the boost runs.
- Does **not** pull Meta/Google spend yet.

---

## Stripe / billing

See **`docs/STRIPE_GO_LIVE.md`** for prices, env secrets, webhook, trial emails, and end-to-end test.

- [ ] Stripe products + prices created
- [ ] Vercel `VITE_STRIPE_PRICE_*` set and redeployed
- [ ] Supabase secrets set (`STRIPE_*`, `RESEND_API_KEY`, `TRIAL_EMAIL_CRON_SECRET`, …)
- [ ] Edge functions deployed (`create-checkout-session`, `create-billing-portal`, `stripe-webhook`, `send-trial-emails`)
- [ ] Stripe webhook events connected
- [ ] Migration **027** (`trial_email_log`) run
- [ ] Daily cron hitting `send-trial-emails`
- [ ] Migration **039** (`purge_expired_support_and_enquiries`) run in Supabase SQL Editor
- [ ] Migration **040** (monthly pg_cron schedule) run in the same Cash Prophet project
- [ ] Test checkout with deferred trial charge

**Do not spend hard on Facebook until the Stripe checklist is green.**

---

## Google login

**Code ready.** Manual: Google Cloud OAuth client + Supabase Google provider + redirect URLs for cashprophet.co.uk (optional until you want it).

---

## Support inbox

- **In app:** Settings → Support (message form)
- **Admin:** `/platform-admin/support` lists messages; reply by email for now
- Requires migration **025** run in Supabase

---

## Admin stats (honest status)

**Good enough for early ops / beta:** users, trials, setup funnel, user health, feature adoption counts, campaign attribution, subscription-based MRR/ARR when Stripe is live.

**Videos:** Scripts and wiring live under `docs/videos/` and `src/content/videos.ts`. Paste Vimeo URLs into `VIDEO_LIBRARY` as clips publish; homepage / onboarding / tours pick them up automatically.

---

*Last updated: August 2026*
