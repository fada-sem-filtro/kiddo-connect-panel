
-- Secretaria RLS for boletins
CREATE POLICY "Secretaria can manage boletins of their creche"
ON public.boletins FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'secretaria') AND
  EXISTS (SELECT 1 FROM turmas t JOIN creche_membros cm ON cm.creche_id = t.creche_id WHERE t.id = boletins.turma_id AND cm.user_id = auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'secretaria') AND
  EXISTS (SELECT 1 FROM turmas t JOIN creche_membros cm ON cm.creche_id = t.creche_id WHERE t.id = boletins.turma_id AND cm.user_id = auth.uid())
);

-- grade_aulas
CREATE POLICY "Secretaria can view grade_aulas of their creche"
ON public.grade_aulas FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'secretaria') AND
  EXISTS (SELECT 1 FROM turmas t JOIN creche_membros cm ON cm.creche_id = t.creche_id WHERE t.id = grade_aulas.turma_id AND cm.user_id = auth.uid())
);

-- materias
CREATE POLICY "Secretaria can view materias of their creche"
ON public.materias FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'secretaria') AND
  EXISTS (SELECT 1 FROM creche_membros cm WHERE cm.creche_id = materias.creche_id AND cm.user_id = auth.uid())
);

-- turma_educadores
CREATE POLICY "Secretaria can view turma_educadores of their creche"
ON public.turma_educadores FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'secretaria') AND is_member_of_turma_creche(auth.uid(), turma_id));

-- atividades_pedagogicas
CREATE POLICY "Secretaria can view atividades of their creche"
ON public.atividades_pedagogicas FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'secretaria') AND is_member_of_turma_creche(auth.uid(), turma_id));

-- atividade_entregas
CREATE POLICY "Secretaria can view entregas of their creche"
ON public.atividade_entregas FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'secretaria') AND
  EXISTS (SELECT 1 FROM atividades_pedagogicas ap WHERE ap.id = atividade_entregas.atividade_id AND is_member_of_turma_creche(auth.uid(), ap.turma_id))
);

-- atividade_questoes
CREATE POLICY "Secretaria can view questoes of their creche"
ON public.atividade_questoes FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'secretaria') AND
  EXISTS (SELECT 1 FROM atividades_pedagogicas ap WHERE ap.id = atividade_questoes.atividade_id AND is_member_of_turma_creche(auth.uid(), ap.turma_id))
);

-- atividade_opcoes
CREATE POLICY "Secretaria can view opcoes of their creche"
ON public.atividade_opcoes FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'secretaria') AND
  EXISTS (SELECT 1 FROM atividade_questoes aq JOIN atividades_pedagogicas ap ON ap.id = aq.atividade_id WHERE aq.id = atividade_opcoes.questao_id AND is_member_of_turma_creche(auth.uid(), ap.turma_id))
);

-- atividade_respostas
CREATE POLICY "Secretaria can view respostas of their creche"
ON public.atividade_respostas FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'secretaria') AND
  EXISTS (SELECT 1 FROM atividade_entregas ae JOIN atividades_pedagogicas ap ON ap.id = ae.atividade_id WHERE ae.id = atividade_respostas.entrega_id AND is_member_of_turma_creche(auth.uid(), ap.turma_id))
);

-- feriados
CREATE POLICY "Secretaria can manage feriados"
ON public.feriados FOR ALL TO authenticated
USING (has_role(auth.uid(), 'secretaria'))
WITH CHECK (has_role(auth.uid(), 'secretaria'));

-- eventos_futuros
CREATE POLICY "Secretaria can view eventos_futuros"
ON public.eventos_futuros FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'secretaria'));

-- relatorio_alunos
CREATE POLICY "Secretaria can view relatorio_alunos of their creche"
ON public.relatorio_alunos FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'secretaria') AND is_member_of_turma_creche(auth.uid(), turma_id));

-- relatorio_modelos
CREATE POLICY "Secretaria can view relatorio_modelos of their creche"
ON public.relatorio_modelos FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'secretaria') AND
  EXISTS (SELECT 1 FROM creche_membros cm WHERE cm.creche_id = relatorio_modelos.creche_id AND cm.user_id = auth.uid())
);

-- relatorio_secoes
CREATE POLICY "Secretaria can view relatorio_secoes of their creche"
ON public.relatorio_secoes FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'secretaria') AND
  EXISTS (SELECT 1 FROM relatorio_modelos rm JOIN creche_membros cm ON cm.creche_id = rm.creche_id WHERE rm.id = relatorio_secoes.modelo_id AND cm.user_id = auth.uid())
);

-- relatorio_campos
CREATE POLICY "Secretaria can view relatorio_campos of their creche"
ON public.relatorio_campos FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'secretaria') AND
  EXISTS (SELECT 1 FROM relatorio_secoes rs JOIN relatorio_modelos rm ON rm.id = rs.modelo_id JOIN creche_membros cm ON cm.creche_id = rm.creche_id WHERE rs.id = relatorio_campos.secao_id AND cm.user_id = auth.uid())
);

-- relatorio_respostas
CREATE POLICY "Secretaria can view relatorio_respostas of their creche"
ON public.relatorio_respostas FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'secretaria') AND
  EXISTS (SELECT 1 FROM relatorio_alunos ra WHERE ra.id = relatorio_respostas.relatorio_aluno_id AND is_member_of_turma_creche(auth.uid(), ra.turma_id))
);

-- authorized_pickups
CREATE POLICY "Secretaria can manage authorized_pickups of their creche"
ON public.authorized_pickups FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'secretaria') AND
  EXISTS (SELECT 1 FROM criancas c WHERE c.id = authorized_pickups.crianca_id AND is_member_of_turma_creche(auth.uid(), c.turma_id))
)
WITH CHECK (
  has_role(auth.uid(), 'secretaria') AND
  EXISTS (SELECT 1 FROM criancas c WHERE c.id = authorized_pickups.crianca_id AND is_member_of_turma_creche(auth.uid(), c.turma_id))
);

-- crianca_responsaveis
CREATE POLICY "Secretaria can manage crianca_responsaveis of their creche"
ON public.crianca_responsaveis FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'secretaria') AND
  EXISTS (SELECT 1 FROM criancas c WHERE c.id = crianca_responsaveis.crianca_id AND is_member_of_turma_creche(auth.uid(), c.turma_id))
)
WITH CHECK (
  has_role(auth.uid(), 'secretaria') AND
  EXISTS (SELECT 1 FROM criancas c WHERE c.id = crianca_responsaveis.crianca_id AND is_member_of_turma_creche(auth.uid(), c.turma_id))
);

-- profiles (view same creche members)
CREATE POLICY "Secretaria can view profiles of same creche"
ON public.profiles FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'secretaria') AND is_in_same_creche(auth.uid(), user_id));
