
-- Grade de Aulas table
CREATE TABLE public.grade_aulas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  turma_id uuid NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
  materia_id uuid NOT NULL REFERENCES public.materias(id) ON DELETE CASCADE,
  educador_user_id uuid NOT NULL,
  dia_semana integer NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
  horario_inicio time NOT NULL,
  horario_fim time NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.grade_aulas ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage grade_aulas" ON public.grade_aulas
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Directors can manage grade_aulas of their creche" ON public.grade_aulas
  FOR ALL TO authenticated
  USING (public.is_diretor_of_creche(auth.uid(), public.get_creche_id_from_turma(turma_id)))
  WITH CHECK (public.is_diretor_of_creche(auth.uid(), public.get_creche_id_from_turma(turma_id)));

CREATE POLICY "Educadores can view grade_aulas in their turmas" ON public.grade_aulas
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.turma_educadores te
    WHERE te.turma_id = grade_aulas.turma_id AND te.educador_user_id = auth.uid()
  ));

CREATE POLICY "Members can view grade_aulas of their school" ON public.grade_aulas
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.turmas t
    JOIN public.creche_membros cm ON cm.creche_id = t.creche_id
    WHERE t.id = grade_aulas.turma_id AND cm.user_id = auth.uid()
  ));
