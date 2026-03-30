
-- Allow secretaria to view all creche_membros of their school
CREATE POLICY "Secretaria can view membros of their creche"
ON public.creche_membros FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'secretaria') AND
  EXISTS (
    SELECT 1 FROM creche_membros my_cm
    WHERE my_cm.user_id = auth.uid() AND my_cm.creche_id = creche_membros.creche_id
  )
);
