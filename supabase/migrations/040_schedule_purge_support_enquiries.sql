-- Monthly purge of closed support/enquiry rows older than 12 months.
-- Run this in the Cash Prophet Supabase SQL Editor (project qwwwijyljghmlerylbpi).
-- Requires migration 039 (purge_expired_support_and_enquiries) to already exist.
--
-- Prerequisite: Dashboard → Integrations → Cron → enable pg_cron (if not already on).
-- GitHub Actions workflow was removed; this pg_cron job replaces it.

SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'purge-expired-support-enquiries';

SELECT cron.schedule(
  'purge-expired-support-enquiries',
  '15 3 1 * *',
  $$SELECT public.purge_expired_support_and_enquiries()$$
);

-- Verify schedule (should return one row):
SELECT jobid, jobname, schedule, command
FROM cron.job
WHERE jobname = 'purge-expired-support-enquiries';

-- Optional one-off test (safe — only deletes rows older than 12 months):
-- SELECT public.purge_expired_support_and_enquiries();
