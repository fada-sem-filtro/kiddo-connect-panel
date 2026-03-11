
-- Tabela de notificações
CREATE TABLE public.notificacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  titulo text NOT NULL,
  mensagem text NOT NULL,
  tipo text NOT NULL DEFAULT 'evento',
  lida boolean NOT NULL DEFAULT false,
  crianca_id uuid REFERENCES public.criancas(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
  ON public.notificacoes FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users can update (mark read) their own notifications
CREATE POLICY "Users can update own notifications"
  ON public.notificacoes FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON public.notificacoes FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- System (trigger) inserts via SECURITY DEFINER function
CREATE POLICY "System can insert notifications"
  ON public.notificacoes FOR INSERT TO authenticated
  WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notificacoes;

-- Function to auto-create notifications for responsáveis when evento is inserted
CREATE OR REPLACE FUNCTION public.notify_responsaveis_on_evento()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _crianca_nome text;
  _tipo_label text;
  _resp record;
BEGIN
  SELECT nome INTO _crianca_nome FROM public.criancas WHERE id = NEW.crianca_id;
  
  _tipo_label := CASE NEW.tipo
    WHEN 'ALIMENTACAO' THEN 'Alimentação'
    WHEN 'SONECA' THEN 'Soneca'
    WHEN 'BRINCADEIRA' THEN 'Brincadeira'
    WHEN 'ATIVIDADE' THEN 'Atividade'
    WHEN 'HIGIENE' THEN 'Higiene'
    ELSE 'Evento'
  END;

  FOR _resp IN
    SELECT responsavel_user_id FROM public.crianca_responsaveis WHERE crianca_id = NEW.crianca_id
  LOOP
    INSERT INTO public.notificacoes (user_id, titulo, mensagem, tipo, crianca_id)
    VALUES (
      _resp.responsavel_user_id,
      _tipo_label || ' - ' || COALESCE(_crianca_nome, 'Criança'),
      COALESCE(NEW.observacao, _tipo_label || ' registrado(a) para ' || COALESCE(_crianca_nome, 'sua criança')),
      'evento',
      NEW.crianca_id
    );
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_evento_insert_notify
  AFTER INSERT ON public.eventos
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_responsaveis_on_evento();
