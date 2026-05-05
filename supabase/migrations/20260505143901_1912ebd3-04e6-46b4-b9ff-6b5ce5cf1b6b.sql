CREATE POLICY "Alunos can view own presencas"
ON public.presencas
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.criancas c
    WHERE c.id = presencas.crianca_id AND c.user_id = auth.uid()
  )
);