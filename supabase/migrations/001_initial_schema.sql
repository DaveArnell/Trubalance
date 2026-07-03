-- Trubalance initial schema — run in Supabase SQL editor or via CLI

-- ─── Profiles (extends auth.users) ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  avatar_url text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
  onboarding_completed boolean NOT NULL DEFAULT false,
  last_sign_in_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Workspaces ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'My workspace',
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'free',
  stripe_customer_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.workspace_members (
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'editor', 'viewer')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, user_id)
);

-- ─── Domain tables (workspace-scoped) ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.groups (
  id text PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.businesses (
  id text PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  group_id text NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.venues (
  id text PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  business_id text NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.accounts (
  id text PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  venue_id text REFERENCES public.venues(id) ON DELETE SET NULL,
  business_id text REFERENCES public.businesses(id) ON DELETE SET NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('current', 'savings', 'reserve')),
  balance numeric NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.commitments (
  id text PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  schedule text NOT NULL CHECK (schedule IN ('monthly', 'planned')),
  amount numeric NOT NULL DEFAULT 0,
  due_day_of_month int,
  planned_label text,
  planned_due_date date,
  funding_method text,
  amount_to_reserve_now numeric,
  funding_start_date date,
  scope_level text NOT NULL,
  scope_id text NOT NULL,
  linked_account_id text REFERENCES public.accounts(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'healthy',
  notes text,
  last_paid_period text,
  dismissed_due_periods text[] DEFAULT '{}',
  created_at timestamptz,
  sort_order int NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.expected_receipts (
  id text PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  expected_date date,
  scope_level text NOT NULL,
  scope_id text NOT NULL,
  notes text,
  received boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reserve_planners (
  id text PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  business_id text NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  reserve_account_id text REFERENCES public.accounts(id) ON DELETE SET NULL,
  buffer_amount numeric NOT NULL DEFAULT 0,
  actual_balance numeric NOT NULL DEFAULT 0,
  month_confirmations jsonb DEFAULT '{}',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reserve_bills (
  id text PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  planner_id text NOT NULL REFERENCES public.reserve_planners(id) ON DELETE CASCADE,
  name text NOT NULL,
  month_amounts jsonb NOT NULL DEFAULT '{}',
  month_due_days jsonb DEFAULT '{}',
  venue_id text REFERENCES public.venues(id) ON DELETE SET NULL,
  notes text,
  last_paid_period text,
  dismissed_due_periods text[] DEFAULT '{}',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.balance_snapshots (
  id text PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  date date NOT NULL,
  scope_type text NOT NULL,
  scope_id text NOT NULL,
  view_name text NOT NULL,
  cash numeric NOT NULL DEFAULT 0,
  committed_funds numeric NOT NULL DEFAULT 0,
  expected_receipts numeric NOT NULL DEFAULT 0,
  true_balance numeric NOT NULL DEFAULT 0,
  note text,
  note_source text,
  freshness text NOT NULL DEFAULT 'green',
  changed_accounts jsonb DEFAULT '[]',
  recorded_values jsonb,
  corrected_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, date, scope_type, scope_id)
);

CREATE TABLE IF NOT EXISTS public.user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  pref_key text NOT NULL,
  pref_value jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, workspace_id, pref_key)
);

-- ─── Billing ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL UNIQUE REFERENCES public.workspaces(id) ON DELETE CASCADE,
  stripe_subscription_id text UNIQUE,
  stripe_price_id text,
  status text NOT NULL DEFAULT 'inactive',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  stripe_payment_intent_id text,
  stripe_invoice_id text,
  amount_cents int NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'gbp',
  status text NOT NULL DEFAULT 'pending',
  description text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Analytics & audit ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action text NOT NULL,
  target_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  target_workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Helpers ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.user_workspace_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  UNION
  SELECT id FROM public.workspaces WHERE owner_id = auth.uid();
$$;

-- ─── Signup trigger ───────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_workspace_id uuid;
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );

  INSERT INTO public.workspaces (name, owner_id)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)) || '''s workspace',
    NEW.id
  )
  RETURNING id INTO new_workspace_id;

  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (new_workspace_id, NEW.id, 'owner');

  INSERT INTO public.subscriptions (workspace_id, status)
  VALUES (new_workspace_id, 'free');

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expected_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reserve_planners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reserve_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.balance_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY profiles_select ON public.profiles FOR SELECT
  USING (id = auth.uid() OR public.is_admin());
CREATE POLICY profiles_update ON public.profiles FOR UPDATE
  USING (id = auth.uid() OR public.is_admin());

-- Workspaces
CREATE POLICY workspaces_select ON public.workspaces FOR SELECT
  USING (id IN (SELECT public.user_workspace_ids()) OR public.is_admin());
CREATE POLICY workspaces_update ON public.workspaces FOR UPDATE
  USING (owner_id = auth.uid() OR public.is_admin());

-- Workspace members
CREATE POLICY workspace_members_select ON public.workspace_members FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

-- Generic workspace data policies (repeat pattern)
DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'groups', 'businesses', 'venues', 'accounts', 'commitments',
    'expected_receipts', 'reserve_planners', 'reserve_bills', 'balance_snapshots'
  ]
  LOOP
    EXECUTE format('
      CREATE POLICY %I_select ON public.%I FOR SELECT
        USING (workspace_id IN (SELECT public.user_workspace_ids()) OR public.is_admin());
      CREATE POLICY %I_insert ON public.%I FOR INSERT
        WITH CHECK (workspace_id IN (SELECT public.user_workspace_ids()) OR public.is_admin());
      CREATE POLICY %I_update ON public.%I FOR UPDATE
        USING (workspace_id IN (SELECT public.user_workspace_ids()) OR public.is_admin());
      CREATE POLICY %I_delete ON public.%I FOR DELETE
        USING (workspace_id IN (SELECT public.user_workspace_ids()) OR public.is_admin());
    ', tbl, tbl, tbl, tbl, tbl, tbl, tbl, tbl);
  END LOOP;
END $$;

-- User preferences
CREATE POLICY user_preferences_all ON public.user_preferences FOR ALL
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- Subscriptions & payments (read for owner/admin)
CREATE POLICY subscriptions_select ON public.subscriptions FOR SELECT
  USING (workspace_id IN (SELECT public.user_workspace_ids()) OR public.is_admin());
CREATE POLICY payments_select ON public.payments FOR SELECT
  USING (workspace_id IN (SELECT public.user_workspace_ids()) OR public.is_admin());

-- Events: users insert own, admins read all
CREATE POLICY user_events_insert ON public.user_events FOR INSERT
  WITH CHECK (user_id = auth.uid() OR public.is_admin());
CREATE POLICY user_events_select ON public.user_events FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

-- Admin audit log
CREATE POLICY admin_audit_insert ON public.admin_audit_log FOR INSERT
  WITH CHECK (admin_id = auth.uid() AND public.is_admin());
CREATE POLICY admin_audit_select ON public.admin_audit_log FOR SELECT
  USING (public.is_admin());

-- ─── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_groups_workspace ON public.groups(workspace_id);
CREATE INDEX IF NOT EXISTS idx_businesses_workspace ON public.businesses(workspace_id);
CREATE INDEX IF NOT EXISTS idx_venues_workspace ON public.venues(workspace_id);
CREATE INDEX IF NOT EXISTS idx_accounts_workspace ON public.accounts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_commitments_workspace ON public.commitments(workspace_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_workspace_date ON public.balance_snapshots(workspace_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_user_events_created ON public.user_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_events_type ON public.user_events(event_type);
CREATE INDEX IF NOT EXISTS idx_profiles_created ON public.profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_created ON public.payments(created_at DESC);
