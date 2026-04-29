DROP POLICY IF EXISTS "Authenticated users can delete creche logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update creche logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload creche logos" ON storage.objects;

CREATE POLICY "Admins or directors can delete creche logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'creche-logos'
  AND (
    public.has_role(auth.uid(), 'admin')
    OR (
      (storage.foldername(name))[1] IS NOT NULL
      AND public.is_diretor_of_creche(auth.uid(), ((storage.foldername(name))[1])::uuid)
    )
  )
);

CREATE POLICY "Admins or directors can update creche logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'creche-logos'
  AND (
    public.has_role(auth.uid(), 'admin')
    OR (
      (storage.foldername(name))[1] IS NOT NULL
      AND public.is_diretor_of_creche(auth.uid(), ((storage.foldername(name))[1])::uuid)
    )
  )
);

CREATE POLICY "Admins or directors can upload creche logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'creche-logos'
  AND (
    public.has_role(auth.uid(), 'admin')
    OR (
      (storage.foldername(name))[1] IS NOT NULL
      AND public.is_diretor_of_creche(auth.uid(), ((storage.foldername(name))[1])::uuid)
    )
  )
);

DROP POLICY IF EXISTS "Recado attachments: owner or recado participant can view" ON storage.objects;

CREATE POLICY "Recado attachments: owner or authorized participant can view"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'recado-anexos'
  AND (
    (storage.foldername(name))[1] = (auth.uid())::text
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1
      FROM public.recados r
      WHERE r.anexo_url ~~ ('%' || objects.name)
        AND (
          r.remetente_user_id = auth.uid()
          OR (r.crianca_id IS NOT NULL AND public.can_access_crianca(auth.uid(), r.crianca_id))
          OR (r.turma_id IS NOT NULL AND (
                public.is_educador_of_turma(auth.uid(), r.turma_id)
                OR public.is_member_of_turma_creche(auth.uid(), r.turma_id)
              ))
        )
    )
  )
);