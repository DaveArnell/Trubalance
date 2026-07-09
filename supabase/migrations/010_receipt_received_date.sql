-- 010: Record when an expected receipt was marked received (preserves balance-log history)

ALTER TABLE public.expected_receipts
  ADD COLUMN IF NOT EXISTS received_date date;
