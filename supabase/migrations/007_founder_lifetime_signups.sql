-- Grant lifetime access to the first 50 signups (founder / early feedback cohort).

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_workspace_id uuid;
  existing_profiles int;
  grant_lifetime boolean;
  trial_end timestamptz;
BEGIN
  SELECT count(*)::int INTO existing_profiles FROM public.profiles;
  grant_lifetime := existing_profiles < 50;

  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );

  trial_end := CASE WHEN grant_lifetime THEN NULL ELSE now() + interval '90 days' END;

  INSERT INTO public.workspaces (
    name,
    owner_id,
    lifetime_access,
    trial_ends_at,
    subscription_tier
  )
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)) || '''s workspace',
    NEW.id,
    grant_lifetime,
    trial_end,
    CASE WHEN grant_lifetime THEN 'group' ELSE 'solo' END
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
    CASE WHEN grant_lifetime THEN 'active' ELSE 'trialing' END,
    grant_lifetime,
    trial_end,
    CASE WHEN grant_lifetime THEN 'group' ELSE 'solo' END
  );

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS
  'Creates profile + workspace on signup. First 50 profiles receive lifetime_access.';
