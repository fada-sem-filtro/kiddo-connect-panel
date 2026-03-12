
-- Drop the narrow educador policy and replace with a broader one covering all creche members
DROP POLICY IF EXISTS "Educadores can view profiles of turma members" ON public.profiles;

-- Educadores can view profiles of all members of creches they belong to
CREATE POLICY "Educadores can view profiles of creche members"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'educador') AND (
      user_id = auth.uid()
      OR is_in_same_creche(auth.uid(), user_id)
    )
  );

-- Also update responsáveis policy to cover directors and other responsáveis in same creche
DROP POLICY IF EXISTS "Responsáveis can view profiles of their children educadores" ON public.profiles;

CREATE POLICY "Responsáveis can view profiles of creche members"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'responsavel') AND (
      user_id = auth.uid()
      OR
      -- Educadores and directors of their children's creches
      EXISTS (
        SELECT 1 FROM crianca_responsaveis cr
        JOIN criancas c ON c.id = cr.crianca_id
        JOIN creche_membros cm ON cm.creche_id = c.turma_id
        WHERE cr.responsavel_user_id = auth.uid() AND cm.user_id = profiles.user_id
      )
      OR
      EXISTS (
        SELECT 1 FROM crianca_responsaveis cr
        JOIN criancas c ON c.id = cr.crianca_id
        JOIN turma_educadores te ON te.turma_id = c.turma_id
        WHERE cr.responsavel_user_id = auth.uid() AND te.educador_user_id = profiles.user_id
      )
    )
  );
