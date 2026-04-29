-- Fix cross-tenant leak on eventos_futuros
DROP POLICY IF EXISTS "Authenticated can view eventos_futuros" ON public.eventos_futuros;

CREATE POLICY "Members can view eventos_futuros from their school"
  ON public.eventos_futuros
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'secretaria'::app_role)
    OR turma_id IS NULL
    OR is_member_of_turma_creche(auth.uid(), turma_id)
    OR is_educador_of_turma(auth.uid(), turma_id)
    OR auth.uid() IN (
      SELECT cr.responsavel_user_id
      FROM public.crianca_responsaveis cr
      JOIN public.criancas c ON c.id = cr.crianca_id
      WHERE c.turma_id = eventos_futuros.turma_id
    )
  );

-- Restrict realtime.messages so users only receive events on their own user-scoped topic
-- Topics in this app are subscribed by user_id (e.g. notificacoes:<uid>)
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can receive own realtime messages" ON realtime.messages;

CREATE POLICY "Authenticated can receive own realtime messages"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    -- Allow only if the topic includes the user's uid, OR is a public app channel.
    -- This is a defense-in-depth restriction; table RLS still applies on the underlying row.
    (topic LIKE '%' || auth.uid()::text || '%')
    OR (topic LIKE 'public:%')
  );