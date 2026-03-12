
-- Allow directors to view all recados from their creche (turma-based or crianca-based)
CREATE POLICY "Directors can view recados of their creche"
  ON public.recados FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'diretor') AND (
      -- Recados linked to a turma in their creche
      (turma_id IS NOT NULL AND is_member_of_turma_creche(auth.uid(), turma_id))
      OR
      -- Recados linked to a crianca in their creche
      (crianca_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM criancas c
        WHERE c.id = recados.crianca_id
        AND is_member_of_turma_creche(auth.uid(), c.turma_id)
      ))
      OR
      -- Recados sent by members of same creche (general recados)
      (turma_id IS NULL AND crianca_id IS NULL AND is_in_same_creche(auth.uid(), remetente_user_id))
    )
  );

-- Allow directors to create recados
CREATE POLICY "Directors can insert recados"
  ON public.recados FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'diretor') AND remetente_user_id = auth.uid()
  );

-- Allow directors to update recados in their creche
CREATE POLICY "Directors can update recados of their creche"
  ON public.recados FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'diretor') AND (
      remetente_user_id = auth.uid()
      OR (turma_id IS NOT NULL AND is_member_of_turma_creche(auth.uid(), turma_id))
      OR (crianca_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM criancas c WHERE c.id = recados.crianca_id AND is_member_of_turma_creche(auth.uid(), c.turma_id)
      ))
    )
  );
