-- Backfill trial dates for accounts created before trial_ends_at was set on signup.

UPDATE public.workspaces w
SET trial_ends_at = w.created_at + interval '90 days'
WHERE w.trial_ends_at IS NULL
  AND w.lifetime_access = false
  AND w.beta_tester = false;

UPDATE public.subscriptions s
SET
  status = 'trialing',
  trial_ends_at = w.trial_ends_at,
  tier = COALESCE(NULLIF(s.tier, ''), w.subscription_tier, 'solo')
FROM public.workspaces w
WHERE s.workspace_id = w.id
  AND s.status = 'free'
  AND w.lifetime_access = false;

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

  IF sub_status IN ('active', 'trialing', 'grace_period', 'free') THEN
    RETURN true;
  END IF;

  IF ws.trial_ends_at IS NULL AND NOT ws.lifetime_access AND NOT ws.beta_tester THEN
    IF ws.created_at + interval '90 days' > now() THEN
      RETURN true;
    END IF;
  END IF;

  RETURN false;
END;
$$;
