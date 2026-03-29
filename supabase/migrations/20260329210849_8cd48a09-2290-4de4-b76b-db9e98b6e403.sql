
CREATE POLICY "Educadores can view crianca_responsaveis in their turmas"
ON public.crianca_responsaveis
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM criancas c
    JOIN turma_educadores te ON te.turma_id = c.turma_id
    WHERE c.id = crianca_responsaveis.crianca_id
      AND te.educador_user_id = auth.uid()
  )
);
