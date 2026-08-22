-- Server-side statement AI one-pass tracking (per business id in the workspace).

ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS statement_ai_usage jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.workspaces.statement_ai_usage IS
  'Map of business_id -> ISO timestamp when statement AI was successfully used. Enforced by bank-import-analyze.';
