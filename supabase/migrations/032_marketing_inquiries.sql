-- Public marketing enquiries (contact form / free onboarding requests).
-- Inserts only via service role from submit-inquiry edge function.

CREATE TABLE IF NOT EXISTS public.marketing_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  business_name text,
  phone text,
  topic text NOT NULL DEFAULT 'general'
    CHECK (topic IN ('general', 'onboarding')),
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'in_progress', 'closed')),
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_marketing_inquiries_created
  ON public.marketing_inquiries(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_marketing_inquiries_status
  ON public.marketing_inquiries(status, created_at DESC);

ALTER TABLE public.marketing_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY marketing_inquiries_select_admin ON public.marketing_inquiries
  FOR SELECT TO authenticated
  USING (public.is_platform_admin());

CREATE POLICY marketing_inquiries_update_admin ON public.marketing_inquiries
  FOR UPDATE TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());
