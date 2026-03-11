
-- Turmas table linked to creche
CREATE TABLE public.turmas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  creche_id uuid NOT NULL REFERENCES public.creches(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Crianças table linked to turma
CREATE TABLE public.criancas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  data_nascimento date NOT NULL,
  turma_id uuid NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
  observacoes text,
  foto_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Link educadores to turmas
CREATE TABLE public.turma_educadores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_id uuid NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
  educador_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(turma_id, educador_user_id)
);

-- Link crianças to responsáveis
CREATE TABLE public.crianca_responsaveis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crianca_id uuid NOT NULL REFERENCES public.criancas(id) ON DELETE CASCADE,
  responsavel_user_id uuid NOT NULL,
  parentesco text NOT NULL DEFAULT 'Responsável',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(crianca_id, responsavel_user_id)
);

-- Updated_at triggers
CREATE TRIGGER update_turmas_updated_at BEFORE UPDATE ON public.turmas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_criancas_updated_at BEFORE UPDATE ON public.criancas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.turmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.criancas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turma_educadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crianca_responsaveis ENABLE ROW LEVEL SECURITY;

-- Helper: check if user is member of the creche that owns a turma
CREATE OR REPLACE FUNCTION public.is_member_of_turma_creche(_user_id uuid, _turma_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.turmas t
    JOIN public.creche_membros cm ON cm.creche_id = t.creche_id
    WHERE t.id = _turma_id AND cm.user_id = _user_id
  )
$$;

-- Helper: check if user is educador of a turma
CREATE OR REPLACE FUNCTION public.is_educador_of_turma(_user_id uuid, _turma_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.turma_educadores
    WHERE turma_id = _turma_id AND educador_user_id = _user_id
  )
$$;

-- Helper: get creche_id from turma
CREATE OR REPLACE FUNCTION public.get_creche_id_from_turma(_turma_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT creche_id FROM public.turmas WHERE id = _turma_id LIMIT 1
$$;

-- ===== TURMAS RLS =====
CREATE POLICY "Admins can manage all turmas"
ON public.turmas FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Directors can manage turmas of their creche"
ON public.turmas FOR ALL TO authenticated
USING (is_diretor_of_creche(auth.uid(), creche_id))
WITH CHECK (is_diretor_of_creche(auth.uid(), creche_id));

CREATE POLICY "Educadores can view turmas they are assigned to"
ON public.turmas FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.turma_educadores te
    WHERE te.turma_id = turmas.id AND te.educador_user_id = auth.uid()
  )
);

CREATE POLICY "Responsáveis can view turmas of their crianças"
ON public.turmas FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.crianca_responsaveis cr
    JOIN public.criancas c ON c.id = cr.crianca_id
    WHERE c.turma_id = turmas.id AND cr.responsavel_user_id = auth.uid()
  )
);

-- ===== CRIANÇAS RLS =====
CREATE POLICY "Admins can manage all criancas"
ON public.criancas FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Directors can manage criancas of their creche turmas"
ON public.criancas FOR ALL TO authenticated
USING (is_diretor_of_creche(auth.uid(), get_creche_id_from_turma(turma_id)))
WITH CHECK (is_diretor_of_creche(auth.uid(), get_creche_id_from_turma(turma_id)));

CREATE POLICY "Educadores can view criancas in their turmas"
ON public.criancas FOR SELECT TO authenticated
USING (is_educador_of_turma(auth.uid(), turma_id));

CREATE POLICY "Responsáveis can view their own criancas"
ON public.criancas FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.crianca_responsaveis cr
    WHERE cr.crianca_id = criancas.id AND cr.responsavel_user_id = auth.uid()
  )
);

-- ===== TURMA_EDUCADORES RLS =====
CREATE POLICY "Admins can manage turma_educadores"
ON public.turma_educadores FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Directors can manage turma_educadores of their creche"
ON public.turma_educadores FOR ALL TO authenticated
USING (is_diretor_of_creche(auth.uid(), get_creche_id_from_turma(turma_id)))
WITH CHECK (is_diretor_of_creche(auth.uid(), get_creche_id_from_turma(turma_id)));

CREATE POLICY "Educadores can view their own turma assignments"
ON public.turma_educadores FOR SELECT TO authenticated
USING (educador_user_id = auth.uid());

-- ===== CRIANCA_RESPONSAVEIS RLS =====
CREATE POLICY "Admins can manage crianca_responsaveis"
ON public.crianca_responsaveis FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Directors can manage crianca_responsaveis of their creche"
ON public.crianca_responsaveis FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.criancas c
    WHERE c.id = crianca_responsaveis.crianca_id
    AND is_diretor_of_creche(auth.uid(), get_creche_id_from_turma(c.turma_id))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.criancas c
    WHERE c.id = crianca_responsaveis.crianca_id
    AND is_diretor_of_creche(auth.uid(), get_creche_id_from_turma(c.turma_id))
  )
);

CREATE POLICY "Responsáveis can view their own links"
ON public.crianca_responsaveis FOR SELECT TO authenticated
USING (responsavel_user_id = auth.uid());
