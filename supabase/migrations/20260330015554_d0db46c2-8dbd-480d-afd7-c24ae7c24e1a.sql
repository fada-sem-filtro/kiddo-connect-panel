
-- Allow alunos to view grade_aulas of their turma
CREATE POLICY "Alunos can view grade_aulas of their turma"
ON public.grade_aulas
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.criancas c
    WHERE c.turma_id = grade_aulas.turma_id
      AND c.user_id = auth.uid()
  )
);

-- Allow alunos to view materias of their school
CREATE POLICY "Alunos can view materias of their school"
ON public.materias
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.criancas c
    JOIN public.turmas t ON t.id = c.turma_id
    WHERE t.creche_id = materias.creche_id
      AND c.user_id = auth.uid()
  )
);
