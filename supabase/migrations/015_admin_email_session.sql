-- Admin sessions: email code verification (no authenticator app required).

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.platform_admins pa
    INNER JOIN public.admin_sessions s
      ON s.platform_admin_id = pa.id
     AND s.user_id = pa.user_id
    WHERE pa.user_id = auth.uid()
      AND pa.is_active = true
      AND s.expires_at > now()
  );
$$;
