-- One-off due amounts for reserve bills (when Due differs from planner schedule)

ALTER TABLE public.reserve_bills
  ADD COLUMN IF NOT EXISTS due_period_amount_overrides jsonb DEFAULT '{}';
