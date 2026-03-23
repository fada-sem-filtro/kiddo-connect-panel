
-- Table to store per-school, per-role feature visibility and action permissions
CREATE TABLE public.permissoes_perfil (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creche_id uuid NOT NULL REFERENCES public.creches(id) ON DELETE CASCADE,
  perfil text NOT NULL, -- 'diretor', 'educador', 'responsavel'
  modulo text NOT NULL, -- e.g. 'boletim', 'materias', 'grade_aulas', 'relatorio_desempenho', 'recados', 'presencas', 'eventos', 'turmas', 'alunos', 'calendario'
  pode_visualizar boolean NOT NULL DEFAULT true,
  pode_criar boolean NOT NULL DEFAULT false,
  pode_editar boolean NOT NULL DEFAULT false,
  pode_excluir boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(creche_id, perfil, modulo)
);

ALTER TABLE public.permissoes_perfil ENABLE ROW LEVEL SECURITY;

-- Admins full access
CREATE POLICY "Admins can manage permissoes_perfil"
  ON public.permissoes_perfil FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Directors can view their school permissions
CREATE POLICY "Directors can view their school permissoes"
  ON public.permissoes_perfil FOR SELECT
  TO authenticated
  USING (is_diretor_of_creche(auth.uid(), creche_id));

-- Members can view their school permissions
CREATE POLICY "Members can view their school permissoes"
  ON public.permissoes_perfil FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM creche_membros cm
    WHERE cm.creche_id = permissoes_perfil.creche_id AND cm.user_id = auth.uid()
  ));

-- Trigger for updated_at
CREATE TRIGGER update_permissoes_perfil_updated_at
  BEFORE UPDATE ON public.permissoes_perfil
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
