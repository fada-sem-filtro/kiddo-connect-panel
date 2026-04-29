
-- 1) Restrict INSERT path in recado-anexos to user's own folder
DROP POLICY IF EXISTS "Authenticated users can upload recado attachments" ON storage.objects;

CREATE POLICY "Users upload recado attachments to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'recado-anexos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 2) Tighten realtime.messages SELECT policy: remove broad public:% wildcard
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'realtime' AND tablename = 'messages'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON realtime.messages', pol.policyname);
  END LOOP;
END $$;

-- Scoped subscription rules:
-- Topic conventions supported:
--   user:<uuid>            -> only that user
--   creche:<uuid>          -> only members of that creche
--   turma:<uuid>           -> only educators/members of that turma
--   crianca:<uuid>         -> only users with access to that crianca
--   suporte:<uuid>         -> only that user's own support topic, or admins
-- Admins can subscribe to anything.
CREATE POLICY "Authenticated scoped realtime subscriptions"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR (
    realtime.topic() = 'user:' || auth.uid()::text
  )
  OR (
    realtime.topic() LIKE 'suporte:%'
    AND substring(realtime.topic() from 9) = auth.uid()::text
  )
  OR (
    realtime.topic() LIKE 'creche:%'
    AND EXISTS (
      SELECT 1 FROM public.creche_membros cm
      WHERE cm.user_id = auth.uid()
        AND cm.creche_id::text = substring(realtime.topic() from 8)
    )
  )
  OR (
    realtime.topic() LIKE 'turma:%'
    AND public.is_member_of_turma_creche(auth.uid(), (substring(realtime.topic() from 7))::uuid)
  )
  OR (
    realtime.topic() LIKE 'crianca:%'
    AND public.can_access_crianca(auth.uid(), (substring(realtime.topic() from 9))::uuid)
  )
);
