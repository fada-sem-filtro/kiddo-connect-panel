
-- Allow users to see support recados addressed to them (remetente_user_id = their id, remetente_nome contains Suporte)
CREATE POLICY "Users can view support recados addressed to them"
  ON public.recados FOR SELECT TO authenticated
  USING (
    remetente_user_id = auth.uid()
    AND turma_id IS NULL
    AND crianca_id IS NULL
    AND remetente_nome LIKE '%Suporte%'
  );
