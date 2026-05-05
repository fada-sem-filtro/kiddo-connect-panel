
-- ============================================================
-- 1) atividade_opcoes: hide is_correta from students until graded
-- ============================================================

-- Drop the over-permissive SELECT for alunos/responsaveis
DROP POLICY IF EXISTS "Alunos can view opcoes" ON public.atividade_opcoes;
DROP POLICY IF EXISTS "Responsaveis can view opcoes" ON public.atividade_opcoes;

-- Allow alunos to view full opcoes (with is_correta) ONLY after entrega is graded
CREATE POLICY "Alunos can view opcoes after graded"
ON public.atividade_opcoes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.atividade_questoes aq
    JOIN public.atividade_entregas ae ON ae.atividade_id = aq.atividade_id
    JOIN public.criancas c ON c.id = ae.aluno_crianca_id
    WHERE aq.id = atividade_opcoes.questao_id
      AND c.user_id = auth.uid()
      AND ae.status = 'avaliada'
  )
);

CREATE POLICY "Responsaveis can view opcoes after graded"
ON public.atividade_opcoes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.atividade_questoes aq
    JOIN public.atividade_entregas ae ON ae.atividade_id = aq.atividade_id
    WHERE aq.id = atividade_opcoes.questao_id
      AND ae.aluno_crianca_id IN (
        SELECT public.get_crianca_ids_for_responsavel(auth.uid())
      )
      AND ae.status = 'avaliada'
  )
);

-- Safe RPC for taking the quiz: returns options WITHOUT is_correta
CREATE OR REPLACE FUNCTION public.get_opcoes_for_quiz(_questao_id uuid)
RETURNS TABLE (id uuid, questao_id uuid, texto text, ordem integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.id, o.questao_id, o.texto, o.ordem
  FROM public.atividade_opcoes o
  JOIN public.atividade_questoes aq ON aq.id = o.questao_id
  JOIN public.atividades_pedagogicas ap ON ap.id = aq.atividade_id
  WHERE o.questao_id = _questao_id
    AND (
      -- aluno enrolled in the turma
      EXISTS (
        SELECT 1 FROM public.criancas c
        WHERE c.turma_id = ap.turma_id AND c.user_id = auth.uid()
      )
      -- responsavel of a child in the turma
      OR ap.turma_id IN (SELECT public.get_turma_ids_for_responsavel(auth.uid()))
      -- staff
      OR public.has_role(auth.uid(), 'admin'::app_role)
      OR public.is_diretor_of_creche(auth.uid(), public.get_creche_id_from_turma(ap.turma_id))
      OR public.is_educador_of_turma(auth.uid(), ap.turma_id)
      OR (public.has_role(auth.uid(), 'secretaria'::app_role)
          AND public.is_member_of_turma_creche(auth.uid(), ap.turma_id))
    )
  ORDER BY o.ordem;
$$;

GRANT EXECUTE ON FUNCTION public.get_opcoes_for_quiz(uuid) TO authenticated;

-- ============================================================
-- 2) recados: tighten Director UPDATE
-- ============================================================
DROP POLICY IF EXISTS "Directors can update recados of their creche" ON public.recados;

CREATE POLICY "Directors can update own recados"
ON public.recados
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'diretor'::app_role)
  AND remetente_user_id = auth.uid()
)
WITH CHECK (
  has_role(auth.uid(), 'diretor'::app_role)
  AND remetente_user_id = auth.uid()
);

-- ============================================================
-- 3) recados: educadores cannot SELECT via remetente alone
-- ============================================================
DROP POLICY IF EXISTS "Educadores can manage recados in their turmas" ON public.recados;

-- SELECT/UPDATE/DELETE: limited to currently assigned turmas
CREATE POLICY "Educadores can read recados in their turmas"
ON public.recados
FOR SELECT
TO authenticated
USING (
  ((turma_id IS NOT NULL) AND public.is_educador_of_turma(auth.uid(), turma_id))
  OR ((crianca_id IS NOT NULL) AND EXISTS (
        SELECT 1 FROM public.criancas c
        WHERE c.id = recados.crianca_id
          AND public.is_educador_of_turma(auth.uid(), c.turma_id)
      ))
);

CREATE POLICY "Educadores can update own recados in their turmas"
ON public.recados
FOR UPDATE
TO authenticated
USING (
  remetente_user_id = auth.uid()
  AND (
    ((turma_id IS NOT NULL) AND public.is_educador_of_turma(auth.uid(), turma_id))
    OR ((crianca_id IS NOT NULL) AND EXISTS (
          SELECT 1 FROM public.criancas c
          WHERE c.id = recados.crianca_id
            AND public.is_educador_of_turma(auth.uid(), c.turma_id)
        ))
  )
)
WITH CHECK (remetente_user_id = auth.uid());

CREATE POLICY "Educadores can delete own recados in their turmas"
ON public.recados
FOR DELETE
TO authenticated
USING (
  remetente_user_id = auth.uid()
  AND (
    ((turma_id IS NOT NULL) AND public.is_educador_of_turma(auth.uid(), turma_id))
    OR ((crianca_id IS NOT NULL) AND EXISTS (
          SELECT 1 FROM public.criancas c
          WHERE c.id = recados.crianca_id
            AND public.is_educador_of_turma(auth.uid(), c.turma_id)
        ))
  )
);

CREATE POLICY "Educadores can insert recados in their turmas"
ON public.recados
FOR INSERT
TO authenticated
WITH CHECK (
  remetente_user_id = auth.uid()
  AND (
    ((turma_id IS NOT NULL) AND public.is_educador_of_turma(auth.uid(), turma_id))
    OR ((crianca_id IS NOT NULL) AND EXISTS (
          SELECT 1 FROM public.criancas c
          WHERE c.id = recados.crianca_id
            AND public.is_educador_of_turma(auth.uid(), c.turma_id)
        ))
    OR (parent_id IS NOT NULL)
  )
);

-- ============================================================
-- 4) atividades-arquivos storage: scope questoes per turma
-- Path is now: questoes/{turma_id}/...
-- ============================================================
DROP POLICY IF EXISTS "Atividade files: read when authorized" ON storage.objects;
DROP POLICY IF EXISTS "Atividade files: upload when authorized" ON storage.objects;
DROP POLICY IF EXISTS "Atividade files: delete when authorized" ON storage.objects;

CREATE POLICY "Atividade files: read when authorized"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'atividades-arquivos'
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR (
      (storage.foldername(name))[1] = 'respostas'
      AND public.can_access_crianca(
        auth.uid(),
        (NULLIF((storage.foldername(name))[2], ''))::uuid
      )
    )
    OR (
      (storage.foldername(name))[1] = 'questoes'
      AND (storage.foldername(name))[2] IS NOT NULL
      AND (
        public.is_educador_of_turma(auth.uid(), (NULLIF((storage.foldername(name))[2], ''))::uuid)
        OR public.is_diretor_of_creche(
              auth.uid(),
              public.get_creche_id_from_turma((NULLIF((storage.foldername(name))[2], ''))::uuid)
           )
        OR (public.has_role(auth.uid(), 'secretaria'::app_role)
            AND public.is_member_of_turma_creche(auth.uid(), (NULLIF((storage.foldername(name))[2], ''))::uuid))
        OR EXISTS (
          SELECT 1 FROM public.criancas c
          WHERE c.turma_id = (NULLIF((storage.foldername(name))[2], ''))::uuid
            AND c.user_id = auth.uid()
        )
        OR (NULLIF((storage.foldername(name))[2], ''))::uuid IN (
          SELECT public.get_turma_ids_for_responsavel(auth.uid())
        )
      )
    )
  )
);

CREATE POLICY "Atividade files: upload when authorized"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'atividades-arquivos'
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR (
      (storage.foldername(name))[1] = 'respostas'
      AND public.can_access_crianca(
        auth.uid(),
        (NULLIF((storage.foldername(name))[2], ''))::uuid
      )
    )
    OR (
      (storage.foldername(name))[1] = 'questoes'
      AND (storage.foldername(name))[2] IS NOT NULL
      AND (
        public.is_educador_of_turma(auth.uid(), (NULLIF((storage.foldername(name))[2], ''))::uuid)
        OR public.is_diretor_of_creche(
              auth.uid(),
              public.get_creche_id_from_turma((NULLIF((storage.foldername(name))[2], ''))::uuid)
           )
      )
    )
  )
);

CREATE POLICY "Atividade files: delete when authorized"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'atividades-arquivos'
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR (
      (storage.foldername(name))[1] = 'respostas'
      AND public.can_access_crianca(
        auth.uid(),
        (NULLIF((storage.foldername(name))[2], ''))::uuid
      )
    )
    OR (
      (storage.foldername(name))[1] = 'questoes'
      AND (storage.foldername(name))[2] IS NOT NULL
      AND (
        public.is_educador_of_turma(auth.uid(), (NULLIF((storage.foldername(name))[2], ''))::uuid)
        OR public.is_diretor_of_creche(
              auth.uid(),
              public.get_creche_id_from_turma((NULLIF((storage.foldername(name))[2], ''))::uuid)
           )
      )
    )
  )
);
