
-- 1. Add new columns to eventos table for alimentação, higiene, medicamento, saída
ALTER TABLE public.eventos
  ADD COLUMN IF NOT EXISTS tipo_refeicao text,
  ADD COLUMN IF NOT EXISTS resultado_refeicao text,
  ADD COLUMN IF NOT EXISTS tipo_higiene text,
  ADD COLUMN IF NOT EXISTS nome_medicamento text,
  ADD COLUMN IF NOT EXISTS dosagem text,
  ADD COLUMN IF NOT EXISTS horario_administracao timestamp with time zone,
  ADD COLUMN IF NOT EXISTS administrado boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS horario_administrado timestamp with time zone,
  ADD COLUMN IF NOT EXISTS authorized_person_id uuid;

-- 2. Add faixa_etaria to turmas
ALTER TABLE public.turmas
  ADD COLUMN IF NOT EXISTS faixa_etaria text;

-- 3. Create authorized_pickups table
CREATE TABLE public.authorized_pickups (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crianca_id uuid NOT NULL REFERENCES public.criancas(id) ON DELETE CASCADE,
  nome text NOT NULL,
  parentesco text NOT NULL DEFAULT 'Outro',
  telefone text,
  foto_url text,
  documento text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.authorized_pickups ENABLE ROW LEVEL SECURITY;

-- RLS policies for authorized_pickups
CREATE POLICY "Admins can manage authorized_pickups"
ON public.authorized_pickups FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Directors can manage authorized_pickups of their creche"
ON public.authorized_pickups FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.criancas c
    WHERE c.id = authorized_pickups.crianca_id
    AND is_diretor_of_creche(auth.uid(), get_creche_id_from_turma(c.turma_id))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.criancas c
    WHERE c.id = authorized_pickups.crianca_id
    AND is_diretor_of_creche(auth.uid(), get_creche_id_from_turma(c.turma_id))
  )
);

CREATE POLICY "Educadores can manage authorized_pickups in their turmas"
ON public.authorized_pickups FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.criancas c
    JOIN public.turma_educadores te ON te.turma_id = c.turma_id
    WHERE c.id = authorized_pickups.crianca_id AND te.educador_user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.criancas c
    JOIN public.turma_educadores te ON te.turma_id = c.turma_id
    WHERE c.id = authorized_pickups.crianca_id AND te.educador_user_id = auth.uid()
  )
);

CREATE POLICY "Responsáveis can view authorized_pickups of their crianças"
ON public.authorized_pickups FOR SELECT TO authenticated
USING (
  crianca_id IN (SELECT get_crianca_ids_for_responsavel(auth.uid()))
);

-- 4. Add foreign key from eventos to authorized_pickups
ALTER TABLE public.eventos
  ADD CONSTRAINT eventos_authorized_person_id_fkey
  FOREIGN KEY (authorized_person_id) REFERENCES public.authorized_pickups(id);

-- 5. Notification trigger for medication reminders
CREATE OR REPLACE FUNCTION public.notify_medication_reminder()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _crianca record;
  _educador record;
BEGIN
  IF NEW.tipo = 'MEDICAMENTO' AND NEW.horario_administracao IS NOT NULL AND NEW.administrado = false THEN
    SELECT c.nome, c.turma_id INTO _crianca FROM public.criancas c WHERE c.id = NEW.crianca_id;
    
    FOR _educador IN
      SELECT te.educador_user_id FROM public.turma_educadores te WHERE te.turma_id = _crianca.turma_id
    LOOP
      INSERT INTO public.notificacoes (user_id, titulo, mensagem, tipo, crianca_id)
      VALUES (
        _educador.educador_user_id,
        '💊 Medicamento - ' || COALESCE(_crianca.nome, 'Criança'),
        'Administrar ' || COALESCE(NEW.nome_medicamento, 'medicamento') || ' (' || COALESCE(NEW.dosagem, '') || ') às ' || to_char(NEW.horario_administracao AT TIME ZONE 'America/Sao_Paulo', 'HH24:MI'),
        'evento',
        NEW.crianca_id
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_medication
AFTER INSERT ON public.eventos
FOR EACH ROW
EXECUTE FUNCTION public.notify_medication_reminder();
