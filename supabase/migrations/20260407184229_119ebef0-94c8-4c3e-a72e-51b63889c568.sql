
-- Create boletos table
CREATE TABLE public.boletos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creche_id UUID NOT NULL REFERENCES public.creches(id) ON DELETE CASCADE,
  turma_id UUID NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
  crianca_id UUID NOT NULL REFERENCES public.criancas(id) ON DELETE CASCADE,
  valor NUMERIC(10,2) NOT NULL,
  vencimento DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  descricao TEXT,
  referencia TEXT,
  desconto_antecipacao NUMERIC(5,2) DEFAULT 0,
  data_limite_desconto DATE,
  multa_atraso NUMERIC(5,2) DEFAULT 0,
  juros_dia NUMERIC(5,4) DEFAULT 0,
  parcela_atual INTEGER DEFAULT 1,
  total_parcelas INTEGER DEFAULT 1,
  linha_digitavel TEXT,
  codigo_barras TEXT,
  nosso_numero TEXT,
  observacoes TEXT,
  data_pagamento DATE,
  registrado_por_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.boletos ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage all boletos"
ON public.boletos FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Directors can manage boletos of their creche"
ON public.boletos FOR ALL TO authenticated
USING (is_diretor_of_creche(auth.uid(), creche_id))
WITH CHECK (is_diretor_of_creche(auth.uid(), creche_id));

CREATE POLICY "Secretaria can manage boletos of their creche"
ON public.boletos FOR ALL TO authenticated
USING (has_role(auth.uid(), 'secretaria'::app_role) AND creche_id = get_user_creche_id(auth.uid()))
WITH CHECK (has_role(auth.uid(), 'secretaria'::app_role) AND creche_id = get_user_creche_id(auth.uid()));

CREATE POLICY "Responsaveis can view boletos of their criancas"
ON public.boletos FOR SELECT TO authenticated
USING (crianca_id IN (SELECT get_crianca_ids_for_responsavel(auth.uid())));

-- Updated_at trigger
CREATE TRIGGER update_boletos_updated_at
BEFORE UPDATE ON public.boletos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add modulo_boletos_ativo to configuracoes_pedagogicas
ALTER TABLE public.configuracoes_pedagogicas
ADD COLUMN modulo_boletos_ativo BOOLEAN NOT NULL DEFAULT false;
