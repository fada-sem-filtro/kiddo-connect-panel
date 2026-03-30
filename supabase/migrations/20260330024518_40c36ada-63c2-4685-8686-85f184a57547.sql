
-- Secretaria can view user_roles of same creche members
CREATE POLICY "Secretaria can view roles of creche members"
ON public.user_roles FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'secretaria') AND
  is_in_same_creche(auth.uid(), user_id) AND
  role <> 'admin'
);

-- Secretaria can also view profiles of alunos in their school (alunos not in creche_membros)
CREATE POLICY "Secretaria can view aluno profiles of their creche"
ON public.profiles FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'secretaria') AND
  EXISTS (
    SELECT 1 FROM criancas c
    JOIN turmas t ON t.id = c.turma_id
    JOIN creche_membros cm ON cm.creche_id = t.creche_id
    WHERE c.user_id = profiles.user_id AND cm.user_id = auth.uid()
  )
);

-- Secretaria can update profiles of same creche (for toggling ativo, editing)
CREATE POLICY "Secretaria can update profiles of same creche"
ON public.profiles FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'secretaria') AND
  (is_in_same_creche(auth.uid(), user_id) OR
   EXISTS (
     SELECT 1 FROM criancas c
     JOIN turmas t ON t.id = c.turma_id
     JOIN creche_membros cm ON cm.creche_id = t.creche_id
     WHERE c.user_id = profiles.user_id AND cm.user_id = auth.uid()
   ))
);

-- Secretaria can view aluno roles too
CREATE POLICY "Secretaria can view aluno roles"
ON public.user_roles FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'secretaria') AND
  EXISTS (
    SELECT 1 FROM criancas c
    JOIN turmas t ON t.id = c.turma_id
    JOIN creche_membros cm ON cm.creche_id = t.creche_id
    WHERE c.user_id = user_roles.user_id AND cm.user_id = auth.uid()
  )
);
