
-- Add RLS policies for secretaria role on key tables
-- Secretaria members are in creche_membros, so existing "Members can view" policies cover SELECT.
-- We need additional policies for tables where secretaria needs write access.

-- criancas: secretaria can manage criancas of their creche
CREATE POLICY "Secretaria can manage criancas of their creche"
ON public.criancas FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'secretaria') AND 
  is_member_of_turma_creche(auth.uid(), turma_id)
)
WITH CHECK (
  has_role(auth.uid(), 'secretaria') AND 
  is_member_of_turma_creche(auth.uid(), turma_id)
);

-- presencas: secretaria can manage
CREATE POLICY "Secretaria can manage presencas of their creche"
ON public.presencas FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'secretaria') AND EXISTS (
    SELECT 1 FROM criancas c
    JOIN turmas t ON t.id = c.turma_id
    JOIN creche_membros cm ON cm.creche_id = t.creche_id
    WHERE c.id = presencas.crianca_id AND cm.user_id = auth.uid()
  )
)
WITH CHECK (
  has_role(auth.uid(), 'secretaria') AND EXISTS (
    SELECT 1 FROM criancas c
    JOIN turmas t ON t.id = c.turma_id
    JOIN creche_membros cm ON cm.creche_id = t.creche_id
    WHERE c.id = presencas.crianca_id AND cm.user_id = auth.uid()
  )
);

-- eventos: secretaria can manage
CREATE POLICY "Secretaria can manage eventos of their creche"
ON public.eventos FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'secretaria') AND EXISTS (
    SELECT 1 FROM criancas c
    JOIN turmas t ON t.id = c.turma_id
    JOIN creche_membros cm ON cm.creche_id = t.creche_id
    WHERE c.id = eventos.crianca_id AND cm.user_id = auth.uid()
  )
)
WITH CHECK (
  has_role(auth.uid(), 'secretaria') AND EXISTS (
    SELECT 1 FROM criancas c
    JOIN turmas t ON t.id = c.turma_id
    JOIN creche_membros cm ON cm.creche_id = t.creche_id
    WHERE c.id = eventos.crianca_id AND cm.user_id = auth.uid()
  )
);

-- turmas: secretaria can view turmas of their creche (already covered by member policies for SELECT on turmas)
-- Let's check if turmas has a member policy... it doesn't. Add one.
CREATE POLICY "Secretaria can view turmas of their creche"
ON public.turmas FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'secretaria') AND EXISTS (
    SELECT 1 FROM creche_membros cm
    WHERE cm.creche_id = turmas.creche_id AND cm.user_id = auth.uid()
  )
);

-- profiles: secretaria can view profiles of their creche
CREATE POLICY "Secretaria can view profiles of creche members"
ON public.profiles FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'secretaria') AND (
    user_id = auth.uid() OR is_in_same_creche(auth.uid(), user_id)
  )
);
