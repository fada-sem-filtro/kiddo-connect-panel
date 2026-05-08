
-- =========================================
-- SAAS FINANCIAL MODULE (Agenda Fleur → Escolas)
-- =========================================

-- 1) Account singleton
CREATE TABLE public.saas_financial_account (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'inter',
  client_id text,
  encrypted_client_secret bytea,
  client_secret_iv bytea,
  client_secret_tag bytea,
  certificate_path text,
  private_key_path text,
  conta_corrente text,
  environment text NOT NULL DEFAULT 'production',
  webhook_secret uuid NOT NULL DEFAULT gen_random_uuid(),
  connected boolean NOT NULL DEFAULT false,
  last_validation timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.saas_financial_account ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saas account admin only"
  ON public.saas_financial_account FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_saas_account_updated
  BEFORE UPDATE ON public.saas_financial_account
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Plans
CREATE TABLE public.saas_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  monthly_price numeric(10,2) NOT NULL DEFAULT 0,
  features jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.saas_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saas plans admin manage"
  ON public.saas_plans FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "saas plans members read"
  ON public.saas_plans FOR SELECT TO authenticated
  USING (active = true);

CREATE TRIGGER trg_saas_plans_updated
  BEFORE UPDATE ON public.saas_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Subscriptions
CREATE TABLE public.saas_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creche_id uuid NOT NULL UNIQUE,
  plan_id uuid NOT NULL REFERENCES public.saas_plans(id),
  status text NOT NULL DEFAULT 'trialing',
  monthly_amount numeric(10,2) NOT NULL DEFAULT 0,
  due_day integer NOT NULL DEFAULT 10 CHECK (due_day BETWEEN 1 AND 28),
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  trial_ends_at date,
  next_billing_date date,
  cancelled_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_saas_subs_creche ON public.saas_subscriptions(creche_id);
CREATE INDEX idx_saas_subs_status ON public.saas_subscriptions(status);

ALTER TABLE public.saas_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saas subs admin only"
  ON public.saas_subscriptions FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Diretor pode ver a própria assinatura (somente leitura)
CREATE POLICY "saas subs diretor read own"
  ON public.saas_subscriptions FOR SELECT TO authenticated
  USING (is_diretor_of_creche(auth.uid(), creche_id));

CREATE TRIGGER trg_saas_subs_updated
  BEFORE UPDATE ON public.saas_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) Invoices
CREATE TABLE public.saas_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid REFERENCES public.saas_subscriptions(id) ON DELETE SET NULL,
  creche_id uuid NOT NULL,
  external_id text,
  invoice_number text,
  amount numeric(10,2) NOT NULL,
  due_date date NOT NULL,
  status text NOT NULL DEFAULT 'PENDING',
  pix_qrcode text,
  pix_copy_paste text,
  boleto_pdf_url text,
  linha_digitavel text,
  description text,
  paid_at timestamptz,
  cancelled_at timestamptz,
  raw_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_saas_invoices_creche ON public.saas_invoices(creche_id);
CREATE INDEX idx_saas_invoices_status ON public.saas_invoices(status);
CREATE INDEX idx_saas_invoices_external ON public.saas_invoices(external_id);
CREATE INDEX idx_saas_invoices_due ON public.saas_invoices(due_date);

ALTER TABLE public.saas_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saas invoices admin only"
  ON public.saas_invoices FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "saas invoices diretor read own"
  ON public.saas_invoices FOR SELECT TO authenticated
  USING (is_diretor_of_creche(auth.uid(), creche_id));

CREATE TRIGGER trg_saas_invoices_updated
  BEFORE UPDATE ON public.saas_invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5) Transactions
CREATE TABLE public.saas_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES public.saas_invoices(id) ON DELETE CASCADE,
  transaction_type text NOT NULL DEFAULT 'PAYMENT',
  amount numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'CONFIRMED',
  paid_at timestamptz NOT NULL DEFAULT now(),
  raw_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_saas_tx_invoice ON public.saas_transactions(invoice_id);

ALTER TABLE public.saas_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saas tx admin only"
  ON public.saas_transactions FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 6) Webhook logs
CREATE TABLE public.saas_webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event text NOT NULL,
  external_id text,
  payload jsonb NOT NULL,
  processed boolean NOT NULL DEFAULT false,
  error text,
  received_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_saas_wl_received ON public.saas_webhook_logs(received_at DESC);

ALTER TABLE public.saas_webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saas wl admin select"
  ON public.saas_webhook_logs FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 7) Storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('saas-inter-certificates', 'saas-inter-certificates', false)
ON CONFLICT (id) DO NOTHING;

-- Only service role can manipulate (no policies = locked, service role bypasses)
-- Add explicit deny for safety: no policies for authenticated users.

-- 8) Seed plans
INSERT INTO public.saas_plans (code, name, monthly_price, features, ordem) VALUES
  ('trial',      'Trial 14 dias',  0.00,   '{"alunos":50,"recursos":["agenda","mensagens"]}'::jsonb, 1),
  ('basico',     'Básico',         99.00,  '{"alunos":80,"recursos":["agenda","mensagens","eventos"]}'::jsonb, 2),
  ('premium',    'Premium',        199.00, '{"alunos":200,"recursos":["agenda","mensagens","eventos","financeiro","relatorios"]}'::jsonb, 3),
  ('enterprise', 'Enterprise',     399.00, '{"alunos":-1,"recursos":["tudo"]}'::jsonb, 4)
ON CONFLICT (code) DO NOTHING;

-- 9) Singleton row
INSERT INTO public.saas_financial_account (provider, environment, connected)
VALUES ('inter', 'production', false)
ON CONFLICT DO NOTHING;
