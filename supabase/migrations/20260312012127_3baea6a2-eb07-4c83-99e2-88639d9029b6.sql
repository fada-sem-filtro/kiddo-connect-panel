
-- Allow educadores to view profiles of people in their turmas (responsáveis of children in their turmas)
CREATE POLICY "Educadores can view profiles of turma members"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'educador') AND (
      -- Same user
      user_id = auth.uid()
      OR
      -- Responsáveis of children in educador's turmas
      EXISTS (
        SELECT 1 FROM crianca_responsaveis cr
        JOIN criancas c ON c.id = cr.crianca_id
        JOIN turma_educadores te ON te.turma_id = c.turma_id
        WHERE te.educador_user_id = auth.uid() AND cr.responsavel_user_id = profiles.user_id
      )
      OR
      -- Other educadores in same turmas
      EXISTS (
        SELECT 1 FROM turma_educadores te1
        JOIN turma_educadores te2 ON te1.turma_id = te2.turma_id
        WHERE te1.educador_user_id = auth.uid() AND te2.educador_user_id = profiles.user_id
      )
    )
  );

-- Allow responsáveis to view profiles of educadores of their children's turmas
CREATE POLICY "Responsáveis can view profiles of their children educadores"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'responsavel') AND (
      user_id = auth.uid()
      OR
      EXISTS (
        SELECT 1 FROM crianca_responsaveis cr
        JOIN criancas c ON c.id = cr.crianca_id
        JOIN turma_educadores te ON te.turma_id = c.turma_id
        WHERE cr.responsavel_user_id = auth.uid() AND te.educador_user_id = profiles.user_id
      )
    )
  );

-- Trigger: notify educadores when responsável sends recado, and notify responsáveis when educador sends recado
CREATE OR REPLACE FUNCTION public.notify_on_recado()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = 'public'
AS $$
DECLARE
  _remetente_nome text;
  _remetente_role app_role;
  _crianca_nome text;
  _target_user_id uuid;
  _rec record;
BEGIN
  -- Get sender info
  SELECT nome INTO _remetente_nome FROM public.profiles WHERE user_id = NEW.remetente_user_id;
  SELECT role INTO _remetente_role FROM public.user_roles WHERE user_id = NEW.remetente_user_id LIMIT 1;
  
  _remetente_nome := COALESCE(_remetente_nome, 'Usuário');

  -- Get crianca name if applicable
  IF NEW.crianca_id IS NOT NULL THEN
    SELECT nome INTO _crianca_nome FROM public.criancas WHERE id = NEW.crianca_id;
  END IF;

  -- If sender is responsável, notify educadores of the child's turma
  IF _remetente_role = 'responsavel' AND NEW.crianca_id IS NOT NULL THEN
    FOR _rec IN
      SELECT te.educador_user_id
      FROM criancas c
      JOIN turma_educadores te ON te.turma_id = c.turma_id
      WHERE c.id = NEW.crianca_id
    LOOP
      INSERT INTO public.notificacoes (user_id, titulo, mensagem, tipo, crianca_id)
      VALUES (
        _rec.educador_user_id,
        'Recado de ' || _remetente_nome,
        COALESCE(NEW.titulo, '') || ' - ' || LEFT(NEW.conteudo, 100),
        'recado',
        NEW.crianca_id
      );
    END LOOP;
  END IF;

  -- If sender is educador/diretor, notify responsáveis of the child
  IF (_remetente_role IN ('educador', 'diretor')) AND NEW.crianca_id IS NOT NULL THEN
    FOR _rec IN
      SELECT responsavel_user_id FROM crianca_responsaveis WHERE crianca_id = NEW.crianca_id
    LOOP
      INSERT INTO public.notificacoes (user_id, titulo, mensagem, tipo, crianca_id)
      VALUES (
        _rec.responsavel_user_id,
        'Recado de ' || _remetente_nome,
        COALESCE(NEW.titulo, '') || ' - ' || LEFT(NEW.conteudo, 100),
        'recado',
        NEW.crianca_id
      );
    END LOOP;
  END IF;

  -- If sender is educador/diretor and turma-wide recado, notify all responsáveis of that turma
  IF (_remetente_role IN ('educador', 'diretor')) AND NEW.turma_id IS NOT NULL AND NEW.crianca_id IS NULL THEN
    FOR _rec IN
      SELECT DISTINCT cr.responsavel_user_id
      FROM criancas c
      JOIN crianca_responsaveis cr ON cr.crianca_id = c.id
      WHERE c.turma_id = NEW.turma_id
    LOOP
      INSERT INTO public.notificacoes (user_id, titulo, mensagem, tipo)
      VALUES (
        _rec.responsavel_user_id,
        'Recado para turma - ' || _remetente_nome,
        COALESCE(NEW.titulo, '') || ' - ' || LEFT(NEW.conteudo, 100),
        'recado'
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_on_recado
  AFTER INSERT ON public.recados
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_recado();
