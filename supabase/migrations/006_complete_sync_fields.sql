-- 006: Fill all remaining gaps so every app field syncs to Supabase

-- ─── Commitments: missing columns ─────────────────────────────────────────────

ALTER TABLE public.commitments
  ADD COLUMN IF NOT EXISTS preserved_due_periods text[] DEFAULT '{}';

ALTER TABLE public.commitments
  ADD COLUMN IF NOT EXISTS paid_period_dates jsonb DEFAULT '{}';

-- ─── Expected receipts: missing columns ───────────────────────────────────────

ALTER TABLE public.expected_receipts
  ADD COLUMN IF NOT EXISTS receipt_timing text CHECK (receipt_timing IS NULL OR receipt_timing IN ('lump', 'accrual'));

ALTER TABLE public.expected_receipts
  ADD COLUMN IF NOT EXISTS accrual_start_date date;

ALTER TABLE public.expected_receipts
  ADD COLUMN IF NOT EXISTS period_amount_overrides jsonb DEFAULT '{}';

ALTER TABLE public.expected_receipts
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

-- ─── Day notes ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.day_notes (
  id text PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  date date NOT NULL,
  text text NOT NULL,
  scope_level text NOT NULL,
  scope_id text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.day_notes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY day_notes_select ON public.day_notes FOR SELECT
    USING (workspace_id IN (SELECT public.user_workspace_ids()) OR public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY day_notes_insert ON public.day_notes FOR INSERT
    WITH CHECK (workspace_id IN (SELECT public.user_workspace_ids()) OR public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY day_notes_update ON public.day_notes FOR UPDATE
    USING (workspace_id IN (SELECT public.user_workspace_ids()) OR public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY day_notes_delete ON public.day_notes FOR DELETE
    USING (workspace_id IN (SELECT public.user_workspace_ids()) OR public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_day_notes_workspace ON public.day_notes(workspace_id, date);

-- ─── Business reference profiles ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.business_reference_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  business_id text NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  fields jsonb NOT NULL DEFAULT '[]',
  notes text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, business_id)
);

ALTER TABLE public.business_reference_profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY business_reference_profiles_select ON public.business_reference_profiles FOR SELECT
    USING (workspace_id IN (SELECT public.user_workspace_ids()) OR public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY business_reference_profiles_insert ON public.business_reference_profiles FOR INSERT
    WITH CHECK (workspace_id IN (SELECT public.user_workspace_ids()) OR public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY business_reference_profiles_update ON public.business_reference_profiles FOR UPDATE
    USING (workspace_id IN (SELECT public.user_workspace_ids()) OR public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY business_reference_profiles_delete ON public.business_reference_profiles FOR DELETE
    USING (workspace_id IN (SELECT public.user_workspace_ids()) OR public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Diary reminders ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.diary_reminders (
  id text PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  business_id text NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  title text NOT NULL,
  date date NOT NULL,
  category text NOT NULL CHECK (category IN ('tax', 'companies-house', 'hr-pensions', 'insurance', 'general')),
  notes text,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  recurring text NOT NULL DEFAULT 'none' CHECK (recurring IN ('none', 'yearly')),
  template_id text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  week_before_alert_dismissed_for date,
  overdue_alert_dismissed_for date
);

ALTER TABLE public.diary_reminders ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY diary_reminders_select ON public.diary_reminders FOR SELECT
    USING (workspace_id IN (SELECT public.user_workspace_ids()) OR public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY diary_reminders_insert ON public.diary_reminders FOR INSERT
    WITH CHECK (workspace_id IN (SELECT public.user_workspace_ids()) OR public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY diary_reminders_update ON public.diary_reminders FOR UPDATE
    USING (workspace_id IN (SELECT public.user_workspace_ids()) OR public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY diary_reminders_delete ON public.diary_reminders FOR DELETE
    USING (workspace_id IN (SELECT public.user_workspace_ids()) OR public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_diary_reminders_workspace ON public.diary_reminders(workspace_id, date);
