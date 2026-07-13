-- One-time admin email verification codes (6 digits, 10 minute expiry).

CREATE TABLE IF NOT EXISTS public.admin_email_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_email_codes_user_expires
  ON public.admin_email_codes(user_id, expires_at DESC);

ALTER TABLE public.admin_email_codes ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.admin_email_codes FROM authenticated, anon;
