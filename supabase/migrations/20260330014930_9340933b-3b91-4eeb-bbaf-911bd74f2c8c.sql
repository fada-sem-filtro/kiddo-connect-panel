
CREATE POLICY "Alunos can view own crianca record"
ON public.criancas
FOR SELECT
TO authenticated
USING (user_id = auth.uid());
