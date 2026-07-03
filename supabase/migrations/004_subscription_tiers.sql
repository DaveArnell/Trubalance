-- Subscription tier fields (Stripe-ready, no payment integration yet)

ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS subscription_tier text NOT NULL DEFAULT 'solo'
    CHECK (subscription_tier IN ('solo', 'business', 'group'));

ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;

ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS lifetime_access boolean NOT NULL DEFAULT false;

ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS beta_tester boolean NOT NULL DEFAULT false;

ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS admin_tier_override text
    CHECK (admin_tier_override IS NULL OR admin_tier_override IN ('solo', 'business', 'group'));

ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS grace_period_ends_at timestamptz;

ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS billing_interval text
    CHECK (billing_interval IS NULL OR billing_interval IN ('monthly', 'annual'));

-- Migrate legacy plan column values if present
UPDATE public.workspaces
SET subscription_tier = CASE
  WHEN plan IN ('professional', 'business') THEN 'business'
  WHEN plan IN ('group', 'enterprise') THEN 'group'
  ELSE 'solo'
END
WHERE subscription_tier = 'solo' AND plan IS NOT NULL AND plan <> 'free';

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS tier text NOT NULL DEFAULT 'solo'
    CHECK (tier IN ('solo', 'business', 'group'));

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS lifetime_access boolean NOT NULL DEFAULT false;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS beta_tester boolean NOT NULL DEFAULT false;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS grace_period_ends_at timestamptz;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS billing_interval text
    CHECK (billing_interval IS NULL OR billing_interval IN ('monthly', 'annual'));

COMMENT ON COLUMN public.workspaces.subscription_tier IS 'Solo | business | group — see app subscription config';
COMMENT ON COLUMN public.workspaces.lifetime_access IS 'When true, ignore billing and trial expiry';
COMMENT ON COLUMN public.workspaces.trial_ends_at IS '90-day trial default set at signup (application layer)';
