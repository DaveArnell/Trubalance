-- Allow enrolled platform admins outside @vocatio.io (explicit allowlist in app/edge code).
-- Enrolment still requires a row in platform_admins.

ALTER TABLE public.platform_admins
  DROP CONSTRAINT IF EXISTS platform_admins_email_domain;

COMMENT ON TABLE public.platform_admins IS
  'Platform operators. Emails must pass app/edge allowlist (@vocatio.io or EXTRA_PLATFORM_ADMIN_EMAILS) and be inserted here after signup.';

-- Enrol dave@lasertagleisure.co.uk once that Auth user exists.
INSERT INTO public.platform_admins (user_id, email, is_active)
SELECT id, lower(email), true
FROM auth.users
WHERE lower(email) = 'dave@lasertagleisure.co.uk'
ON CONFLICT (user_id) DO UPDATE
SET email = EXCLUDED.email,
    is_active = true;
