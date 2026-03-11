
-- Tabela de feriados
CREATE TABLE public.feriados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  data date NOT NULL,
  recorrente boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.feriados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage feriados" ON public.feriados FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can view feriados" ON public.feriados FOR SELECT TO authenticated
  USING (true);

-- Tabela de eventos futuros (calendário escolar)
CREATE TABLE public.eventos_futuros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  data_inicio date NOT NULL,
  data_fim date,
  turma_id uuid REFERENCES public.turmas(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.eventos_futuros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage eventos_futuros" ON public.eventos_futuros FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can view eventos_futuros" ON public.eventos_futuros FOR SELECT TO authenticated
  USING (true);

-- Tabela de recados (com respostas hierárquicas via parent_id)
CREATE TABLE public.recados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL DEFAULT '',
  conteudo text NOT NULL,
  crianca_id uuid REFERENCES public.criancas(id) ON DELETE CASCADE,
  turma_id uuid REFERENCES public.turmas(id) ON DELETE CASCADE,
  remetente_user_id uuid NOT NULL,
  parent_id uuid REFERENCES public.recados(id) ON DELETE CASCADE,
  lido boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.recados ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admins can manage recados" ON public.recados FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Educadores can manage recados in their turmas
CREATE POLICY "Educadores can manage recados in their turmas" ON public.recados FOR ALL TO authenticated
  USING (
    remetente_user_id = auth.uid()
    OR (turma_id IS NOT NULL AND is_educador_of_turma(auth.uid(), turma_id))
    OR (crianca_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM criancas c WHERE c.id = recados.crianca_id AND is_educador_of_turma(auth.uid(), c.turma_id)
    ))
  )
  WITH CHECK (
    remetente_user_id = auth.uid()
  );

-- Responsáveis can view recados for their crianças and reply
CREATE POLICY "Responsáveis can view recados for their crianças" ON public.recados FOR SELECT TO authenticated
  USING (
    crianca_id IN (SELECT get_crianca_ids_for_responsavel(auth.uid()))
    OR turma_id IN (SELECT get_turma_ids_for_responsavel(auth.uid()))
  );

CREATE POLICY "Responsáveis can insert replies" ON public.recados FOR INSERT TO authenticated
  WITH CHECK (
    remetente_user_id = auth.uid()
    AND parent_id IS NOT NULL
  );

-- Trigger for updated_at
CREATE TRIGGER update_recados_updated_at
  BEFORE UPDATE ON public.recados
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
