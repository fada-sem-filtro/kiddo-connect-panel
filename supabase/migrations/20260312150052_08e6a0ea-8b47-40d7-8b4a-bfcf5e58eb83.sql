CREATE POLICY "Directors can update managed profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'diretor'::app_role)
  AND (
    (
      has_role(user_id, 'educador'::app_role)
      AND is_in_same_creche(auth.uid(), user_id)
    )
    OR (
      has_role(user_id, 'responsavel'::app_role)
      AND EXISTS (
        SELECT 1
        FROM public.crianca_responsaveis cr
        JOIN public.criancas c ON c.id = cr.crianca_id
        JOIN public.turmas t ON t.id = c.turma_id
        JOIN public.creche_membros cm ON cm.creche_id = t.creche_id
        WHERE cm.user_id = auth.uid()
          AND cr.responsavel_user_id = profiles.user_id
      )
    )
  )
)
WITH CHECK (
  has_role(auth.uid(), 'diretor'::app_role)
  AND (
    (
      has_role(user_id, 'educador'::app_role)
      AND is_in_same_creche(auth.uid(), user_id)
    )
    OR (
      has_role(user_id, 'responsavel'::app_role)
      AND EXISTS (
        SELECT 1
        FROM public.crianca_responsaveis cr
        JOIN public.criancas c ON c.id = cr.crianca_id
        JOIN public.turmas t ON t.id = c.turma_id
        JOIN public.creche_membros cm ON cm.creche_id = t.creche_id
        WHERE cm.user_id = auth.uid()
          AND cr.responsavel_user_id = profiles.user_id
      )
    )
  )
);