-- Persist Trends "Only show data from" cutoffs on the workspace (survives hard refresh / new devices).
ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS reveal_from_overrides jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.workspaces.reveal_from_overrides IS
  'Scope-keyed YYYY-MM-DD cutoffs for Trends history (e.g. {"business:abc":"2025-01-01"}).';
