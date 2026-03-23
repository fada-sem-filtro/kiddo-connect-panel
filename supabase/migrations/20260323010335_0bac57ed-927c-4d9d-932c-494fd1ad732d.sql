
-- Modelos de relatório pedagógico por escola
CREATE TABLE public.relatorio_modelos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creche_id uuid NOT NULL REFERENCES public.creches(id) ON DELETE CASCADE,
  nome text NOT NULL,
  descricao text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seções dentro de um modelo
CREATE TABLE public.relatorio_secoes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  modelo_id uuid NOT NULL REFERENCES public.relatorio_modelos(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  descricao text,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Campos dentro de uma seção
CREATE TABLE public.relatorio_campos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  secao_id uuid NOT NULL REFERENCES public.relatorio_secoes(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  tipo text NOT NULL DEFAULT 'texto_longo',
  opcoes jsonb,
  ordem integer NOT NULL DEFAULT 0,
  obrigatorio boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Relatório preenchido por aluno
CREATE TABLE public.relatorio_alunos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  modelo_id uuid NOT NULL REFERENCES public.relatorio_modelos(id) ON DELETE CASCADE,
  crianca_id uuid NOT NULL REFERENCES public.criancas(id) ON DELETE CASCADE,
  turma_id uuid NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
  educador_user_id uuid NOT NULL,
  periodo_letivo text NOT NULL,
  status text NOT NULL DEFAULT 'rascunho',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Respostas dos campos
CREATE TABLE public.relatorio_respostas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  relatorio_aluno_id uuid NOT NULL REFERENCES public.relatorio_alunos(id) ON DELETE CASCADE,
  campo_id uuid NOT NULL REFERENCES public.relatorio_campos(id) ON DELETE CASCADE,
  valor text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Triggers updated_at
CREATE TRIGGER update_relatorio_modelos_updated_at BEFORE UPDATE ON public.relatorio_modelos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_relatorio_alunos_updated_at BEFORE UPDATE ON public.relatorio_alunos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_relatorio_respostas_updated_at BEFORE UPDATE ON public.relatorio_respostas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.relatorio_modelos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relatorio_secoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relatorio_campos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relatorio_alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relatorio_respostas ENABLE ROW LEVEL SECURITY;

-- relatorio_modelos policies
CREATE POLICY "Admins can manage relatorio_modelos" ON public.relatorio_modelos FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Directors can manage their school models" ON public.relatorio_modelos FOR ALL TO authenticated USING (is_diretor_of_creche(auth.uid(), creche_id)) WITH CHECK (is_diretor_of_creche(auth.uid(), creche_id));
CREATE POLICY "Members can view their school models" ON public.relatorio_modelos FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM creche_membros cm WHERE cm.creche_id = relatorio_modelos.creche_id AND cm.user_id = auth.uid()));

-- relatorio_secoes policies (via modelo)
CREATE POLICY "Admins can manage relatorio_secoes" ON public.relatorio_secoes FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Directors can manage secoes of their models" ON public.relatorio_secoes FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM relatorio_modelos rm WHERE rm.id = relatorio_secoes.modelo_id AND is_diretor_of_creche(auth.uid(), rm.creche_id))) WITH CHECK (EXISTS (SELECT 1 FROM relatorio_modelos rm WHERE rm.id = relatorio_secoes.modelo_id AND is_diretor_of_creche(auth.uid(), rm.creche_id)));
CREATE POLICY "Members can view secoes of their school" ON public.relatorio_secoes FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM relatorio_modelos rm JOIN creche_membros cm ON cm.creche_id = rm.creche_id WHERE rm.id = relatorio_secoes.modelo_id AND cm.user_id = auth.uid()));

-- relatorio_campos policies (via secao -> modelo)
CREATE POLICY "Admins can manage relatorio_campos" ON public.relatorio_campos FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Directors can manage campos of their models" ON public.relatorio_campos FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM relatorio_secoes rs JOIN relatorio_modelos rm ON rm.id = rs.modelo_id WHERE rs.id = relatorio_campos.secao_id AND is_diretor_of_creche(auth.uid(), rm.creche_id))) WITH CHECK (EXISTS (SELECT 1 FROM relatorio_secoes rs JOIN relatorio_modelos rm ON rm.id = rs.modelo_id WHERE rs.id = relatorio_campos.secao_id AND is_diretor_of_creche(auth.uid(), rm.creche_id)));
CREATE POLICY "Members can view campos of their school" ON public.relatorio_campos FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM relatorio_secoes rs JOIN relatorio_modelos rm ON rm.id = rs.modelo_id JOIN creche_membros cm ON cm.creche_id = rm.creche_id WHERE rs.id = relatorio_campos.secao_id AND cm.user_id = auth.uid()));

-- relatorio_alunos policies
CREATE POLICY "Admins can manage relatorio_alunos" ON public.relatorio_alunos FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Directors can manage relatorio_alunos of their creche" ON public.relatorio_alunos FOR ALL TO authenticated USING (is_diretor_of_creche(auth.uid(), get_creche_id_from_turma(turma_id))) WITH CHECK (is_diretor_of_creche(auth.uid(), get_creche_id_from_turma(turma_id)));
CREATE POLICY "Educadores can manage their relatorio_alunos" ON public.relatorio_alunos FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM turma_educadores te WHERE te.turma_id = relatorio_alunos.turma_id AND te.educador_user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM turma_educadores te WHERE te.turma_id = relatorio_alunos.turma_id AND te.educador_user_id = auth.uid()));
CREATE POLICY "Responsaveis can view relatorio_alunos of their criancas" ON public.relatorio_alunos FOR SELECT TO authenticated USING (crianca_id IN (SELECT get_crianca_ids_for_responsavel(auth.uid())));

-- relatorio_respostas policies
CREATE POLICY "Admins can manage relatorio_respostas" ON public.relatorio_respostas FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Directors can manage respostas of their creche" ON public.relatorio_respostas FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM relatorio_alunos ra WHERE ra.id = relatorio_respostas.relatorio_aluno_id AND is_diretor_of_creche(auth.uid(), get_creche_id_from_turma(ra.turma_id)))) WITH CHECK (EXISTS (SELECT 1 FROM relatorio_alunos ra WHERE ra.id = relatorio_respostas.relatorio_aluno_id AND is_diretor_of_creche(auth.uid(), get_creche_id_from_turma(ra.turma_id))));
CREATE POLICY "Educadores can manage respostas of their reports" ON public.relatorio_respostas FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM relatorio_alunos ra JOIN turma_educadores te ON te.turma_id = ra.turma_id WHERE ra.id = relatorio_respostas.relatorio_aluno_id AND te.educador_user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM relatorio_alunos ra JOIN turma_educadores te ON te.turma_id = ra.turma_id WHERE ra.id = relatorio_respostas.relatorio_aluno_id AND te.educador_user_id = auth.uid()));
CREATE POLICY "Responsaveis can view respostas of their criancas" ON public.relatorio_respostas FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM relatorio_alunos ra WHERE ra.id = relatorio_respostas.relatorio_aluno_id AND ra.crianca_id IN (SELECT get_crianca_ids_for_responsavel(auth.uid()))));
