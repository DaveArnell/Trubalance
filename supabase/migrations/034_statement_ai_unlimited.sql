-- Statement AI: admin can allow unlimited analyses during manual onboarding.

ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS statement_ai_unlimited boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.workspaces.statement_ai_unlimited IS
  'When true, this workspace may run statement AI analysis more than once per business (manual onboarding / support).';

CREATE OR REPLACE FUNCTION public.admin_set_statement_ai_unlimited(
  p_user_id uuid,
  p_unlimited boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ws_id uuid;
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Platform admin session required (complete 2FA at /vocatio-admin)';
  END IF;

  SELECT id INTO ws_id FROM public.workspaces WHERE owner_id = p_user_id LIMIT 1;
  IF ws_id IS NULL THEN
    RAISE EXCEPTION 'Workspace not found for this user';
  END IF;

  UPDATE public.workspaces
  SET statement_ai_unlimited = COALESCE(p_unlimited, false),
      updated_at = now()
  WHERE id = ws_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_statement_ai_unlimited(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_statement_ai_unlimited(uuid, boolean) TO authenticated;
