
ALTER TABLE public.financial_accounts
  ADD COLUMN IF NOT EXISTS webhook_certificate_path text;

DROP VIEW IF EXISTS public.vw_financial_accounts_safe;

CREATE VIEW public.vw_financial_accounts_safe
WITH (security_invoker=on) AS
SELECT id,
    creche_id,
    provider,
    client_id,
    conta_corrente,
    account_name,
    environment,
    connected,
    last_validation,
    last_error,
    webhook_secret,
    webhook_registered_at,
    last_auth_at,
    last_auth_error,
    encrypted_client_secret IS NOT NULL AS has_secret,
    certificate_path IS NOT NULL AS has_certificate,
    private_key_path IS NOT NULL AS has_private_key,
    webhook_certificate_path IS NOT NULL AS has_webhook_certificate,
    created_at,
    updated_at
FROM public.financial_accounts;
