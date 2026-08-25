-- Immutable restore points. Workspace autosave must never delete these rows.

CREATE TABLE IF NOT EXISTS public.workspace_restore_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  label text NOT NULL,
  kind text NOT NULL DEFAULT 'autosave',
  payload jsonb NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_workspace_restore_points_workspace_created
  ON public.workspace_restore_points (workspace_id, created_at DESC);

ALTER TABLE public.workspace_restore_points ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS workspace_restore_points_select ON public.workspace_restore_points;
CREATE POLICY workspace_restore_points_select ON public.workspace_restore_points FOR SELECT
  USING (workspace_id IN (SELECT public.user_workspace_ids()) OR public.is_admin());

DROP POLICY IF EXISTS workspace_restore_points_insert ON public.workspace_restore_points;
CREATE POLICY workspace_restore_points_insert ON public.workspace_restore_points FOR INSERT
  WITH CHECK (workspace_id IN (SELECT public.user_workspace_ids()) OR public.is_admin());

DROP POLICY IF EXISTS workspace_restore_points_delete ON public.workspace_restore_points;
CREATE POLICY workspace_restore_points_delete ON public.workspace_restore_points FOR DELETE
  USING (workspace_id IN (SELECT public.user_workspace_ids()) OR public.is_admin());

DROP TRIGGER IF EXISTS trg_enforce_workspace_writable ON public.workspace_restore_points;
CREATE TRIGGER trg_enforce_workspace_writable
  BEFORE INSERT OR UPDATE OR DELETE ON public.workspace_restore_points
  FOR EACH ROW EXECUTE FUNCTION public.enforce_workspace_writable();
