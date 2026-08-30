-- Purge marketing enquiries and support messages older than 12 months,
-- matching the Privacy Policy retention period.
-- Ongoing items are kept: marketing status = in_progress; support status = open or pending.

CREATE OR REPLACE FUNCTION public.purge_expired_support_and_enquiries()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cutoff timestamptz := timezone('utc', now()) - interval '12 months';
  inquiries_deleted integer := 0;
  support_deleted integer := 0;
BEGIN
  WITH removed AS (
    DELETE FROM public.marketing_inquiries
    WHERE created_at < cutoff
      AND status IS DISTINCT FROM 'in_progress'
    RETURNING 1
  )
  SELECT count(*)::integer INTO inquiries_deleted FROM removed;

  WITH removed AS (
    DELETE FROM public.support_messages
    WHERE created_at < cutoff
      AND status NOT IN ('open', 'pending')
    RETURNING 1
  )
  SELECT count(*)::integer INTO support_deleted FROM removed;

  RETURN jsonb_build_object(
    'cutoff', cutoff,
    'marketing_inquiries_deleted', inquiries_deleted,
    'support_messages_deleted', support_deleted
  );
END;
$$;

REVOKE ALL ON FUNCTION public.purge_expired_support_and_enquiries() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purge_expired_support_and_enquiries() TO service_role;

COMMENT ON FUNCTION public.purge_expired_support_and_enquiries() IS
  'Deletes closed/idle support and enquiry rows older than 12 months. Call via cron edge function.';
