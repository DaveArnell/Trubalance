-- Harden financial_checklist_items: force RLS, tighten policies, revoke anon/public.

ALTER TABLE public.financial_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_checklist_items FORCE ROW LEVEL SECURITY;

ALTER TABLE public.financial_checklist_items
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Recreate policies with WITH CHECK on UPDATE so workspace_id cannot be moved cross-tenant.
DROP POLICY IF EXISTS financial_checklist_items_select ON public.financial_checklist_items;
DROP POLICY IF EXISTS financial_checklist_items_insert ON public.financial_checklist_items;
DROP POLICY IF EXISTS financial_checklist_items_update ON public.financial_checklist_items;
DROP POLICY IF EXISTS financial_checklist_items_delete ON public.financial_checklist_items;

CREATE POLICY financial_checklist_items_select ON public.financial_checklist_items FOR SELECT
  USING (workspace_id IN (SELECT public.user_workspace_ids()) OR public.is_admin());

CREATE POLICY financial_checklist_items_insert ON public.financial_checklist_items FOR INSERT
  WITH CHECK (workspace_id IN (SELECT public.user_workspace_ids()) OR public.is_admin());

CREATE POLICY financial_checklist_items_update ON public.financial_checklist_items FOR UPDATE
  USING (workspace_id IN (SELECT public.user_workspace_ids()) OR public.is_admin())
  WITH CHECK (workspace_id IN (SELECT public.user_workspace_ids()) OR public.is_admin());

CREATE POLICY financial_checklist_items_delete ON public.financial_checklist_items FOR DELETE
  USING (workspace_id IN (SELECT public.user_workspace_ids()) OR public.is_admin());

REVOKE ALL ON TABLE public.financial_checklist_items FROM PUBLIC;
REVOKE ALL ON TABLE public.financial_checklist_items FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.financial_checklist_items TO authenticated;
GRANT ALL ON TABLE public.financial_checklist_items TO service_role;

COMMENT ON TABLE public.financial_checklist_items IS
  'Server-only financial calendar/checklist. RLS: workspace members + admins only; no anon access.';
