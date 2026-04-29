
-- ============================================
-- 1. Tighten recado-anexos storage policies
-- ============================================
DROP POLICY IF EXISTS "Authenticated can view recado attachments" ON storage.objects;

CREATE POLICY "Recado attachments: owner or recado participant can view"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'recado-anexos'
  AND (
    -- Uploader (path is `{user_id}/...`)
    (storage.foldername(name))[1] = auth.uid()::text
    -- Or the file is referenced in a recado the user can SELECT (RLS on recados applies)
    OR EXISTS (
      SELECT 1 FROM public.recados r
      WHERE r.anexo_url LIKE '%' || storage.objects.name
    )
  )
);

-- ============================================
-- 2. Tighten atividades-arquivos storage policies
-- ============================================
DROP POLICY IF EXISTS "Authenticated can view atividade files v2" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload atividade files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete own atividade files" ON storage.objects;

-- Helper: check if user can access an atividades-arquivos path
-- Paths used:
--   respostas/{crianca_id}/...  -> needs can_access_crianca
--   questoes/...                -> educator/diretor/admin/secretaria only
CREATE POLICY "Atividade files: read when authorized"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'atividades-arquivos'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR (
      (storage.foldername(name))[1] = 'respostas'
      AND public.can_access_crianca(
        auth.uid(),
        NULLIF((storage.foldername(name))[2], '')::uuid
      )
    )
    OR (
      (storage.foldername(name))[1] = 'questoes'
      AND (
        has_role(auth.uid(), 'educador'::app_role)
        OR has_role(auth.uid(), 'diretor'::app_role)
        OR has_role(auth.uid(), 'secretaria'::app_role)
        OR has_role(auth.uid(), 'aluno'::app_role)
        OR has_role(auth.uid(), 'responsavel'::app_role)
      )
    )
  )
);

CREATE POLICY "Atividade files: upload when authorized"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'atividades-arquivos'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR (
      (storage.foldername(name))[1] = 'respostas'
      AND public.can_access_crianca(
        auth.uid(),
        NULLIF((storage.foldername(name))[2], '')::uuid
      )
    )
    OR (
      (storage.foldername(name))[1] = 'questoes'
      AND (
        has_role(auth.uid(), 'educador'::app_role)
        OR has_role(auth.uid(), 'diretor'::app_role)
        OR has_role(auth.uid(), 'admin'::app_role)
      )
    )
  )
);

CREATE POLICY "Atividade files: delete when authorized"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'atividades-arquivos'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR (
      (storage.foldername(name))[1] = 'respostas'
      AND public.can_access_crianca(
        auth.uid(),
        NULLIF((storage.foldername(name))[2], '')::uuid
      )
    )
    OR (
      (storage.foldername(name))[1] = 'questoes'
      AND (
        has_role(auth.uid(), 'educador'::app_role)
        OR has_role(auth.uid(), 'diretor'::app_role)
      )
    )
  )
);

-- ============================================
-- 3. Fix eventos_futuros: scope school-wide events to creche members
-- ============================================
DROP POLICY IF EXISTS "Members can view eventos_futuros from their school" ON public.eventos_futuros;

CREATE POLICY "Members can view eventos_futuros from their school"
ON public.eventos_futuros FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'secretaria'::app_role)
  OR (turma_id IS NOT NULL AND is_member_of_turma_creche(auth.uid(), turma_id))
  OR (turma_id IS NOT NULL AND is_educador_of_turma(auth.uid(), turma_id))
  OR (
    turma_id IS NOT NULL
    AND auth.uid() IN (
      SELECT cr.responsavel_user_id
      FROM crianca_responsaveis cr
      JOIN criancas c ON c.id = cr.crianca_id
      WHERE c.turma_id = eventos_futuros.turma_id
    )
  )
  -- School-wide events (turma_id IS NULL): visible to any user that belongs to ANY creche
  OR (
    turma_id IS NULL
    AND EXISTS (
      SELECT 1 FROM public.creche_membros cm WHERE cm.user_id = auth.uid()
    )
  )
);
