-- Monthly purge of closed support/enquiry rows older than 12 months.
-- Run this in the Cash Prophet Supabase SQL Editor (not GitHub Actions).
-- Requires migration 039 (purge_expired_support_and_enquiries) to already exist.

SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'purge-expired-support-enquiries';

SELECT cron.schedule(
  'purge-expired-support-enquiries',
  '15 3 1 * *',
  $$SELECT public.purge_expired_support_and_enquiries()$$
);
