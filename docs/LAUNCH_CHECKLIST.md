# Cash Prophet — launch checklist

Live canonical: **https://www.cashprophet.co.uk**

Manual steps and verification. Code tasks are done in the repo; SQL still needs running in Supabase when noted.

---

## Decisions (confirmed)

- **Bank PDF/CSV import in-app:** not shipping for now. Users use their own AI (ChatGPT) via the optional transaction-log helper instead — avoids import cost/red tape.
- **Google Search Console:** sorted (domain + sitemap).
- **Analytics (Plausible / GA4):** deferred — add later on its own page/setup when ready.
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

- **Admin:** `/platform-admin/campaigns` — funnel by campaign + plain-English guide for tagging links.
- **How it works:** put tagged links in ads (e.g. `?utm_source=meta&utm_medium=paid&utm_campaign=spring_offer`). Tags are remembered in the browser, saved on signup, then shown as signup → setup → trial use → paid.
- **Requires:** migration **026** run in Supabase.
- Does **not** pull Meta/Google spend yet; use their dashboards for cost, this page for who actually paid.

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

**Good enough for early ops / beta:** users, trials, setup funnel, user health, feature adoption counts.

**Not real yet (placeholders until Stripe is live):** MRR/ARR charts, revenue trend, churn. Ignore fake £ figures on Payments until billing is connected.

**Videos:** Scripts and wiring live under `docs/videos/` and `src/content/videos.ts`. Paste Vimeo URLs into `VIDEO_LIBRARY` as clips publish; homepage / onboarding / tours pick them up automatically.

---

*Last updated: July 2026*
