
-- Enable realtime for suporte_mensagens
ALTER PUBLICATION supabase_realtime ADD TABLE public.suporte_mensagens;

-- Trigger to notify admin when new support message arrives
CREATE OR REPLACE FUNCTION public.notify_admin_on_suporte()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _admin record;
BEGIN
  FOR _admin IN
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO public.notificacoes (user_id, titulo, mensagem, tipo)
    VALUES (
      _admin.user_id,
      '🛟 Nova mensagem de suporte',
      COALESCE(NEW.nome, 'Usuário') || ': ' || COALESCE(NEW.assunto, 'Sem assunto'),
      'evento'
    );
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_admin_on_suporte
  AFTER INSERT ON public.suporte_mensagens
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_on_suporte();
