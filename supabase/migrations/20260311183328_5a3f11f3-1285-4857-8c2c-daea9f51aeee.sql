
-- Eventos table linked to crianças
CREATE TABLE public.eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL,
  crianca_id uuid NOT NULL REFERENCES public.criancas(id) ON DELETE CASCADE,
  observacao text,
  data_inicio timestamptz NOT NULL DEFAULT now(),
  data_fim timestamptz,
  educador_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admins can manage all eventos"
ON public.eventos FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Directors can manage eventos of their creche
CREATE POLICY "Directors can manage eventos of their creche"
ON public.eventos FOR ALL TO authenticated
USING (
  is_diretor_of_creche(auth.uid(), get_creche_id_from_turma(
    (SELECT turma_id FROM public.criancas WHERE id = eventos.crianca_id)
  ))
)
WITH CHECK (
  is_diretor_of_creche(auth.uid(), get_creche_id_from_turma(
    (SELECT turma_id FROM public.criancas WHERE id = eventos.crianca_id)
  ))
);

-- Educadores can manage eventos for crianças in their turmas
CREATE POLICY "Educadores can manage eventos in their turmas"
ON public.eventos FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.criancas c
    JOIN public.turma_educadores te ON te.turma_id = c.turma_id
    WHERE c.id = eventos.crianca_id AND te.educador_user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.criancas c
    JOIN public.turma_educadores te ON te.turma_id = c.turma_id
    WHERE c.id = eventos.crianca_id AND te.educador_user_id = auth.uid()
  )
);

-- Responsáveis can only VIEW eventos of their crianças
CREATE POLICY "Responsáveis can view eventos of their crianças"
ON public.eventos FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.crianca_responsaveis cr
    WHERE cr.crianca_id = eventos.crianca_id AND cr.responsavel_user_id = auth.uid()
  )
);
