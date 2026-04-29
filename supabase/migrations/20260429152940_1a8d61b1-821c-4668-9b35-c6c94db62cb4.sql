
-- Helper: check if user can access a given crianca (responsavel, educador da turma, diretor da creche, admin)
CREATE OR REPLACE FUNCTION public.can_access_crianca(_user_id uuid, _crianca_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.has_role(_user_id, 'admin')
    OR EXISTS (
      SELECT 1 FROM public.crianca_responsaveis cr
      WHERE cr.crianca_id = _crianca_id AND cr.responsavel_user_id = _user_id
    )
    OR EXISTS (
      SELECT 1
      FROM public.criancas c
      JOIN public.turma_educadores te ON te.turma_id = c.turma_id
      WHERE c.id = _crianca_id AND te.educador_user_id = _user_id
    )
    OR EXISTS (
      SELECT 1
      FROM public.criancas c
      JOIN public.turmas t ON t.id = c.turma_id
      JOIN public.creche_membros cm ON cm.creche_id = t.creche_id
      JOIN public.user_roles ur ON ur.user_id = cm.user_id
      WHERE c.id = _crianca_id
        AND cm.user_id = _user_id
        AND ur.role IN ('diretor','secretaria')
    )
$$;

REVOKE EXECUTE ON FUNCTION public.can_access_crianca(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_access_crianca(uuid, uuid) TO authenticated;

-- Ensure bucket is private
UPDATE storage.buckets SET public = false WHERE id = 'authorized-pickups-photos';

-- Drop old broad policies
DROP POLICY IF EXISTS "Authenticated can view pickup photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload pickup photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update pickup photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete pickup photos" ON storage.objects;

-- Path convention: <crianca_id>/<person_id>.<ext>
-- SELECT: only users authorized for that crianca
CREATE POLICY "Pickup photos: authorized read"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'authorized-pickups-photos'
  AND public.can_access_crianca(
    auth.uid(),
    NULLIF((storage.foldername(name))[1], '')::uuid
  )
);

CREATE POLICY "Pickup photos: authorized insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'authorized-pickups-photos'
  AND public.can_access_crianca(
    auth.uid(),
    NULLIF((storage.foldername(name))[1], '')::uuid
  )
);

CREATE POLICY "Pickup photos: authorized update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'authorized-pickups-photos'
  AND public.can_access_crianca(
    auth.uid(),
    NULLIF((storage.foldername(name))[1], '')::uuid
  )
);

CREATE POLICY "Pickup photos: authorized delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'authorized-pickups-photos'
  AND public.can_access_crianca(
    auth.uid(),
    NULLIF((storage.foldername(name))[1], '')::uuid
  )
);
