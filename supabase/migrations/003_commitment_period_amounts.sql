-- Per-period expected overrides and actual paid amounts for commitments

ALTER TABLE public.commitments
  ADD COLUMN IF NOT EXISTS period_amount_overrides jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS paid_period_amounts jsonb DEFAULT '{}';
