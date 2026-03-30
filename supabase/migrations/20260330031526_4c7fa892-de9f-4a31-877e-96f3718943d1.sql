
CREATE TABLE public.suporte_mensagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nome text NOT NULL,
  email text NOT NULL,
  assunto text NOT NULL,
  mensagem text NOT NULL,
  status text NOT NULL DEFAULT 'pendente',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.suporte_mensagens ENABLE ROW LEVEL SECURITY;

-- All authenticated users can insert
CREATE POLICY "Authenticated users can insert suporte"
ON public.suporte_mensagens FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can view their own messages
CREATE POLICY "Users can view own suporte"
ON public.suporte_mensagens FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Admins can manage all
CREATE POLICY "Admins can manage all suporte"
ON public.suporte_mensagens FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));
