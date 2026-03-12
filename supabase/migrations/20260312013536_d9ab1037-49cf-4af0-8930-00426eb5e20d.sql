-- Drop and recreate directors profile viewing policy to include responsáveis
DROP POLICY IF EXISTS "Directors can view profiles of creche members" ON public.profiles;

CREATE POLICY "Directors can view profiles of creche members"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'diretor') AND (
      user_id = auth.uid()
      OR is_in_same_creche(auth.uid(), user_id)
      OR EXISTS (
        SELECT 1 FROM crianca_responsaveis cr
        JOIN criancas c ON c.id = cr.crianca_id
        JOIN turmas t ON t.id = c.turma_id
        JOIN creche_membros cm ON cm.creche_id = t.creche_id
        WHERE cm.user_id = auth.uid() AND cr.responsavel_user_id = profiles.user_id
      )
    )
  );
