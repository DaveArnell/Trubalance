-- Rename paid middle tier business → multi; update CHECKs.
-- Run in Supabase SQL Editor after deploy if auto-migrate is not used.

UPDATE public.workspaces
SET subscription_tier = 'multi'
WHERE subscription_tier = 'business';

UPDATE public.workspaces
SET admin_tier_override = 'multi'
WHERE admin_tier_override = 'business';

UPDATE public.subscriptions
SET tier = 'multi'
WHERE tier = 'business';

ALTER TABLE public.workspaces
  DROP CONSTRAINT IF EXISTS workspaces_subscription_tier_check;

ALTER TABLE public.workspaces
  ADD CONSTRAINT workspaces_subscription_tier_check
  CHECK (subscription_tier IS NULL OR subscription_tier IN ('solo', 'multi', 'group'));

ALTER TABLE public.workspaces
  DROP CONSTRAINT IF EXISTS workspaces_admin_tier_override_check;

ALTER TABLE public.workspaces
  ADD CONSTRAINT workspaces_admin_tier_override_check
  CHECK (admin_tier_override IS NULL OR admin_tier_override IN ('solo', 'multi', 'group'));

ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_tier_check;

ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_tier_check
  CHECK (tier IS NULL OR tier IN ('solo', 'multi', 'group'));

COMMENT ON COLUMN public.workspaces.subscription_tier IS
  'solo | multi | group — Solo Business, Multi-site Business, Business Group';

-- Keep admin overrides accepting legacy "business" and storing as multi.
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
  v_lifetime boolean;
  v_beta boolean;
  v_tier text;
  v_sub_status text;
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Platform admin session required (complete 2FA at /vocatio-admin)';
  END IF;

  SELECT id INTO ws_id FROM public.workspaces WHERE owner_id = p_user_id LIMIT 1;
  IF ws_id IS NULL THEN
    RAISE EXCEPTION 'Workspace not found for this user';
  END IF;

  v_lifetime := p_lifetime_access OR p_access_type = 'lifetime';
  v_beta := p_beta_tester OR p_access_type = 'beta_tester';
  v_tier := COALESCE(NULLIF(p_subscription_plan, ''), 'solo');
  IF v_tier = 'business' OR v_tier = 'professional' THEN
    v_tier := 'multi';
  ELSIF v_tier = 'enterprise' THEN
    v_tier := 'group';
  END IF;

  IF v_lifetime OR v_beta THEN
    v_tier := 'group';
  END IF;

  IF v_lifetime THEN
    v_sub_status := 'active';
  ELSIF p_access_type = 'paid' THEN
    v_sub_status := 'active';
  ELSIF p_access_type = 'cancelled' THEN
    v_sub_status := 'canceled';
  ELSE
    v_sub_status := 'trialing';
  END IF;

  UPDATE public.workspaces
  SET
    subscription_tier = v_tier,
    admin_tier_override = v_tier,
    lifetime_access = v_lifetime,
    beta_tester = v_beta,
    trial_ends_at = CASE WHEN v_lifetime THEN NULL ELSE p_trial_ends_at END,
    updated_at = now()
  WHERE id = ws_id;

  UPDATE public.subscriptions
  SET
    tier = v_tier,
    status = v_sub_status,
    lifetime_access = v_lifetime,
    beta_tester = v_beta,
    trial_ends_at = CASE WHEN v_lifetime THEN NULL ELSE p_trial_ends_at END
  WHERE workspace_id = ws_id;
END;
$$;
