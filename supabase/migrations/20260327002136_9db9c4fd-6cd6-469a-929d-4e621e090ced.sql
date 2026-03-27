
-- Table for quote requests from landing page
CREATE TABLE public.orcamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  escola TEXT NOT NULL,
  cidade TEXT NOT NULL,
  telefone TEXT,
  email TEXT NOT NULL,
  num_alunos TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for admin responses to quotes
CREATE TABLE public.orcamento_respostas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  orcamento_id UUID NOT NULL REFERENCES public.orcamentos(id) ON DELETE CASCADE,
  admin_user_id UUID NOT NULL,
  conteudo TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS on orcamentos
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;

-- Allow anonymous insert (from landing page, user is not authenticated)
CREATE POLICY "Anyone can insert orcamentos" ON public.orcamentos
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Only admins can view/update/delete
CREATE POLICY "Admins can manage orcamentos" ON public.orcamentos
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS on orcamento_respostas
ALTER TABLE public.orcamento_respostas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage orcamento_respostas" ON public.orcamento_respostas
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_orcamentos_updated_at
  BEFORE UPDATE ON public.orcamentos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
