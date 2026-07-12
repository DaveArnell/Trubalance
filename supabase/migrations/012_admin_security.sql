-- Platform admin security: separate vocatio.io admins, 2FA sessions, server-side notes,
-- billing field protection, and trial read-only enforcement.

-- ─── Platform admins (separate from customer profiles.role) ─────────────────

CREATE TABLE IF NOT EXISTS public.platform_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  totp_secret text,
  totp_enabled boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz,
  CONSTRAINT platform_admins_email_domain CHECK (lower(email) LIKE '%@vocatio.io')
);

CREATE TABLE IF NOT EXISTS public.admin_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_admin_id uuid NOT NULL REFERENCES public.platform_admins(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_user_expires
  ON public.admin_sessions(user_id, expires_at DESC);

CREATE TABLE IF NOT EXISTS public.admin_user_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform_admin_id uuid NOT NULL REFERENCES public.platform_admins(id) ON DELETE CASCADE,
  author_email text NOT NULL,
  text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_user_notes_target
  ON public.admin_user_notes(target_user_id, created_at DESC);

-- Hide TOTP secret from authenticated clients
REVOKE ALL ON public.platform_admins FROM authenticated, anon;
GRANT SELECT (id, user_id, email, totp_enabled, is_active, created_at, last_login_at)
  ON public.platform_admins TO authenticated;

-- ─── Admin session helpers ───────────────────────────────────────────────────

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
      AND pa.totp_enabled = true
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

CREATE OR REPLACE FUNCTION public.has_active_admin_session()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_platform_admin();
$$;

GRANT EXECUTE ON FUNCTION public.has_active_admin_session() TO authenticated;

-- ─── Trial / billing edit gate ───────────────────────────────────────────────

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

  -- Legacy workspaces: no trial end date saved — allow 90 days from workspace creation
  IF ws.trial_ends_at IS NULL AND NOT ws.lifetime_access AND NOT ws.beta_tester THEN
    IF ws.created_at + interval '90 days' > now() THEN
      RETURN true;
    END IF;
  END IF;

  RETURN false;
END;
$$;

-- ─── Block profile role self-escalation ──────────────────────────────────────

CREATE OR REPLACE FUNCTION public.prevent_profile_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Profile role cannot be changed';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_profile_role_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_profile_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_role_escalation();

-- ─── Block workspace billing tampering by owners ───────────────────────────

CREATE OR REPLACE FUNCTION public.prevent_workspace_billing_tamper()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_platform_admin() THEN
    RETURN NEW;
  END IF;

  NEW.subscription_tier := OLD.subscription_tier;
  NEW.trial_ends_at := OLD.trial_ends_at;
  NEW.lifetime_access := OLD.lifetime_access;
  NEW.beta_tester := OLD.beta_tester;
  NEW.admin_tier_override := OLD.admin_tier_override;
  NEW.grace_period_ends_at := OLD.grace_period_ends_at;
  NEW.billing_interval := OLD.billing_interval;
  NEW.stripe_customer_id := OLD.stripe_customer_id;
  NEW.plan := OLD.plan;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_workspace_billing_tamper ON public.workspaces;
CREATE TRIGGER trg_prevent_workspace_billing_tamper
  BEFORE UPDATE ON public.workspaces
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_workspace_billing_tamper();

-- ─── Enforce read-only workspaces on data writes ────────────────────────────

CREATE OR REPLACE FUNCTION public.enforce_workspace_writable()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ws_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    ws_id := OLD.workspace_id;
  ELSE
    ws_id := NEW.workspace_id;
  END IF;

  IF ws_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF NOT public.workspace_can_edit(ws_id) THEN
    RAISE EXCEPTION 'This workspace is read-only. Upgrade or renew your subscription to edit.';
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'groups', 'businesses', 'venues', 'accounts', 'commitments',
    'expected_receipts', 'reserve_planners', 'reserve_bills', 'balance_snapshots',
    'history_records', 'day_notes', 'business_reference_profiles', 'diary_reminders'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_enforce_workspace_writable ON public.%I', tbl);
    EXECUTE format(
      'CREATE TRIGGER trg_enforce_workspace_writable
         BEFORE INSERT OR UPDATE OR DELETE ON public.%I
         FOR EACH ROW EXECUTE FUNCTION public.enforce_workspace_writable()',
      tbl
    );
  END LOOP;
END $$;

-- ─── RLS for new tables ──────────────────────────────────────────────────────

ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_user_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS platform_admins_select_own ON public.platform_admins;
CREATE POLICY platform_admins_select_own ON public.platform_admins FOR SELECT
  USING (user_id = auth.uid() OR public.is_platform_admin());

DROP POLICY IF EXISTS admin_sessions_select_own ON public.admin_sessions;
CREATE POLICY admin_sessions_select_own ON public.admin_sessions FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS admin_user_notes_select ON public.admin_user_notes;
CREATE POLICY admin_user_notes_select ON public.admin_user_notes FOR SELECT
  USING (public.is_platform_admin());

DROP POLICY IF EXISTS admin_user_notes_insert ON public.admin_user_notes;
CREATE POLICY admin_user_notes_insert ON public.admin_user_notes FOR INSERT
  WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS subscriptions_admin_update ON public.subscriptions;
CREATE POLICY subscriptions_admin_update ON public.subscriptions FOR UPDATE
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- Demote legacy profile roles (admin access is platform_admins only now)
ALTER TABLE public.profiles DISABLE TRIGGER trg_prevent_profile_role_escalation;
UPDATE public.profiles
SET role = 'user'
WHERE role IN ('admin', 'super_admin');
ALTER TABLE public.profiles ENABLE TRIGGER trg_prevent_profile_role_escalation;

COMMENT ON TABLE public.platform_admins IS
  'Vocatio.io platform operators. Add rows manually after the @vocatio.io user signs up.';
COMMENT ON TABLE public.admin_sessions IS
  'Created by admin-auth edge function after successful TOTP verification.';
COMMENT ON TABLE public.admin_user_notes IS
  'Server-side admin notes on customer accounts.';
