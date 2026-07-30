-- Marketing attribution: which ad/campaign brought each user (first-party only).
-- Used to compare signup → onboarding → trial use → paid by campaign.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS attribution_source text,
  ADD COLUMN IF NOT EXISTS attribution_medium text,
  ADD COLUMN IF NOT EXISTS attribution_campaign text,
  ADD COLUMN IF NOT EXISTS attribution_content text,
  ADD COLUMN IF NOT EXISTS attribution_term text,
  ADD COLUMN IF NOT EXISTS attribution_landing_path text,
  ADD COLUMN IF NOT EXISTS attribution_captured_at timestamptz,
  ADD COLUMN IF NOT EXISTS attribution_click_id text;

COMMENT ON COLUMN public.profiles.attribution_source IS
  'Where the visitor came from (utm_source), e.g. meta, google, newsletter';
COMMENT ON COLUMN public.profiles.attribution_medium IS
  'Channel type (utm_medium), e.g. paid, email, social';
COMMENT ON COLUMN public.profiles.attribution_campaign IS
  'Campaign name (utm_campaign) — the main grouping for ad spend';
COMMENT ON COLUMN public.profiles.attribution_content IS
  'Ad variant (utm_content), e.g. video_a vs image_b';
COMMENT ON COLUMN public.profiles.attribution_term IS
  'Search keyword (utm_term) when used';
COMMENT ON COLUMN public.profiles.attribution_landing_path IS
  'First page path when the tagged link was opened';
COMMENT ON COLUMN public.profiles.attribution_captured_at IS
  'When the campaign tags were first captured on this device';
COMMENT ON COLUMN public.profiles.attribution_click_id IS
  'Optional platform click id (gclid / fbclid) for later matching';

CREATE INDEX IF NOT EXISTS idx_profiles_attribution_campaign
  ON public.profiles (attribution_campaign)
  WHERE attribution_campaign IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_attribution_source
  ON public.profiles (attribution_source)
  WHERE attribution_source IS NOT NULL;

-- Prefer campaign tags passed in signup metadata so attribution is set in the same
-- transaction as profile creation (email signup and OAuth).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_workspace_id uuid;
  trial_end timestamptz;
  meta jsonb;
BEGIN
  meta := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);

  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    attribution_source,
    attribution_medium,
    attribution_campaign,
    attribution_content,
    attribution_term,
    attribution_landing_path,
    attribution_captured_at,
    attribution_click_id
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(meta->>'full_name', split_part(NEW.email, '@', 1)),
    NULLIF(trim(meta->>'utm_source'), ''),
    NULLIF(trim(meta->>'utm_medium'), ''),
    NULLIF(trim(meta->>'utm_campaign'), ''),
    NULLIF(trim(meta->>'utm_content'), ''),
    NULLIF(trim(meta->>'utm_term'), ''),
    NULLIF(trim(meta->>'attribution_landing_path'), ''),
    CASE
      WHEN NULLIF(trim(meta->>'utm_source'), '') IS NOT NULL
        OR NULLIF(trim(meta->>'utm_campaign'), '') IS NOT NULL
        OR NULLIF(trim(meta->>'attribution_click_id'), '') IS NOT NULL
      THEN now()
      ELSE NULL
    END,
    NULLIF(trim(meta->>'attribution_click_id'), '')
  );

  trial_end := now() + interval '30 days';

  INSERT INTO public.workspaces (
    name,
    owner_id,
    lifetime_access,
    trial_ends_at,
    subscription_tier
  )
  VALUES (
    COALESCE(meta->>'full_name', split_part(NEW.email, '@', 1)) || '''s workspace',
    NEW.id,
    false,
    trial_end,
    'solo'
  )
  RETURNING id INTO new_workspace_id;

  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (new_workspace_id, NEW.id, 'owner');

  INSERT INTO public.subscriptions (
    workspace_id,
    status,
    lifetime_access,
    trial_ends_at,
    tier
  )
  VALUES (
    new_workspace_id,
    'trialing',
    false,
    trial_end,
    'solo'
  );

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS
  'Creates profile + workspace on signup with a 30-day trial. Copies campaign tags from auth metadata when present.';
