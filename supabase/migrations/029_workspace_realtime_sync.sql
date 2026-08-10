-- Enable Realtime so signed-in devices can pull as soon as another device saves.
-- Safe to re-run: skips tables already in the publication.

DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'expected_receipts',
    'commitments',
    'accounts',
    'reserve_planners',
    'reserve_bills',
    'businesses',
    'venues',
    'groups'
  ]
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = tbl
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
    END IF;
  END LOOP;
END $$;
