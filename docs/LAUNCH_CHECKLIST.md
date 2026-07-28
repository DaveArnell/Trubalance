# Cash Prophet — launch checklist

Live canonical: **https://www.cashprophet.co.uk**

Manual steps and verification. Code tasks are done in the repo; SQL still needs running in Supabase when noted.

---

## Decisions (confirmed)

- **Bank PDF/CSV import in-app:** not shipping for now. Users use their own AI (ChatGPT) via the optional transaction-log helper instead — avoids import cost/red tape.
- **Google Search Console:** sorted (domain + sitemap).
- **Analytics (Plausible / GA4):** deferred — add later on its own page/setup when ready.
- **ICO:** organisation-level for Vocatio Ltd (not per-website). Keep the existing registration current; add the ICO number to Privacy when you have it handy. No separate registration needed just because Cash Prophet is a product site.

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

- [ ] Run outstanding SQL migrations in Supabase SQL Editor (including **025_support_messages.sql** for Settings → Support → admin inbox)
- [ ] Edge functions deployed when billing/admin changes land
- [ ] Platform admin account granted for your vocatio.io user

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

---

*Last updated: July 2026*
