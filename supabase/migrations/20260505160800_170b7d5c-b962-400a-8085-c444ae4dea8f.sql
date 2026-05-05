-- Função para inserir resposta de suporte como recado, contornando RLS de forma segura
CREATE OR REPLACE FUNCTION public.send_suporte_reply(
  _suporte_id uuid,
  _titulo text,
  _conteudo text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _caller uuid := auth.uid();
  _target_user uuid;
  _new_id uuid;
BEGIN
  IF _caller IS NULL THEN
    RAISE EXCEPTION 'auth required';
  END IF;

  -- Apenas admins podem responder mensagens de suporte
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _caller AND role = 'admin'::app_role) THEN
    RAISE EXCEPTION 'admin role required';
  END IF;

  SELECT user_id INTO _target_user FROM public.suporte_mensagens WHERE id = _suporte_id;
  IF _target_user IS NULL THEN
    RAISE EXCEPTION 'suporte message not found';
  END IF;

  INSERT INTO public.recados (titulo, conteudo, remetente_user_id, remetente_nome, crianca_id, turma_id)
  VALUES (_titulo, _conteudo, _target_user, '🛟 Suporte', NULL, NULL)
  RETURNING id INTO _new_id;

  -- Marcar suporte como respondido
  UPDATE public.suporte_mensagens SET status = 'respondido', updated_at = now() WHERE id = _suporte_id;

  RETURN _new_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.send_suporte_reply(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.send_suporte_reply(uuid, text, text) TO authenticated;