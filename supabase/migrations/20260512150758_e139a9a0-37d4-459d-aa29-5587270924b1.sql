
-- ============ Régua de cobrança ============
CREATE TABLE public.financial_collection_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creche_id uuid NOT NULL REFERENCES public.creches(id) ON DELETE CASCADE,
  stage_offset_days int NOT NULL,
  channel text NOT NULL DEFAULT 'notificacao',
  titulo text NOT NULL,
  template text NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (creche_id, stage_offset_days, channel)
);
CREATE INDEX idx_fcr_creche ON public.financial_collection_rules(creche_id);

ALTER TABLE public.financial_collection_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fcr_admin_all" ON public.financial_collection_rules
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "fcr_diretor_secretaria" ON public.financial_collection_rules
  FOR ALL TO authenticated
  USING (public.is_financeiro_admin(auth.uid(), creche_id))
  WITH CHECK (public.is_financeiro_admin(auth.uid(), creche_id));

CREATE TRIGGER fcr_updated_at BEFORE UPDATE ON public.financial_collection_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ Logs de envio da régua ============
CREATE TABLE public.financial_collection_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creche_id uuid NOT NULL REFERENCES public.creches(id) ON DELETE CASCADE,
  invoice_id uuid,
  rule_id uuid REFERENCES public.financial_collection_rules(id) ON DELETE SET NULL,
  channel text NOT NULL,
  status text NOT NULL DEFAULT 'sent',
  recipient text,
  payload jsonb,
  error text,
  sent_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_fcl_creche ON public.financial_collection_logs(creche_id);
CREATE INDEX idx_fcl_invoice ON public.financial_collection_logs(invoice_id);

ALTER TABLE public.financial_collection_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fcl_admin_all" ON public.financial_collection_logs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "fcl_diretor_secretaria_select" ON public.financial_collection_logs
  FOR SELECT TO authenticated
  USING (public.is_financeiro_admin(auth.uid(), creche_id));

-- ============ Templates de mensagem financeira ============
CREATE TABLE public.financial_message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creche_id uuid NOT NULL REFERENCES public.creches(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  titulo text NOT NULL,
  body text NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_fmt_creche ON public.financial_message_templates(creche_id);

ALTER TABLE public.financial_message_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fmt_admin_all" ON public.financial_message_templates
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "fmt_diretor_secretaria" ON public.financial_message_templates
  FOR ALL TO authenticated
  USING (public.is_financeiro_admin(auth.uid(), creche_id))
  WITH CHECK (public.is_financeiro_admin(auth.uid(), creche_id));

CREATE TRIGGER fmt_updated_at BEFORE UPDATE ON public.financial_message_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
