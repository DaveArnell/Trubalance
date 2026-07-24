# True Balance — pre-launch checklist

Manual steps and verification before going live on **truebalanceapp.io**. Code tasks in the repo are ticked when merged; manual items stay open until you complete them in external dashboards.

---

## Bank import (PDF / CSV)

**Status: deferred — coming soon**

Bank statement import is disabled in the app (`BANK_IMPORT_ENABLED = false`). Onboarding is **manual only** until detection quality is ready. Re-enable in `src/config/setupAutomation.ts` when ready to test again.

**Code retained for later:**

- PDF/CSV parsing pipeline in `src/bankImport/`
- Import UI in Settings shows a “Coming soon” card

**Before re-enabling:**

- [ ] Re-test Lloyds PDF with minimum monthly = 0
- [ ] Confirm only clear monthly patterns are suggested (no due/reserve items from history)
- [ ] Manual onboarding verified end-to-end

---

## Bank import (archived notes)

## SEO

**Code (in repo):**

- [x] `usePageMeta` on landing, pricing, see-how-it-works, legal, auth, demo, app
- [x] `noindex` on `/app`, `/demo`, `/login`, password-reset flows
- [x] Default Open Graph / Twitter image URL wired (`/og-image.webp`)
- [x] Homepage JSON-LD (`Organization` + `WebSite` + `SiteNavigationElement`)
- [x] `robots.txt` disallows app/demo/auth/admin paths
- [x] Sitemap auto-generated at build from indexable routes + blog posts
- [x] Unique title + meta description per public route
- [x] Full OG + Twitter Card tags (image, dimensions, alt)
- [x] Absolute canonical hrefs + trailing-slash redirects
- [x] Checkout ignores client `priceId` (server resolves Stripe prices)
- [x] Admin OTP uses secure random + lockout after failed attempts

**Manual — do before / after launch:**

- [ ] [Google Search Console](https://search.google.com/search-console) — verify current domain, submit sitemap
- [ ] Optional: Plausible or Google Analytics 4 for traffic/signup attribution
- [ ] After deploy: refresh Facebook Sharing Debugger / LinkedIn Post Inspector for key URLs

---

## Domain cutover (planned: cashprophet.co.uk)

Live site today: **truebalanceapp.io**. Planned production domain: **cashprophet.co.uk** (confirm spelling before buying/DNS).

When you cut over:

1. Add `cashprophet.co.uk` (+ `www`) in Vercel → Domains
2. Point DNS at Vercel; keep `truebalanceapp.io` redirecting to the new domain for a while
3. Set Supabase Auth Site URL + redirect URLs to the new domain
4. Set edge function secret `SITE_URL=https://cashprophet.co.uk`
5. Change `COMPANY_INFO.website` in `src/content/companyInfo.ts` to the new origin
6. Re-submit sitemap in Google Search Console for the new property

---

## Hosting (Vercel + domain)

- [x] Connect GitHub repo to [Vercel](https://vercel.com)
- [ ] Set production env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_APP_ENV=production`
- [ ] Add planned domain `cashprophet.co.uk` (+ `www`) when ready
- [ ] Point DNS at registrar per Vercel instructions (apex A or CNAME)
- [ ] Confirm SSL active on the live domain

---

## Supabase (production project)

- [ ] Run all SQL migrations in `supabase/migrations/` (including **020** workspace edit lock and **021** admin OTP lockout)
- [ ] Upload email templates from `supabase/email-templates/` (optional)
- [ ] Grant yourself admin after first signup:
  ```sql
  UPDATE profiles SET role = 'super_admin' WHERE email = 'your@email.com';
  ```
- [ ] Deploy updated edge functions after billing/admin security changes:
  `npx supabase functions deploy create-checkout-session`
  `npx supabase functions deploy admin-auth`
  `npx supabase functions deploy create-billing-portal`
---

## Google login (next step after above)

**Code:** “Continue with Google” is already wired in the app.

**Manual:**

- [ ] Google Cloud Console → OAuth 2.0 Client ID (Web)
- [ ] Authorized redirect URI: `https://qwwwijyljghmlerylbpi.supabase.co/auth/v1/callback`
- [ ] Supabase → Authentication → Providers → Google → enable + paste Client ID/Secret
- [ ] Supabase → Authentication → URL configuration:
  - Site URL: `https://truebalanceapp.io`
  - Redirect URLs: `https://truebalanceapp.io/app`, `https://truebalanceapp.io/reset-password`, plus `http://localhost:5173/...` for dev
- [ ] **Keep your existing data when linking Google** (see below)

### Same email — email/password account + Google

Your workspace is tied to your Supabase **user id**, not the login method.

If you already signed up with **email + password** using your Gmail address:

1. In Supabase Dashboard → **Authentication → Settings**, ensure **“Enable manual linking”** or automatic identity linking is enabled (Supabase v2 links same verified email when configured).
2. Log out, click **Continue with Google** with the **same email**.
3. Supabase should attach the Google identity to your existing user — **same user id → same workspace data**.

If Google creates a **second** account instead:

- Do **not** delete the old account yet.
- In Supabase Dashboard → Authentication → Users, use **Link identity** to merge Google onto the original user, or contact support / use SQL to merge (advanced).
- Test on **staging** first if unsure.

**Recommendation:** Enable Google OAuth on staging, test link with a throwaway account, then enable on production before switching your main login.

---

## Post-launch smoke test

- [ ] Sign up / log in (email and Google)
- [ ] Workspace syncs after refresh
- [ ] Bank PDF import finds recurring costs
- [ ] `/blog` and a blog post show correct title in browser tab
- [ ] Share link preview shows title + description (once `og-image.png` exists)

---

*Last updated: July 2026 — update this file as launch steps complete.*
