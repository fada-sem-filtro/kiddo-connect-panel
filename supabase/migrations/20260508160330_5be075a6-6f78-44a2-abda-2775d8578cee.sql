
-- Provider enum
DO $$ BEGIN
  CREATE TYPE public.financial_provider AS ENUM ('asaas', 'inter');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 1. financial_accounts
CREATE TABLE IF NOT EXISTS public.financial_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creche_id UUID NOT NULL REFERENCES public.creches(id) ON DELETE CASCADE,
  provider public.financial_provider NOT NULL,
  client_id TEXT,
  encrypted_client_secret BYTEA,
  client_secret_iv BYTEA,
  client_secret_tag BYTEA,
  certificate_path TEXT,
  private_key_path TEXT,
  conta_corrente TEXT,
  webhook_secret UUID NOT NULL DEFAULT gen_random_uuid(),
  account_name TEXT,
  environment TEXT NOT NULL DEFAULT 'production',
  connected BOOLEAN NOT NULL DEFAULT false,
  last_validation TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(creche_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_financial_accounts_creche ON public.financial_accounts(creche_id);
CREATE INDEX IF NOT EXISTS idx_financial_accounts_webhook_token ON public.financial_accounts(webhook_secret);

ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Finance admins read accounts (no secrets)"
  ON public.financial_accounts FOR SELECT TO authenticated
  USING (public.is_financeiro_admin(auth.uid(), creche_id));

CREATE POLICY "Finance admins manage accounts"
  ON public.financial_accounts FOR ALL TO authenticated
  USING (public.is_financeiro_admin(auth.uid(), creche_id))
  WITH CHECK (public.is_financeiro_admin(auth.uid(), creche_id));

CREATE TRIGGER trg_financial_accounts_updated
  BEFORE UPDATE ON public.financial_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. financial_invoices
CREATE TABLE IF NOT EXISTS public.financial_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creche_id UUID NOT NULL REFERENCES public.creches(id) ON DELETE CASCADE,
  crianca_id UUID REFERENCES public.criancas(id) ON DELETE SET NULL,
  provider public.financial_provider NOT NULL,
  external_id TEXT,
  nosso_numero TEXT,
  amount NUMERIC(12,2) NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  payment_method TEXT,
  pix_qrcode TEXT,
  pix_copy_paste TEXT,
  pix_expires_at TIMESTAMPTZ,
  boleto_pdf_url TEXT,
  boleto_linha_digitavel TEXT,
  description TEXT,
  paid_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  raw_payload JSONB,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(provider, external_id)
);

CREATE INDEX IF NOT EXISTS idx_financial_invoices_creche ON public.financial_invoices(creche_id);
CREATE INDEX IF NOT EXISTS idx_financial_invoices_status ON public.financial_invoices(creche_id, status);
CREATE INDEX IF NOT EXISTS idx_financial_invoices_crianca ON public.financial_invoices(crianca_id);
CREATE INDEX IF NOT EXISTS idx_financial_invoices_due ON public.financial_invoices(due_date);

ALTER TABLE public.financial_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Finance admins read invoices"
  ON public.financial_invoices FOR SELECT TO authenticated
  USING (public.is_financeiro_admin(auth.uid(), creche_id));

CREATE POLICY "Finance admins write invoices"
  ON public.financial_invoices FOR ALL TO authenticated
  USING (public.is_financeiro_admin(auth.uid(), creche_id))
  WITH CHECK (public.is_financeiro_admin(auth.uid(), creche_id));

-- Responsáveis podem ver invoices dos próprios filhos
CREATE POLICY "Responsaveis veem invoices dos filhos"
  ON public.financial_invoices FOR SELECT TO authenticated
  USING (
    crianca_id IS NOT NULL
    AND public.is_responsavel_of_crianca(auth.uid(), crianca_id)
  );

CREATE TRIGGER trg_financial_invoices_updated
  BEFORE UPDATE ON public.financial_invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. financial_transactions
CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creche_id UUID NOT NULL REFERENCES public.creches(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES public.financial_invoices(id) ON DELETE SET NULL,
  transaction_type TEXT NOT NULL,
  amount NUMERIC(12,2),
  status TEXT,
  raw_payload JSONB,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_financial_transactions_creche ON public.financial_transactions(creche_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_invoice ON public.financial_transactions(invoice_id);

ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Finance admins read transactions"
  ON public.financial_transactions FOR SELECT TO authenticated
  USING (public.is_financeiro_admin(auth.uid(), creche_id));

-- 4. financial_webhook_logs
CREATE TABLE IF NOT EXISTS public.financial_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creche_id UUID REFERENCES public.creches(id) ON DELETE SET NULL,
  provider public.financial_provider NOT NULL,
  event TEXT,
  external_id TEXT,
  payload JSONB,
  processed BOOLEAN NOT NULL DEFAULT false,
  error TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_financial_webhook_idem
  ON public.financial_webhook_logs(provider, event, external_id)
  WHERE external_id IS NOT NULL AND event IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_financial_webhook_logs_creche
  ON public.financial_webhook_logs(creche_id, received_at DESC);

ALTER TABLE public.financial_webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Finance admins read webhook logs"
  ON public.financial_webhook_logs FOR SELECT TO authenticated
  USING (creche_id IS NOT NULL AND public.is_financeiro_admin(auth.uid(), creche_id));

CREATE POLICY "Admins read all webhook logs"
  ON public.financial_webhook_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 5. View safe (sem secrets)
CREATE OR REPLACE VIEW public.vw_financial_accounts_safe AS
SELECT
  id, creche_id, provider, client_id, conta_corrente, account_name,
  environment, connected, last_validation, last_error,
  webhook_secret,
  (encrypted_client_secret IS NOT NULL) AS has_secret,
  (certificate_path IS NOT NULL) AS has_certificate,
  (private_key_path IS NOT NULL) AS has_private_key,
  created_at, updated_at
FROM public.financial_accounts;

GRANT SELECT ON public.vw_financial_accounts_safe TO authenticated;

-- 6. Storage bucket privado para certificados
INSERT INTO storage.buckets (id, name, public)
VALUES ('inter-certificates', 'inter-certificates', false)
ON CONFLICT (id) DO NOTHING;

-- Apenas admins/diretores/secretarias podem listar certificados da própria escola
-- (Na prática, edge functions usam service role; estas policies são fallback de segurança)
CREATE POLICY "Finance admins read own certs"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'inter-certificates'
    AND public.is_financeiro_admin(
      auth.uid(),
      ((storage.foldername(name))[1])::uuid
    )
  );

CREATE POLICY "Finance admins upload own certs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'inter-certificates'
    AND public.is_financeiro_admin(
      auth.uid(),
      ((storage.foldername(name))[1])::uuid
    )
  );

CREATE POLICY "Finance admins delete own certs"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'inter-certificates'
    AND public.is_financeiro_admin(
      auth.uid(),
      ((storage.foldername(name))[1])::uuid
    )
  );
