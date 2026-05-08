
ALTER TABLE public.creches
  ADD COLUMN IF NOT EXISTS financial_provider public.financial_provider,
  ADD COLUMN IF NOT EXISTS financial_environment text;

COMMENT ON COLUMN public.creches.financial_provider IS 'Active financial provider for the school (asaas | inter). Only admin can change.';
COMMENT ON COLUMN public.creches.financial_environment IS 'Environment of the financial provider (sandbox | production).';
