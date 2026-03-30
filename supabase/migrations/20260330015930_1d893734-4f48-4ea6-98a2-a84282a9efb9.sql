CREATE POLICY "Alunos can view their turma"
ON public.turmas
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.criancas c
    WHERE c.turma_id = turmas.id AND c.user_id = auth.uid()
  )
);