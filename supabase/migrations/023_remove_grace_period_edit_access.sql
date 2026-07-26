-- Edit access ends when the trial or paid term ends — no grace period.

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
  sub_period_end timestamptz;
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
    -- Still on trial only when not already on a paid subscription row marked active.
    SELECT status, current_period_end
      INTO sub_status, sub_period_end
    FROM public.subscriptions
    WHERE workspace_id = p_workspace_id
    LIMIT 1;

    IF sub_status IS NULL OR sub_status = 'trialing' OR sub_status NOT IN ('active') THEN
      RETURN true;
    END IF;
  END IF;

  SELECT status, current_period_end
    INTO sub_status, sub_period_end
  FROM public.subscriptions
  WHERE workspace_id = p_workspace_id
  LIMIT 1;

  IF sub_status = 'active' AND (sub_period_end IS NULL OR sub_period_end > now()) THEN
    RETURN true;
  END IF;

  IF sub_status = 'trialing' AND ws.trial_ends_at IS NOT NULL AND ws.trial_ends_at > now() THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

COMMENT ON FUNCTION public.workspace_can_edit(uuid) IS
  'True when lifetime/beta, trial_ends_at is still in the future, or paid subscription is active through current_period_end. No grace period.';

-- Clear any stored grace windows so they cannot reopen edit access.
UPDATE public.workspaces SET grace_period_ends_at = NULL WHERE grace_period_ends_at IS NOT NULL;
UPDATE public.subscriptions SET grace_period_ends_at = NULL WHERE grace_period_ends_at IS NOT NULL;
