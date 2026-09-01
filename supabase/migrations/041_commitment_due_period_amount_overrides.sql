-- Due-only amount overrides for monthly commitments (edits in Due, separate from recurring budget).

ALTER TABLE public.commitments
  ADD COLUMN IF NOT EXISTS due_period_amount_overrides jsonb DEFAULT '{}';
