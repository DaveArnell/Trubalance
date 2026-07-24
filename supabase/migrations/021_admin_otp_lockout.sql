-- Admin email OTP lockout + attempt tracking.

ALTER TABLE public.admin_email_codes
  ADD COLUMN IF NOT EXISTS attempt_count integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.admin_auth_lockouts (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  failed_attempts integer NOT NULL DEFAULT 0,
  locked_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_auth_lockouts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_auth_lockouts FROM authenticated, anon;
