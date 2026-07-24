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
- [x] Default Open Graph / Twitter image URL wired (`/og-image.png`)
- [x] Homepage JSON-LD (`Organization` + `WebSite`)
- [x] `robots.txt` disallows app/demo/auth/admin paths
- [x] Sitemap auto-generated at build from `blogPosts.ts`
- [x] Unique title + meta description per public route
- [x] Full OG + Twitter Card tags (image, dimensions, alt)
- [x] `public/og-image.png` (1200×630 share image)
- [x] Build-time HTML shells so social crawlers see route-specific meta without JS

**Manual — do before / after launch:**

- [ ] [Google Search Console](https://search.google.com/search-console) — verify `truebalanceapp.io`, submit sitemap `https://truebalanceapp.io/sitemap.xml`
- [ ] Optional: Plausible or Google Analytics 4 for traffic/signup attribution
- [ ] After deploy: refresh Facebook Sharing Debugger / LinkedIn Post Inspector for key URLs
- [ ] Optional: deeper prerender of above-the-fold body content for crawlers that skip JavaScript

---

## Hosting (Vercel + domain)

- [ ] Connect GitHub repo to [Vercel](https://vercel.com)
- [ ] Set production env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_APP_ENV=production`
- [ ] Add domain `truebalanceapp.io` (+ `www`) in Vercel → Settings → Domains
- [ ] Point DNS at registrar per Vercel instructions (apex A or CNAME)
- [ ] Confirm SSL active and `https://truebalanceapp.io` loads the app

---

## Supabase (production project)

- [ ] Run all SQL migrations in `supabase/migrations/` (including `010_receipt_received_date.sql`)
- [ ] Upload email templates from `supabase/email-templates/` (optional)
- [ ] Grant yourself admin after first signup:
  ```sql
  UPDATE profiles SET role = 'super_admin' WHERE email = 'your@email.com';
  ```

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
