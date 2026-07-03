-- History records + due alert acknowledgments

ALTER TABLE public.commitments
  ADD COLUMN IF NOT EXISTS acknowledged_due_periods text[] DEFAULT '{}';

ALTER TABLE public.reserve_bills
  ADD COLUMN IF NOT EXISTS acknowledged_due_periods text[] DEFAULT '{}';

CREATE TABLE IF NOT EXISTS public.history_records (
  id text PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  date date NOT NULL,
  saved_at timestamptz NOT NULL DEFAULT now(),
  payload jsonb NOT NULL,
  UNIQUE (workspace_id, date)
);

ALTER TABLE public.history_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY history_records_select ON public.history_records FOR SELECT
  USING (workspace_id IN (SELECT public.user_workspace_ids()) OR public.is_admin());
CREATE POLICY history_records_insert ON public.history_records FOR INSERT
  WITH CHECK (workspace_id IN (SELECT public.user_workspace_ids()) OR public.is_admin());
CREATE POLICY history_records_update ON public.history_records FOR UPDATE
  USING (workspace_id IN (SELECT public.user_workspace_ids()) OR public.is_admin());
CREATE POLICY history_records_delete ON public.history_records FOR DELETE
  USING (workspace_id IN (SELECT public.user_workspace_ids()) OR public.is_admin());

CREATE INDEX IF NOT EXISTS idx_history_records_workspace_date
  ON public.history_records(workspace_id, date DESC);
