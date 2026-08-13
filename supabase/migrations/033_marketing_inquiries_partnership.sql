-- Allow partnership enquiries on marketing_inquiries.topic
-- Run in Supabase SQL Editor after deploy if inserts for partnership fail.

ALTER TABLE public.marketing_inquiries
  DROP CONSTRAINT IF EXISTS marketing_inquiries_topic_check;

ALTER TABLE public.marketing_inquiries
  ADD CONSTRAINT marketing_inquiries_topic_check
  CHECK (topic IN ('general', 'onboarding', 'partnership'));
