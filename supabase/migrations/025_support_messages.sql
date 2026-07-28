-- User → admin support messages (simple inbox; replies still manual via email for now)

CREATE TABLE IF NOT EXISTS public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email text NOT NULL,
  user_name text NOT NULL DEFAULT '',
  subject text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'pending', 'resolved', 'closed')),
  priority text NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_messages_created
  ON public.support_messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_messages_status
  ON public.support_messages(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_messages_user
  ON public.support_messages(user_id, created_at DESC);

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY support_messages_insert_own ON public.support_messages
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY support_messages_select_own_or_admin ON public.support_messages
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_platform_admin());

CREATE POLICY support_messages_update_admin ON public.support_messages
  FOR UPDATE TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());
