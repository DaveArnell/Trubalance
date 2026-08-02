-- Trial lifecycle email dedupe log (Resend via send-trial-emails edge function).
-- Run in Supabase SQL Editor if not applied by CLI migrate.

CREATE TABLE IF NOT EXISTS public.trial_email_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  email_type text NOT NULL,
  recipient_email text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, email_type)
);

CREATE INDEX IF NOT EXISTS idx_trial_email_log_workspace
  ON public.trial_email_log (workspace_id);

ALTER TABLE public.trial_email_log ENABLE ROW LEVEL SECURITY;

-- Service role only (edge function). No policies for authenticated clients.
