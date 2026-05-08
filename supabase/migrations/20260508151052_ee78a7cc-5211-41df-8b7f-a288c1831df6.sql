-- Allow directors to manage their own school's sidebar configuration
DROP POLICY IF EXISTS "Diretores can manage their school sidebar_config" ON public.sidebar_config;
CREATE POLICY "Diretores can manage their school sidebar_config"
  ON public.sidebar_config
  FOR ALL
  TO authenticated
  USING (public.is_diretor_of_creche(auth.uid(), creche_id))
  WITH CHECK (public.is_diretor_of_creche(auth.uid(), creche_id));