
-- Allow directors to manage permissoes_perfil of their school
CREATE POLICY "Directors can manage permissoes_perfil of their school"
ON public.permissoes_perfil FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'diretor') AND is_diretor_of_creche(auth.uid(), creche_id)
)
WITH CHECK (
  has_role(auth.uid(), 'diretor') AND is_diretor_of_creche(auth.uid(), creche_id)
);
