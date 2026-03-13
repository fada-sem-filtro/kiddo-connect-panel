
-- Allow directors to manage eventos_futuros for turmas in their creche
CREATE POLICY "Directors can manage eventos_futuros"
ON public.eventos_futuros
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'diretor'::app_role)
  AND (
    turma_id IS NULL
    OR is_diretor_of_creche(auth.uid(), get_creche_id_from_turma(turma_id))
  )
)
WITH CHECK (
  has_role(auth.uid(), 'diretor'::app_role)
  AND (
    turma_id IS NULL
    OR is_diretor_of_creche(auth.uid(), get_creche_id_from_turma(turma_id))
  )
);

-- Allow directors to manage feriados
CREATE POLICY "Directors can manage feriados"
ON public.feriados
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'diretor'::app_role))
WITH CHECK (has_role(auth.uid(), 'diretor'::app_role));
