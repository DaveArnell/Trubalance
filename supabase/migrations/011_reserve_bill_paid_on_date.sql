-- 011: Record when a reserve bill was marked paid (preserves balance-log history)

ALTER TABLE public.reserve_bills
  ADD COLUMN IF NOT EXISTS last_paid_on_date date;
