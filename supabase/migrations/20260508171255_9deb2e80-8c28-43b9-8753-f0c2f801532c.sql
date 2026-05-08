
ALTER TABLE public.financial_accounts
  ADD COLUMN IF NOT EXISTS webhook_registered_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_auth_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_auth_error text;

ALTER TABLE public.financial_invoices
  ADD COLUMN IF NOT EXISTS pix_txid text,
  ADD COLUMN IF NOT EXISTS pix_qrcode_image text,
  ADD COLUMN IF NOT EXISTS boleto_pdf_path text;

CREATE INDEX IF NOT EXISTS idx_financial_invoices_pix_txid ON public.financial_invoices(pix_txid);

CREATE TABLE IF NOT EXISTS public.inter_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creche_id uuid NOT NULL REFERENCES public.creches(id) ON DELETE CASCADE,
  action text NOT NULL,
  status text NOT NULL,
  request_id text,
  http_status int,
  error text,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inter_audit_logs_creche ON public.inter_audit_logs(creche_id, created_at DESC);

ALTER TABLE public.inter_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Finance admins read audit logs"
  ON public.inter_audit_logs
  FOR SELECT TO authenticated
  USING (public.is_financeiro_admin(auth.uid(), creche_id));
