
-- 1. Add 'aluno' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'aluno';

-- 2. Add email_aluno and user_id to criancas
ALTER TABLE public.criancas ADD COLUMN IF NOT EXISTS email_aluno text;
ALTER TABLE public.criancas ADD COLUMN IF NOT EXISTS user_id uuid;

-- 3. Add atividades_avaliacoes_ativo to configuracoes_pedagogicas
ALTER TABLE public.configuracoes_pedagogicas ADD COLUMN IF NOT EXISTS atividades_avaliacoes_ativo boolean NOT NULL DEFAULT false;

-- 4. Create atividades_pedagogicas table
CREATE TABLE public.atividades_pedagogicas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  descricao text,
  turma_id uuid NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
  educador_user_id uuid NOT NULL,
  data_entrega date NOT NULL,
  tipo text NOT NULL DEFAULT 'atividade',
  instrucoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.atividades_pedagogicas ENABLE ROW LEVEL SECURITY;

-- 5. Create atividade_questoes table
CREATE TABLE public.atividade_questoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  atividade_id uuid NOT NULL REFERENCES public.atividades_pedagogicas(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  descricao text,
  tipo text NOT NULL DEFAULT 'texto',
  imagem_url text,
  ordem integer NOT NULL DEFAULT 0,
  pontuacao numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.atividade_questoes ENABLE ROW LEVEL SECURITY;

-- 6. Create atividade_opcoes table (for multiple choice)
CREATE TABLE public.atividade_opcoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  questao_id uuid NOT NULL REFERENCES public.atividade_questoes(id) ON DELETE CASCADE,
  texto text NOT NULL,
  is_correta boolean NOT NULL DEFAULT false,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.atividade_opcoes ENABLE ROW LEVEL SECURITY;

-- 7. Create atividade_entregas table (student submissions)
CREATE TABLE public.atividade_entregas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  atividade_id uuid NOT NULL REFERENCES public.atividades_pedagogicas(id) ON DELETE CASCADE,
  aluno_crianca_id uuid NOT NULL REFERENCES public.criancas(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pendente',
  nota numeric,
  feedback_educador text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.atividade_entregas ENABLE ROW LEVEL SECURITY;

-- 8. Create atividade_respostas table (individual question responses)
CREATE TABLE public.atividade_respostas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entrega_id uuid NOT NULL REFERENCES public.atividade_entregas(id) ON DELETE CASCADE,
  questao_id uuid NOT NULL REFERENCES public.atividade_questoes(id) ON DELETE CASCADE,
  resposta_texto text,
  opcao_selecionada_id uuid REFERENCES public.atividade_opcoes(id),
  foto_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.atividade_respostas ENABLE ROW LEVEL SECURITY;

-- 9. Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('atividades-arquivos', 'atividades-arquivos', true)
ON CONFLICT (id) DO NOTHING;

-- 10. RLS policies for atividades_pedagogicas
CREATE POLICY "Admins can manage atividades" ON public.atividades_pedagogicas FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Directors can manage atividades of their creche" ON public.atividades_pedagogicas FOR ALL TO authenticated
  USING (is_diretor_of_creche(auth.uid(), get_creche_id_from_turma(turma_id)))
  WITH CHECK (is_diretor_of_creche(auth.uid(), get_creche_id_from_turma(turma_id)));

CREATE POLICY "Educadores can manage their atividades" ON public.atividades_pedagogicas FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM turma_educadores te WHERE te.turma_id = atividades_pedagogicas.turma_id AND te.educador_user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM turma_educadores te WHERE te.turma_id = atividades_pedagogicas.turma_id AND te.educador_user_id = auth.uid()));

CREATE POLICY "Alunos can view atividades of their turma" ON public.atividades_pedagogicas FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM criancas c WHERE c.turma_id = atividades_pedagogicas.turma_id AND c.user_id = auth.uid()));

CREATE POLICY "Responsaveis can view atividades of their criancas turma" ON public.atividades_pedagogicas FOR SELECT TO authenticated
  USING (turma_id IN (SELECT get_turma_ids_for_responsavel(auth.uid())));

-- 11. RLS policies for atividade_questoes
CREATE POLICY "Admins can manage questoes" ON public.atividade_questoes FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Educadores can manage questoes of their atividades" ON public.atividade_questoes FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM atividades_pedagogicas ap JOIN turma_educadores te ON te.turma_id = ap.turma_id WHERE ap.id = atividade_questoes.atividade_id AND te.educador_user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM atividades_pedagogicas ap JOIN turma_educadores te ON te.turma_id = ap.turma_id WHERE ap.id = atividade_questoes.atividade_id AND te.educador_user_id = auth.uid()));

CREATE POLICY "Directors can manage questoes" ON public.atividade_questoes FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM atividades_pedagogicas ap WHERE ap.id = atividade_questoes.atividade_id AND is_diretor_of_creche(auth.uid(), get_creche_id_from_turma(ap.turma_id))))
  WITH CHECK (EXISTS (SELECT 1 FROM atividades_pedagogicas ap WHERE ap.id = atividade_questoes.atividade_id AND is_diretor_of_creche(auth.uid(), get_creche_id_from_turma(ap.turma_id))));

CREATE POLICY "Alunos can view questoes" ON public.atividade_questoes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM atividades_pedagogicas ap JOIN criancas c ON c.turma_id = ap.turma_id WHERE ap.id = atividade_questoes.atividade_id AND c.user_id = auth.uid()));

CREATE POLICY "Responsaveis can view questoes" ON public.atividade_questoes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM atividades_pedagogicas ap WHERE ap.id = atividade_questoes.atividade_id AND ap.turma_id IN (SELECT get_turma_ids_for_responsavel(auth.uid()))));

-- 12. RLS policies for atividade_opcoes
CREATE POLICY "Admins can manage opcoes" ON public.atividade_opcoes FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Educadores can manage opcoes" ON public.atividade_opcoes FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM atividade_questoes aq JOIN atividades_pedagogicas ap ON ap.id = aq.atividade_id JOIN turma_educadores te ON te.turma_id = ap.turma_id WHERE aq.id = atividade_opcoes.questao_id AND te.educador_user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM atividade_questoes aq JOIN atividades_pedagogicas ap ON ap.id = aq.atividade_id JOIN turma_educadores te ON te.turma_id = ap.turma_id WHERE aq.id = atividade_opcoes.questao_id AND te.educador_user_id = auth.uid()));

CREATE POLICY "Directors can manage opcoes" ON public.atividade_opcoes FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM atividade_questoes aq JOIN atividades_pedagogicas ap ON ap.id = aq.atividade_id WHERE aq.id = atividade_opcoes.questao_id AND is_diretor_of_creche(auth.uid(), get_creche_id_from_turma(ap.turma_id))))
  WITH CHECK (EXISTS (SELECT 1 FROM atividade_questoes aq JOIN atividades_pedagogicas ap ON ap.id = aq.atividade_id WHERE aq.id = atividade_opcoes.questao_id AND is_diretor_of_creche(auth.uid(), get_creche_id_from_turma(ap.turma_id))));

CREATE POLICY "Alunos can view opcoes" ON public.atividade_opcoes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM atividade_questoes aq JOIN atividades_pedagogicas ap ON ap.id = aq.atividade_id JOIN criancas c ON c.turma_id = ap.turma_id WHERE aq.id = atividade_opcoes.questao_id AND c.user_id = auth.uid()));

CREATE POLICY "Responsaveis can view opcoes" ON public.atividade_opcoes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM atividade_questoes aq JOIN atividades_pedagogicas ap ON ap.id = aq.atividade_id WHERE aq.id = atividade_opcoes.questao_id AND ap.turma_id IN (SELECT get_turma_ids_for_responsavel(auth.uid()))));

-- 13. RLS policies for atividade_entregas
CREATE POLICY "Admins can manage entregas" ON public.atividade_entregas FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Educadores can manage entregas in their turmas" ON public.atividade_entregas FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM atividades_pedagogicas ap JOIN turma_educadores te ON te.turma_id = ap.turma_id WHERE ap.id = atividade_entregas.atividade_id AND te.educador_user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM atividades_pedagogicas ap JOIN turma_educadores te ON te.turma_id = ap.turma_id WHERE ap.id = atividade_entregas.atividade_id AND te.educador_user_id = auth.uid()));

CREATE POLICY "Directors can manage entregas" ON public.atividade_entregas FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM atividades_pedagogicas ap WHERE ap.id = atividade_entregas.atividade_id AND is_diretor_of_creche(auth.uid(), get_creche_id_from_turma(ap.turma_id))))
  WITH CHECK (EXISTS (SELECT 1 FROM atividades_pedagogicas ap WHERE ap.id = atividade_entregas.atividade_id AND is_diretor_of_creche(auth.uid(), get_creche_id_from_turma(ap.turma_id))));

CREATE POLICY "Alunos can manage own entregas" ON public.atividade_entregas FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM criancas c WHERE c.id = atividade_entregas.aluno_crianca_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM criancas c WHERE c.id = atividade_entregas.aluno_crianca_id AND c.user_id = auth.uid()));

CREATE POLICY "Responsaveis can view entregas of their criancas" ON public.atividade_entregas FOR SELECT TO authenticated
  USING (aluno_crianca_id IN (SELECT get_crianca_ids_for_responsavel(auth.uid())));

-- 14. RLS policies for atividade_respostas
CREATE POLICY "Admins can manage respostas_atv" ON public.atividade_respostas FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Educadores can manage respostas_atv in their turmas" ON public.atividade_respostas FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM atividade_entregas ae JOIN atividades_pedagogicas ap ON ap.id = ae.atividade_id JOIN turma_educadores te ON te.turma_id = ap.turma_id WHERE ae.id = atividade_respostas.entrega_id AND te.educador_user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM atividade_entregas ae JOIN atividades_pedagogicas ap ON ap.id = ae.atividade_id JOIN turma_educadores te ON te.turma_id = ap.turma_id WHERE ae.id = atividade_respostas.entrega_id AND te.educador_user_id = auth.uid()));

CREATE POLICY "Directors can manage respostas_atv" ON public.atividade_respostas FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM atividade_entregas ae JOIN atividades_pedagogicas ap ON ap.id = ae.atividade_id WHERE ae.id = atividade_respostas.entrega_id AND is_diretor_of_creche(auth.uid(), get_creche_id_from_turma(ap.turma_id))))
  WITH CHECK (EXISTS (SELECT 1 FROM atividade_entregas ae JOIN atividades_pedagogicas ap ON ap.id = ae.atividade_id WHERE ae.id = atividade_respostas.entrega_id AND is_diretor_of_creche(auth.uid(), get_creche_id_from_turma(ap.turma_id))));

CREATE POLICY "Alunos can manage own respostas_atv" ON public.atividade_respostas FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM atividade_entregas ae JOIN criancas c ON c.id = ae.aluno_crianca_id WHERE ae.id = atividade_respostas.entrega_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM atividade_entregas ae JOIN criancas c ON c.id = ae.aluno_crianca_id WHERE ae.id = atividade_respostas.entrega_id AND c.user_id = auth.uid()));

CREATE POLICY "Responsaveis can view respostas_atv of their criancas" ON public.atividade_respostas FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM atividade_entregas ae WHERE ae.id = atividade_respostas.entrega_id AND ae.aluno_crianca_id IN (SELECT get_crianca_ids_for_responsavel(auth.uid()))));

-- 15. Storage policies for atividades-arquivos bucket
CREATE POLICY "Authenticated can upload atividade files" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'atividades-arquivos');

CREATE POLICY "Authenticated can view atividade files" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'atividades-arquivos');

CREATE POLICY "Authenticated can delete own atividade files" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'atividades-arquivos');

-- 16. Triggers for updated_at
CREATE TRIGGER update_atividades_pedagogicas_updated_at BEFORE UPDATE ON public.atividades_pedagogicas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_atividade_entregas_updated_at BEFORE UPDATE ON public.atividade_entregas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
