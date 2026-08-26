-- Financial calendar + checklist items (recurring ticks until done each cycle).

CREATE TABLE IF NOT EXISTS public.financial_checklist_items (
  id text PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  recurrence text NOT NULL DEFAULT 'monthly'
    CHECK (recurrence IN ('once', 'monthly', 'quarterly', 'yearly')),
  due_date date,
  due_day_of_month int CHECK (due_day_of_month IS NULL OR (due_day_of_month >= 1 AND due_day_of_month <= 31)),
  due_months int[] DEFAULT '{}',
  scope_level text NOT NULL CHECK (scope_level IN ('group', 'business')),
  scope_id text NOT NULL,
  notes text,
  completed_periods jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.financial_checklist_items ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY financial_checklist_items_select ON public.financial_checklist_items FOR SELECT
    USING (workspace_id IN (SELECT public.user_workspace_ids()) OR public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY financial_checklist_items_insert ON public.financial_checklist_items FOR INSERT
    WITH CHECK (workspace_id IN (SELECT public.user_workspace_ids()) OR public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY financial_checklist_items_update ON public.financial_checklist_items FOR UPDATE
    USING (workspace_id IN (SELECT public.user_workspace_ids()) OR public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY financial_checklist_items_delete ON public.financial_checklist_items FOR DELETE
    USING (workspace_id IN (SELECT public.user_workspace_ids()) OR public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_financial_checklist_items_workspace
  ON public.financial_checklist_items(workspace_id, sort_order);

COMMENT ON TABLE public.financial_checklist_items IS
  'Financial calendar / checklist: one-off or recurring money-admin tasks with period completion.';
