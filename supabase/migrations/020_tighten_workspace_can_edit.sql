-- Tighten workspace_can_edit: do not treat legacy "free" as paid access,
-- and do not grant an open-ended edit window when trial_ends_at is null.

CREATE OR REPLACE FUNCTION public.workspace_can_edit(p_workspace_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ws public.workspaces%ROWTYPE;
  sub_status text;
BEGIN
  IF public.is_platform_admin() THEN
    RETURN true;
  END IF;

  SELECT * INTO ws FROM public.workspaces WHERE id = p_workspace_id;
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF ws.lifetime_access OR ws.beta_tester THEN
    RETURN true;
  END IF;

  IF ws.trial_ends_at IS NOT NULL AND ws.trial_ends_at > now() THEN
    RETURN true;
  END IF;

  IF ws.grace_period_ends_at IS NOT NULL AND ws.grace_period_ends_at > now() THEN
    RETURN true;
  END IF;

  SELECT status INTO sub_status
  FROM public.subscriptions
  WHERE workspace_id = p_workspace_id
  LIMIT 1;

  -- Paid / in-trial subscription only — never treat legacy "free" as editable forever.
  IF sub_status IN ('active', 'trialing', 'grace_period') THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

COMMENT ON FUNCTION public.workspace_can_edit(uuid) IS
  'True when the workspace may mutate data: lifetime/beta, active trial/grace, or paid subscription.';
