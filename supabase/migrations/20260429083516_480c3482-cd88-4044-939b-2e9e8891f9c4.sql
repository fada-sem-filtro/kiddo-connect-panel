-- 1. Fix search_path nas funções da fila de emails
CREATE OR REPLACE FUNCTION public.move_to_dlq(source_queue text, dlq_name text, message_id bigint, payload jsonb)
 RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pgmq
AS $function$
DECLARE new_id BIGINT;
BEGIN
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  PERFORM pgmq.delete(source_queue, message_id);
  RETURN new_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.enqueue_email(queue_name text, payload jsonb)
 RETURNS bigint LANGUAGE sql SECURITY DEFINER SET search_path = public, pgmq
AS $function$ SELECT pgmq.send(queue_name, payload); $function$;

CREATE OR REPLACE FUNCTION public.read_email_batch(queue_name text, batch_size integer, vt integer)
 RETURNS TABLE(msg_id bigint, read_ct integer, message jsonb)
 LANGUAGE sql SECURITY DEFINER SET search_path = public, pgmq
AS $function$ SELECT msg_id, read_ct, message FROM pgmq.read(queue_name, vt, batch_size); $function$;

CREATE OR REPLACE FUNCTION public.delete_email(queue_name text, message_id bigint)
 RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public, pgmq
AS $function$ SELECT pgmq.delete(queue_name, message_id); $function$;

-- 2. Revogar EXECUTE de anon/public nas funções SECURITY DEFINER da fila (apenas service_role usa)
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;

-- 3. Restringir LIST nos buckets públicos: trocar SELECT amplo por SELECT autenticado
DROP POLICY IF EXISTS "Anyone can view pickup photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view recado attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can view atividade files" ON storage.objects;
DROP POLICY IF EXISTS "Public can view creche logos" ON storage.objects;

-- Recriar permitindo apenas leitura individual por authenticated (sem listing por anon)
CREATE POLICY "Authenticated can view pickup photos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'authorized-pickups-photos');

CREATE POLICY "Authenticated can view recado attachments"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'recado-anexos');

CREATE POLICY "Authenticated can view atividade files v2"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'atividades-arquivos');

-- creche-logos precisa ser legível por anon (usado em emails/landing). Mantém público mas sem permitir listing.
CREATE POLICY "Public can view creche logo objects"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'creche-logos' AND name IS NOT NULL);

-- email-assets idem
DROP POLICY IF EXISTS "Public can view email assets" ON storage.objects;
CREATE POLICY "Public can view email asset objects"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'email-assets' AND name IS NOT NULL);