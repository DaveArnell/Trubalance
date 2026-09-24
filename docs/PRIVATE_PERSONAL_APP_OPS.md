# Private personal app — ops checklist

Cash Prophet is closed as a public product. The live site is login-only for your own workspace.

## Code already done

- `/` and marketing routes redirect to `/login`
- Public signup is disabled in the client (`signUp` rejected; `/signup` redirects)
- Stripe / trial gates bypassed (`PRIVATE_PERSONAL_APP`)
- Site-wide `X-Robots-Tag: noindex, nofollow` and empty sitemap

## You should do in consoles

### 1. Supabase Auth (required)

1. Open **Authentication → Providers / Settings**.
2. **Disable new user sign-ups** (email + OAuth).
3. Confirm only your user exists; delete test users if any.
4. Optional: set `VITE_PRIVATE_ALLOWED_EMAILS` in Vercel to your email(s), comma-separated (e.g. `you@example.com`). When set, any other email is signed out / denied at login.

### 2. Stripe — cancel / disable

- Cancel subscription products / prices you no longer need.
- Disable or delete the Stripe webhook endpoint for this project.
- Remove Stripe secrets from **Supabase Edge Function secrets** and **Vercel** (`STRIPE_*`, price IDs, etc.).

### 3. Vercel env

**Keep:** Supabase URL + anon key (and any keys needed for your own app use).

**Remove if present:**

- `VITE_GA_MEASUREMENT_ID` / GA keys
- Meta Pixel / CAPI related `VITE_META_*` or similar
- Stripe publishable / price env vars
- OpenAI keys if bank-import AI is unused
- Resend / transactional email keys used only for trials / enquiries

**Add:**

- `VITE_PRIVATE_ALLOWED_EMAILS=your@email.com` (recommended)

### 4. Meta / ads

- Turn off Meta ad campaigns.
- Stop Conversions API / Pixel use for this domain.

### 5. Domain

- Keep DNS → Vercel if you want `cashprophet.co.uk` as the login URL (domain is the main ongoing cost).

### 6. GitHub

- Make the repo **private** if it is still public.

### 7. Search Console (optional)

- Remove or leave the property; the site is noindexed so new indexing should stop.

## Edge functions

Stripe checkout / webhook, Meta CAPI, trial emails, and enquiry functions can stay in the repo unused. With secrets removed they cannot run usefully in production.
