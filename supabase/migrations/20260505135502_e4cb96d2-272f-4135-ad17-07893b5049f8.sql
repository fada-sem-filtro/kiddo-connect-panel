
-- ============================================
-- 1. eventos_futuros: add creche_id
-- ============================================
ALTER TABLE public.eventos_futuros ADD COLUMN IF NOT EXISTS creche_id uuid;

-- Backfill from turma if available
UPDATE public.eventos_futuros ef
SET creche_id = t.creche_id
FROM public.turmas t
WHERE ef.turma_id = t.id AND ef.creche_id IS NULL;

-- Any remaining null -> assign to template (admin global) so we don't lose data
UPDATE public.eventos_futuros
SET creche_id = '00000000-0000-0000-0000-000000000000'
WHERE creche_id IS NULL;

ALTER TABLE public.eventos_futuros ALTER COLUMN creche_id SET NOT NULL;

DROP POLICY IF EXISTS "Members can view eventos_futuros from their school" ON public.eventos_futuros;
DROP POLICY IF EXISTS "Directors can manage eventos_futuros" ON public.eventos_futuros;
DROP POLICY IF EXISTS "Secretaria can view eventos_futuros" ON public.eventos_futuros;

CREATE POLICY "Members can view eventos_futuros of their creche"
ON public.eventos_futuros FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (SELECT 1 FROM creche_membros cm WHERE cm.creche_id = eventos_futuros.creche_id AND cm.user_id = auth.uid())
  OR (turma_id IS NOT NULL AND is_educador_of_turma(auth.uid(), turma_id))
  OR (turma_id IS NOT NULL AND auth.uid() IN (
    SELECT cr.responsavel_user_id FROM crianca_responsaveis cr
    JOIN criancas c ON c.id = cr.crianca_id WHERE c.turma_id = eventos_futuros.turma_id
  ))
);

CREATE POLICY "Directors can manage eventos_futuros of their creche"
ON public.eventos_futuros FOR ALL TO authenticated
USING (has_role(auth.uid(), 'diretor'::app_role) AND is_diretor_of_creche(auth.uid(), creche_id))
WITH CHECK (has_role(auth.uid(), 'diretor'::app_role) AND is_diretor_of_creche(auth.uid(), creche_id));

CREATE POLICY "Secretaria can manage eventos_futuros of their creche"
ON public.eventos_futuros FOR ALL TO authenticated
USING (has_role(auth.uid(), 'secretaria'::app_role) AND creche_id = get_user_creche_id(auth.uid()))
WITH CHECK (has_role(auth.uid(), 'secretaria'::app_role) AND creche_id = get_user_creche_id(auth.uid()));

-- ============================================
-- 2. feriados: add creche_id (nullable = global)
-- ============================================
ALTER TABLE public.feriados ADD COLUMN IF NOT EXISTS creche_id uuid;

DROP POLICY IF EXISTS "Authenticated can view feriados" ON public.feriados;
DROP POLICY IF EXISTS "Directors can manage feriados" ON public.feriados;
DROP POLICY IF EXISTS "Secretaria can manage feriados" ON public.feriados;

CREATE POLICY "Members can view feriados of their creche or global"
ON public.feriados FOR SELECT TO authenticated
USING (
  creche_id IS NULL
  OR has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (SELECT 1 FROM creche_membros cm WHERE cm.creche_id = feriados.creche_id AND cm.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM criancas c JOIN turmas t ON t.id = c.turma_id WHERE t.creche_id = feriados.creche_id AND c.user_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM crianca_responsaveis cr
    JOIN criancas c ON c.id = cr.crianca_id
    JOIN turmas t ON t.id = c.turma_id
    WHERE cr.responsavel_user_id = auth.uid() AND t.creche_id = feriados.creche_id
  )
);

CREATE POLICY "Directors can manage feriados of their creche"
ON public.feriados FOR ALL TO authenticated
USING (has_role(auth.uid(), 'diretor'::app_role) AND creche_id IS NOT NULL AND is_diretor_of_creche(auth.uid(), creche_id))
WITH CHECK (has_role(auth.uid(), 'diretor'::app_role) AND creche_id IS NOT NULL AND is_diretor_of_creche(auth.uid(), creche_id));

CREATE POLICY "Secretaria can manage feriados of their creche"
ON public.feriados FOR ALL TO authenticated
USING (has_role(auth.uid(), 'secretaria'::app_role) AND creche_id = get_user_creche_id(auth.uid()))
WITH CHECK (has_role(auth.uid(), 'secretaria'::app_role) AND creche_id = get_user_creche_id(auth.uid()));

-- ============================================
-- 3. recados: tighten responsavel turma-level visibility
-- ============================================
DROP POLICY IF EXISTS "Responsáveis can view recados for their crianças" ON public.recados;

CREATE POLICY "Responsáveis can view recados for their crianças"
ON public.recados FOR SELECT TO authenticated
USING (
  -- Direct messages about own child
  (crianca_id IN (SELECT get_crianca_ids_for_responsavel(auth.uid())))
  -- Class-wide messages, only if sent by school staff
  OR (
    turma_id IN (SELECT get_turma_ids_for_responsavel(auth.uid()))
    AND crianca_id IS NULL
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = recados.remetente_user_id
        AND ur.role IN ('educador'::app_role, 'diretor'::app_role, 'admin'::app_role, 'secretaria'::app_role)
    )
  )
);

-- ============================================
-- 4. pickup_photo_audit: explicit deny on direct writes (only triggers/SECURITY DEFINER funcs)
-- ============================================
DROP POLICY IF EXISTS "Block direct inserts on pickup_photo_audit" ON public.pickup_photo_audit;
CREATE POLICY "Block direct inserts on pickup_photo_audit"
ON public.pickup_photo_audit FOR INSERT TO authenticated
WITH CHECK (false);

DROP POLICY IF EXISTS "Block direct updates on pickup_photo_audit" ON public.pickup_photo_audit;
CREATE POLICY "Block direct updates on pickup_photo_audit"
ON public.pickup_photo_audit FOR UPDATE TO authenticated
USING (false);

DROP POLICY IF EXISTS "Block direct deletes on pickup_photo_audit" ON public.pickup_photo_audit;
CREATE POLICY "Block direct deletes on pickup_photo_audit"
ON public.pickup_photo_audit FOR DELETE TO authenticated
USING (false);
