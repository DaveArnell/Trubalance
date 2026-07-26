-- Stop auto-granting lifetime access to the first 50 signups.
-- New workspaces get a standard 30-day trial. Lifetime remains available via Admin.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_workspace_id uuid;
  trial_end timestamptz;
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
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
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)) || '''s workspace',
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
  'Creates profile + workspace on signup with a 30-day trial. Lifetime access is admin-only.';
