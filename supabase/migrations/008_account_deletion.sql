-- Account and workspace deletion (GDPR erasure + platform admin)

CREATE OR REPLACE FUNCTION public.delete_user_account(p_target_user_id uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  caller_id uuid := auth.uid();
  target_id uuid := COALESCE(p_target_user_id, caller_id);
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF target_id <> caller_id AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  -- Workspace + domain data cascade from profile/workspace FKs.
  DELETE FROM public.workspaces WHERE owner_id = target_id;
  DELETE FROM public.user_events WHERE user_id = target_id;
  DELETE FROM public.profiles WHERE id = target_id;
  DELETE FROM auth.users WHERE id = target_id;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_user_account(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_user_account(uuid) TO authenticated;
