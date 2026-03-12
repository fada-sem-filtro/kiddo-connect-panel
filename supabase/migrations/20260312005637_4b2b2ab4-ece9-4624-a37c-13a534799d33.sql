
-- Create presencas table for daily attendance tracking
CREATE TABLE public.presencas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crianca_id UUID NOT NULL REFERENCES public.criancas(id) ON DELETE CASCADE,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'ausente' CHECK (status IN ('ausente', 'presente', 'saiu')),
  hora_chegada TIMESTAMP WITH TIME ZONE,
  hora_saida TIMESTAMP WITH TIME ZONE,
  educador_user_id UUID,
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(crianca_id, data)
);

-- Enable RLS
ALTER TABLE public.presencas ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage all presencas"
  ON public.presencas FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Directors can manage presencas of their creche"
  ON public.presencas FOR ALL TO authenticated
  USING (is_diretor_of_creche(auth.uid(), get_creche_id_from_turma((SELECT turma_id FROM criancas WHERE id = presencas.crianca_id))))
  WITH CHECK (is_diretor_of_creche(auth.uid(), get_creche_id_from_turma((SELECT turma_id FROM criancas WHERE id = presencas.crianca_id))));

CREATE POLICY "Educadores can manage presencas in their turmas"
  ON public.presencas FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM criancas c
    JOIN turma_educadores te ON te.turma_id = c.turma_id
    WHERE c.id = presencas.crianca_id AND te.educador_user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM criancas c
    JOIN turma_educadores te ON te.turma_id = c.turma_id
    WHERE c.id = presencas.crianca_id AND te.educador_user_id = auth.uid()
  ));

CREATE POLICY "Responsáveis can view presencas of their crianças"
  ON public.presencas FOR SELECT TO authenticated
  USING (crianca_id IN (SELECT get_crianca_ids_for_responsavel(auth.uid())));

-- Enable realtime for presencas
ALTER PUBLICATION supabase_realtime ADD TABLE public.presencas;

-- Add updated_at trigger
CREATE TRIGGER update_presencas_updated_at
  BEFORE UPDATE ON public.presencas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
