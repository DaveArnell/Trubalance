-- Admin-controlled workspace access (lifetime, beta, trial) via secure RPC.

CREATE OR REPLACE FUNCTION public.admin_apply_workspace_access(
  p_user_id uuid,
  p_access_type text,
  p_subscription_plan text DEFAULT 'solo',
  p_trial_ends_at timestamptz DEFAULT NULL,
  p_lifetime_access boolean DEFAULT false,
  p_beta_tester boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ws_id uuid;
  lifetime boolean;
  beta boolean;
  tier text;
  sub_status text;
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Platform admin session required (complete 2FA at /vocatio-admin)';
  END IF;

  SELECT id INTO ws_id FROM public.workspaces WHERE owner_id = p_user_id LIMIT 1;
  IF ws_id IS NULL THEN
    RAISE EXCEPTION 'Workspace not found for this user';
  END IF;

  lifetime := p_lifetime_access OR p_access_type = 'lifetime';
  beta := p_beta_tester OR p_access_type = 'beta_tester';
  tier := COALESCE(NULLIF(p_subscription_plan, ''), 'solo');

  IF lifetime OR beta THEN
    tier := 'group';
  END IF;

  IF lifetime THEN
    sub_status := 'active';
  ELSIF p_access_type = 'paid' THEN
    sub_status := 'active';
  ELSIF p_access_type = 'cancelled' THEN
    sub_status := 'canceled';
  ELSE
    sub_status := 'trialing';
  END IF;

  UPDATE public.workspaces
  SET
    subscription_tier = tier,
    admin_tier_override = tier,
    lifetime_access = lifetime,
    beta_tester = beta,
    trial_ends_at = CASE WHEN lifetime THEN NULL ELSE p_trial_ends_at END,
    updated_at = now()
  WHERE id = ws_id;

  UPDATE public.subscriptions
  SET
    tier = tier,
    status = sub_status,
    lifetime_access = lifetime,
    beta_tester = beta,
    trial_ends_at = CASE WHEN lifetime THEN NULL ELSE p_trial_ends_at END
  WHERE workspace_id = ws_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_apply_workspace_access(uuid, text, text, timestamptz, boolean, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_apply_workspace_access(uuid, text, text, timestamptz, boolean, boolean) TO authenticated;
