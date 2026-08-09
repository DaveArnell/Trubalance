-- Acquisition funnel analytics (first-party): anonymous visitors + funnel events.
-- Admin-only read. Anonymous/authenticated write via RPC + insert. No financial data.

CREATE TABLE IF NOT EXISTS public.acquisition_visitors (
  id uuid PRIMARY KEY,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  attribution_source text,
  attribution_medium text,
  attribution_campaign text,
  attribution_content text,
  attribution_term text,
  attribution_landing_path text,
  attribution_click_id text,
  referrer_host text,
  linked_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  linked_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_acquisition_visitors_first_seen
  ON public.acquisition_visitors (first_seen_at DESC);

CREATE INDEX IF NOT EXISTS idx_acquisition_visitors_linked_user
  ON public.acquisition_visitors (linked_user_id)
  WHERE linked_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_acquisition_visitors_campaign
  ON public.acquisition_visitors (attribution_campaign)
  WHERE attribution_campaign IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.acquisition_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id uuid REFERENCES public.acquisition_visitors(id) ON DELETE SET NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT acquisition_events_type_check CHECK (
    event_type IN (
      'visit',
      'signup_started',
      'account_created',
      'onboarding_started',
      'onboarding_completed',
      'checkout_started',
      'paid'
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_acquisition_events_type_created
  ON public.acquisition_events (event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_acquisition_events_visitor
  ON public.acquisition_events (visitor_id, event_type)
  WHERE visitor_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_acquisition_events_user
  ON public.acquisition_events (user_id, event_type)
  WHERE user_id IS NOT NULL;

-- Dedupe noisy visit events: one visit per visitor per UTC day.
CREATE UNIQUE INDEX IF NOT EXISTS idx_acquisition_events_visit_daily
  ON public.acquisition_events (visitor_id, ((created_at AT TIME ZONE 'UTC')::date))
  WHERE event_type = 'visit' AND visitor_id IS NOT NULL;

-- One account_created / paid per user (idempotent).
CREATE UNIQUE INDEX IF NOT EXISTS idx_acquisition_events_account_created_user
  ON public.acquisition_events (user_id)
  WHERE event_type = 'account_created' AND user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_acquisition_events_paid_user
  ON public.acquisition_events (user_id)
  WHERE event_type = 'paid' AND user_id IS NOT NULL;

ALTER TABLE public.acquisition_visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acquisition_events ENABLE ROW LEVEL SECURITY;

-- Clients write via SECURITY DEFINER RPCs (no broad SELECT on visitor rows).
DROP POLICY IF EXISTS acquisition_visitors_insert ON public.acquisition_visitors;
DROP POLICY IF EXISTS acquisition_visitors_update ON public.acquisition_visitors;
DROP POLICY IF EXISTS acquisition_visitors_admin_select ON public.acquisition_visitors;
CREATE POLICY acquisition_visitors_admin_select
  ON public.acquisition_visitors
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS acquisition_events_insert ON public.acquisition_events;
CREATE POLICY acquisition_events_insert
  ON public.acquisition_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS acquisition_events_admin_select ON public.acquisition_events;
CREATE POLICY acquisition_events_admin_select
  ON public.acquisition_events
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Upsert visitor + first-touch attribution (never overwrite existing touch).
CREATE OR REPLACE FUNCTION public.ensure_acquisition_visitor(
  p_id uuid,
  p_source text DEFAULT NULL,
  p_medium text DEFAULT NULL,
  p_campaign text DEFAULT NULL,
  p_content text DEFAULT NULL,
  p_term text DEFAULT NULL,
  p_landing_path text DEFAULT NULL,
  p_click_id text DEFAULT NULL,
  p_referrer_host text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.acquisition_visitors (
    id,
    first_seen_at,
    last_seen_at,
    attribution_source,
    attribution_medium,
    attribution_campaign,
    attribution_content,
    attribution_term,
    attribution_landing_path,
    attribution_click_id,
    referrer_host
  )
  VALUES (
    p_id,
    now(),
    now(),
    NULLIF(trim(p_source), ''),
    NULLIF(trim(p_medium), ''),
    NULLIF(trim(p_campaign), ''),
    NULLIF(trim(p_content), ''),
    NULLIF(trim(p_term), ''),
    NULLIF(trim(p_landing_path), ''),
    NULLIF(trim(p_click_id), ''),
    NULLIF(trim(p_referrer_host), '')
  )
  ON CONFLICT (id) DO UPDATE SET
    last_seen_at = now(),
    attribution_source = COALESCE(
      public.acquisition_visitors.attribution_source,
      EXCLUDED.attribution_source
    ),
    attribution_medium = COALESCE(
      public.acquisition_visitors.attribution_medium,
      EXCLUDED.attribution_medium
    ),
    attribution_campaign = COALESCE(
      public.acquisition_visitors.attribution_campaign,
      EXCLUDED.attribution_campaign
    ),
    attribution_content = COALESCE(
      public.acquisition_visitors.attribution_content,
      EXCLUDED.attribution_content
    ),
    attribution_term = COALESCE(
      public.acquisition_visitors.attribution_term,
      EXCLUDED.attribution_term
    ),
    attribution_landing_path = COALESCE(
      public.acquisition_visitors.attribution_landing_path,
      EXCLUDED.attribution_landing_path
    ),
    attribution_click_id = COALESCE(
      public.acquisition_visitors.attribution_click_id,
      EXCLUDED.attribution_click_id
    ),
    referrer_host = COALESCE(
      public.acquisition_visitors.referrer_host,
      EXCLUDED.referrer_host
    );
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_acquisition_visitor(
  uuid, text, text, text, text, text, text, text, text
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_acquisition_visitor(
  uuid, text, text, text, text, text, text, text, text
) TO anon, authenticated;

-- Link anonymous visitor → user once (first link wins).
CREATE OR REPLACE FUNCTION public.link_acquisition_visitor(
  p_visitor_id uuid,
  p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_visitor_id IS NULL OR p_user_id IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.acquisition_visitors
  SET
    linked_user_id = p_user_id,
    linked_at = COALESCE(linked_at, now()),
    last_seen_at = now()
  WHERE id = p_visitor_id
    AND (linked_user_id IS NULL OR linked_user_id = p_user_id);
END;
$$;

REVOKE ALL ON FUNCTION public.link_acquisition_visitor(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.link_acquisition_visitor(uuid, uuid) TO anon, authenticated;

COMMENT ON TABLE public.acquisition_visitors IS
  'Anonymous first-touch acquisition visitors for Marketing Funnel admin. No financial data.';
COMMENT ON TABLE public.acquisition_events IS
  'Funnel stage events (visit → paid) for Marketing Funnel admin. No financial data.';

-- ---------------------------------------------------------------------------
-- Historical backfill from existing Cash Prophet accounts (no anonymous visits)
-- ---------------------------------------------------------------------------
INSERT INTO public.acquisition_visitors (
  id,
  first_seen_at,
  last_seen_at,
  attribution_source,
  attribution_medium,
  attribution_campaign,
  attribution_content,
  attribution_term,
  attribution_landing_path,
  attribution_click_id,
  linked_user_id,
  linked_at
)
SELECT
  p.id,
  coalesce(p.created_at, now()),
  coalesce(p.created_at, now()),
  p.attribution_source,
  p.attribution_medium,
  p.attribution_campaign,
  p.attribution_content,
  p.attribution_term,
  p.attribution_landing_path,
  p.attribution_click_id,
  p.id,
  coalesce(p.created_at, now())
FROM public.profiles p
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.acquisition_events (visitor_id, user_id, event_type, created_at)
SELECT
  p.id,
  p.id,
  'account_created',
  coalesce(p.created_at, now())
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1
  FROM public.acquisition_events e
  WHERE e.user_id = p.id AND e.event_type = 'account_created'
);

INSERT INTO public.acquisition_events (visitor_id, user_id, event_type, created_at)
SELECT
  p.id,
  p.id,
  'onboarding_started',
  coalesce(p.created_at, now())
FROM public.profiles p
WHERE p.onboarding_completed = true
  AND NOT EXISTS (
    SELECT 1
    FROM public.acquisition_events e
    WHERE e.user_id = p.id AND e.event_type = 'onboarding_started'
  );

INSERT INTO public.acquisition_events (visitor_id, user_id, event_type, created_at)
SELECT
  p.id,
  p.id,
  'onboarding_completed',
  coalesce(p.created_at, now())
FROM public.profiles p
WHERE p.onboarding_completed = true
  AND NOT EXISTS (
    SELECT 1
    FROM public.acquisition_events e
    WHERE e.user_id = p.id AND e.event_type = 'onboarding_completed'
  );

INSERT INTO public.acquisition_events (visitor_id, user_id, event_type, created_at)
SELECT DISTINCT ON (wm.user_id)
  wm.user_id,
  wm.user_id,
  'paid',
  coalesce(pay.paid_at, now())
FROM public.workspace_members wm
JOIN LATERAL (
  SELECT p.paid_at
  FROM public.payments p
  WHERE p.workspace_id = wm.workspace_id
    AND p.status = 'succeeded'
    AND p.amount_cents > 0
  ORDER BY p.paid_at ASC NULLS LAST
  LIMIT 1
) pay ON true
WHERE wm.role = 'owner'
  AND NOT EXISTS (
    SELECT 1
    FROM public.acquisition_events e
    WHERE e.user_id = wm.user_id AND e.event_type = 'paid'
  );
