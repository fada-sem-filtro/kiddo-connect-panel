
-- ============================================================
-- 1. DROP MÓDULO ANTIGO DE BOLETOS
-- ============================================================
DROP TABLE IF EXISTS public.boletos CASCADE;

-- ============================================================
-- 2. HELPER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_financeiro_admin(_user_id uuid, _creche_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.has_role(_user_id, 'admin'::app_role)
    OR EXISTS (
      SELECT 1
      FROM public.creche_membros cm
      JOIN public.user_roles ur ON ur.user_id = cm.user_id
      WHERE cm.user_id = _user_id
        AND cm.creche_id = _creche_id
        AND ur.role IN ('diretor'::app_role, 'secretaria'::app_role)
    );
$$;

-- ============================================================
-- 3. FINANCIAL SETTINGS
-- ============================================================
CREATE TABLE public.financial_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creche_id uuid NOT NULL UNIQUE REFERENCES public.creches(id) ON DELETE CASCADE,
  asaas_api_key_encrypted text,
  asaas_api_key_iv text,
  asaas_api_key_tag text,
  asaas_api_key_last4 text,
  asaas_environment text NOT NULL DEFAULT 'production' CHECK (asaas_environment IN ('production','sandbox')),
  asaas_connected boolean NOT NULL DEFAULT false,
  asaas_account_name text,
  asaas_account_email text,
  asaas_last_validation timestamptz,
  asaas_webhook_token uuid NOT NULL DEFAULT gen_random_uuid(),
  asaas_webhook_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.financial_settings ENABLE ROW LEVEL SECURITY;

-- Safe view: never expose encrypted key columns to clients
CREATE OR REPLACE VIEW public.financial_settings_safe AS
SELECT id, creche_id, asaas_api_key_last4, asaas_environment, asaas_connected,
       asaas_account_name, asaas_account_email, asaas_last_validation,
       created_at, updated_at
FROM public.financial_settings;

-- No SELECT policy on the table for clients (only via view + edge functions w/ service role)
CREATE POLICY "fs admin select"
  ON public.financial_settings FOR SELECT TO authenticated
  USING (public.is_financeiro_admin(auth.uid(), creche_id));

-- ============================================================
-- 4. FINANCIAL CUSTOMERS
-- ============================================================
CREATE TABLE public.financial_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creche_id uuid NOT NULL REFERENCES public.creches(id) ON DELETE CASCADE,
  crianca_id uuid REFERENCES public.criancas(id) ON DELETE SET NULL,
  responsavel_user_id uuid,
  asaas_customer_id text NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  cpf_cnpj text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (creche_id, asaas_customer_id)
);
ALTER TABLE public.financial_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fc admin all"
  ON public.financial_customers FOR ALL TO authenticated
  USING (public.is_financeiro_admin(auth.uid(), creche_id))
  WITH CHECK (public.is_financeiro_admin(auth.uid(), creche_id));

CREATE INDEX idx_fc_creche ON public.financial_customers(creche_id);
CREATE INDEX idx_fc_crianca ON public.financial_customers(crianca_id);

-- ============================================================
-- 5. SUBSCRIPTIONS (recorrência)
-- ============================================================
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creche_id uuid NOT NULL REFERENCES public.creches(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.financial_customers(id) ON DELETE CASCADE,
  crianca_id uuid REFERENCES public.criancas(id) ON DELETE SET NULL,
  asaas_subscription_id text NOT NULL,
  value numeric(12,2) NOT NULL,
  cycle text NOT NULL CHECK (cycle IN ('MONTHLY','QUARTERLY','YEARLY','WEEKLY','BIWEEKLY','SEMIANNUALLY')),
  next_due_date date,
  description text,
  billing_type text NOT NULL DEFAULT 'UNDEFINED',
  status text NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (creche_id, asaas_subscription_id)
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sub admin all"
  ON public.subscriptions FOR ALL TO authenticated
  USING (public.is_financeiro_admin(auth.uid(), creche_id))
  WITH CHECK (public.is_financeiro_admin(auth.uid(), creche_id));

CREATE INDEX idx_sub_creche ON public.subscriptions(creche_id);
CREATE INDEX idx_sub_customer ON public.subscriptions(customer_id);

-- ============================================================
-- 6. INVOICES
-- ============================================================
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creche_id uuid NOT NULL REFERENCES public.creches(id) ON DELETE CASCADE,
  crianca_id uuid REFERENCES public.criancas(id) ON DELETE SET NULL,
  customer_id uuid NOT NULL REFERENCES public.financial_customers(id) ON DELETE RESTRICT,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  asaas_payment_id text NOT NULL,
  description text,
  value numeric(12,2) NOT NULL,
  net_value numeric(12,2),
  due_date date NOT NULL,
  payment_method text NOT NULL DEFAULT 'UNDEFINED' CHECK (payment_method IN ('PIX','BOLETO','CREDIT_CARD','UNDEFINED','DEBIT_CARD','TRANSFER','DEPOSIT')),
  status text NOT NULL DEFAULT 'PENDING',
  invoice_url text,
  bank_slip_url text,
  pix_qrcode text,
  pix_copy_paste text,
  pix_expires_at timestamptz,
  external_reference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (creche_id, asaas_payment_id)
);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inv admin all"
  ON public.invoices FOR ALL TO authenticated
  USING (public.is_financeiro_admin(auth.uid(), creche_id))
  WITH CHECK (public.is_financeiro_admin(auth.uid(), creche_id));

CREATE INDEX idx_inv_creche ON public.invoices(creche_id);
CREATE INDEX idx_inv_status ON public.invoices(creche_id, status);
CREATE INDEX idx_inv_due ON public.invoices(creche_id, due_date);
CREATE INDEX idx_inv_customer ON public.invoices(customer_id);
CREATE INDEX idx_inv_crianca ON public.invoices(crianca_id);

-- ============================================================
-- 7. PAYMENTS
-- ============================================================
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creche_id uuid NOT NULL REFERENCES public.creches(id) ON DELETE CASCADE,
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  paid_at timestamptz NOT NULL DEFAULT now(),
  value numeric(12,2) NOT NULL,
  net_value numeric(12,2),
  payment_method text,
  status text NOT NULL DEFAULT 'CONFIRMED',
  transaction_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pay admin all"
  ON public.payments FOR ALL TO authenticated
  USING (public.is_financeiro_admin(auth.uid(), creche_id))
  WITH CHECK (public.is_financeiro_admin(auth.uid(), creche_id));

CREATE INDEX idx_pay_creche ON public.payments(creche_id);
CREATE INDEX idx_pay_invoice ON public.payments(invoice_id);

-- ============================================================
-- 8. WEBHOOK LOGS
-- ============================================================
CREATE TABLE public.asaas_webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creche_id uuid REFERENCES public.creches(id) ON DELETE CASCADE,
  event text NOT NULL,
  asaas_payment_id text,
  payload jsonb NOT NULL,
  processed boolean NOT NULL DEFAULT false,
  error text,
  received_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.asaas_webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wl admin select"
  ON public.asaas_webhook_logs FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR (creche_id IS NOT NULL AND public.is_financeiro_admin(auth.uid(), creche_id))
  );

CREATE UNIQUE INDEX idx_webhook_idem ON public.asaas_webhook_logs(event, asaas_payment_id) WHERE asaas_payment_id IS NOT NULL;
CREATE INDEX idx_wl_creche ON public.asaas_webhook_logs(creche_id);
CREATE INDEX idx_wl_received ON public.asaas_webhook_logs(received_at DESC);

-- ============================================================
-- 9. UPDATED_AT TRIGGERS
-- ============================================================
CREATE TRIGGER trg_fs_updated BEFORE UPDATE ON public.financial_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_fc_updated BEFORE UPDATE ON public.financial_customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_inv_updated BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_sub_updated BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
