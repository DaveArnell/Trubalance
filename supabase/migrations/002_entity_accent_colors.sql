ALTER TABLE public.groups
  ADD COLUMN IF NOT EXISTS accent_color text;

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS accent_color text;
