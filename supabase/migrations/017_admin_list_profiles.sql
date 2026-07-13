-- Platform admins can list every profile (bypasses RLS that only showed own row).
-- Also aligns is_admin() with email-session platform admin checks.

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

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_platform_admin();
$$;

CREATE OR REPLACE FUNCTION public.admin_list_profiles(
  p_search text DEFAULT '',
  p_limit int DEFAULT 25,
  p_offset int DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_count int;
  items jsonb;
  q text := trim(coalesce(p_search, ''));
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Platform admin session required';
  END IF;

  SELECT count(*)::int INTO total_count
  FROM public.profiles p
  WHERE q = ''
     OR p.email ILIKE '%' || q || '%'
     OR coalesce(p.full_name, '') ILIKE '%' || q || '%';

  SELECT coalesce(jsonb_agg(to_jsonb(row_data) ORDER BY row_data.created_at DESC), '[]'::jsonb)
  INTO items
  FROM (
    SELECT
      p.id,
      p.email,
      p.full_name,
      p.role,
      p.created_at,
      p.last_sign_in_at,
      p.onboarding_completed
    FROM public.profiles p
    WHERE q = ''
       OR p.email ILIKE '%' || q || '%'
       OR coalesce(p.full_name, '') ILIKE '%' || q || '%'
    ORDER BY p.created_at DESC
    LIMIT greatest(p_limit, 1)
    OFFSET greatest(p_offset, 0)
  ) row_data;

  RETURN jsonb_build_object(
    'total', total_count,
    'items', items
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_profiles(text, int, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_profiles(text, int, int) TO authenticated;
