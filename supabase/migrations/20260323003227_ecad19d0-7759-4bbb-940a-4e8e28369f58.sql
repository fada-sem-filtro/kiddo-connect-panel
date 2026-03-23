
-- Configurações pedagógicas por escola
CREATE TABLE public.configuracoes_pedagogicas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creche_id uuid NOT NULL REFERENCES public.creches(id) ON DELETE CASCADE,
  boletim_ativo boolean NOT NULL DEFAULT false,
  relatorio_desempenho_ativo boolean NOT NULL DEFAULT false,
  gestao_materias_ativo boolean NOT NULL DEFAULT false,
  grade_aulas_ativo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(creche_id)
);

ALTER TABLE public.configuracoes_pedagogicas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage configuracoes_pedagogicas" ON public.configuracoes_pedagogicas
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Directors can manage their school config" ON public.configuracoes_pedagogicas
  FOR ALL TO authenticated
  USING (is_diretor_of_creche(auth.uid(), creche_id))
  WITH CHECK (is_diretor_of_creche(auth.uid(), creche_id));

CREATE POLICY "Members can view their school config" ON public.configuracoes_pedagogicas
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.creche_membros cm
    WHERE cm.creche_id = configuracoes_pedagogicas.creche_id AND cm.user_id = auth.uid()
  ));

-- Matérias (disciplinas) por escola
CREATE TABLE public.materias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creche_id uuid NOT NULL REFERENCES public.creches(id) ON DELETE CASCADE,
  nome text NOT NULL,
  descricao text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.materias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage materias" ON public.materias
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Directors can manage their school materias" ON public.materias
  FOR ALL TO authenticated
  USING (is_diretor_of_creche(auth.uid(), creche_id))
  WITH CHECK (is_diretor_of_creche(auth.uid(), creche_id));

CREATE POLICY "Members can view their school materias" ON public.materias
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.creche_membros cm
    WHERE cm.creche_id = materias.creche_id AND cm.user_id = auth.uid()
  ));

-- Boletins escolares
CREATE TABLE public.boletins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crianca_id uuid NOT NULL REFERENCES public.criancas(id) ON DELETE CASCADE,
  turma_id uuid NOT NULL REFERENCES public.turmas(id),
  materia_id uuid NOT NULL REFERENCES public.materias(id),
  educador_user_id uuid NOT NULL,
  periodo_letivo text NOT NULL,
  avaliacao numeric(4,1),
  observacoes text,
  data_registro date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.boletins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage boletins" ON public.boletins
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Directors can manage boletins of their creche" ON public.boletins
  FOR ALL TO authenticated
  USING (is_diretor_of_creche(auth.uid(), get_creche_id_from_turma(turma_id)))
  WITH CHECK (is_diretor_of_creche(auth.uid(), get_creche_id_from_turma(turma_id)));

CREATE POLICY "Educadores can manage boletins in their turmas" ON public.boletins
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.turma_educadores te
    WHERE te.turma_id = boletins.turma_id AND te.educador_user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.turma_educadores te
    WHERE te.turma_id = boletins.turma_id AND te.educador_user_id = auth.uid()
  ));

CREATE POLICY "Responsáveis can view boletins of their crianças" ON public.boletins
  FOR SELECT TO authenticated
  USING (crianca_id IN (SELECT get_crianca_ids_for_responsavel(auth.uid())));

-- Triggers for updated_at
CREATE TRIGGER update_configuracoes_pedagogicas_updated_at
  BEFORE UPDATE ON public.configuracoes_pedagogicas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_materias_updated_at
  BEFORE UPDATE ON public.materias
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_boletins_updated_at
  BEFORE UPDATE ON public.boletins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
