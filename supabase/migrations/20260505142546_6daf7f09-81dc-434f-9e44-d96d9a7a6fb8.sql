
-- 1) Recados: tighten educador INSERT (no parent_id bypass)
DROP POLICY IF EXISTS "Educadores can insert recados in their turmas" ON public.recados;
CREATE POLICY "Educadores can insert recados in their turmas"
ON public.recados FOR INSERT TO authenticated
WITH CHECK (
  remetente_user_id = auth.uid()
  AND (
    (turma_id IS NOT NULL AND public.is_educador_of_turma(auth.uid(), turma_id))
    OR (crianca_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.criancas c
      WHERE c.id = recados.crianca_id
        AND public.is_educador_of_turma(auth.uid(), c.turma_id)
    ))
    OR (parent_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.recados pr
      WHERE pr.id = recados.parent_id
        AND (
          (pr.turma_id IS NOT NULL AND public.is_educador_of_turma(auth.uid(), pr.turma_id))
          OR (pr.crianca_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.criancas c2
            WHERE c2.id = pr.crianca_id
              AND public.is_educador_of_turma(auth.uid(), c2.turma_id)
          ))
        )
    ))
  )
);

-- 2) Recados: tighten responsavel INSERT
DROP POLICY IF EXISTS "Responsáveis can insert recados for their crianças" ON public.recados;
CREATE POLICY "Responsáveis can insert recados for their crianças"
ON public.recados FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'responsavel'::app_role)
  AND remetente_user_id = auth.uid()
  AND (
    (crianca_id IS NOT NULL AND public.is_responsavel_of_crianca(auth.uid(), crianca_id))
    OR (parent_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.recados pr
      WHERE pr.id = recados.parent_id
        AND (
          (pr.crianca_id IS NOT NULL AND public.is_responsavel_of_crianca(auth.uid(), pr.crianca_id))
          OR (pr.turma_id IS NOT NULL AND pr.turma_id IN (
            SELECT public.get_turma_ids_for_responsavel(auth.uid())
          ))
        )
    ))
  )
);

-- 3) configuracoes_pedagogicas: allow alunos and responsaveis to read their school's flags
CREATE POLICY "Alunos can view their school config"
ON public.configuracoes_pedagogicas FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.criancas c
    JOIN public.turmas t ON t.id = c.turma_id
    WHERE t.creche_id = configuracoes_pedagogicas.creche_id
      AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Responsaveis can view their school config"
ON public.configuracoes_pedagogicas FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.crianca_responsaveis cr
    JOIN public.criancas c ON c.id = cr.crianca_id
    JOIN public.turmas t ON t.id = c.turma_id
    WHERE cr.responsavel_user_id = auth.uid()
      AND t.creche_id = configuracoes_pedagogicas.creche_id
  )
);

-- 4) Notificacoes: validate crianca_id belongs to caller (when provided)
DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notificacoes;
CREATE POLICY "Users can insert own notifications"
ON public.notificacoes FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND (
    crianca_id IS NULL
    OR public.can_access_crianca(auth.uid(), crianca_id)
  )
);

-- 5) Revoke EXECUTE on get_opcoes_for_quiz from anon
REVOKE EXECUTE ON FUNCTION public.get_opcoes_for_quiz(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_opcoes_for_quiz(uuid) TO authenticated;
