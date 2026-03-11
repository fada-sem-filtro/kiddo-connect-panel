
-- Function to check if user is a responsavel of a crianca (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_responsavel_of_crianca(_user_id uuid, _crianca_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.crianca_responsaveis
    WHERE responsavel_user_id = _user_id AND crianca_id = _crianca_id
  )
$$;

-- Function to get crianca_ids for a responsavel (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_crianca_ids_for_responsavel(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT crianca_id FROM public.crianca_responsaveis
  WHERE responsavel_user_id = _user_id
$$;

-- Function to get turma_ids for a responsavel's crianças (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_turma_ids_for_responsavel(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT DISTINCT c.turma_id
  FROM public.crianca_responsaveis cr
  JOIN public.criancas c ON c.id = cr.crianca_id
  WHERE cr.responsavel_user_id = _user_id
$$;

-- Fix turmas: Responsáveis can view turmas of their crianças (no recursion)
DROP POLICY IF EXISTS "Responsáveis can view turmas of their crianças" ON public.turmas;
CREATE POLICY "Responsáveis can view turmas of their crianças"
ON public.turmas FOR SELECT TO authenticated
USING (id IN (SELECT get_turma_ids_for_responsavel(auth.uid())));

-- Fix criancas: Responsáveis can view their own criancas (no recursion)
DROP POLICY IF EXISTS "Responsáveis can view their own criancas" ON public.criancas;
CREATE POLICY "Responsáveis can view their own criancas"
ON public.criancas FOR SELECT TO authenticated
USING (id IN (SELECT get_crianca_ids_for_responsavel(auth.uid())));

-- Fix crianca_responsaveis: Responsáveis can view their own links (no recursion)
DROP POLICY IF EXISTS "Responsáveis can view their own links" ON public.crianca_responsaveis;
CREATE POLICY "Responsáveis can view their own links"
ON public.crianca_responsaveis FOR SELECT TO authenticated
USING (responsavel_user_id = auth.uid());

-- Fix eventos: Responsáveis can view eventos of their crianças (no recursion)
DROP POLICY IF EXISTS "Responsáveis can view eventos of their crianças" ON public.eventos;
CREATE POLICY "Responsáveis can view eventos of their crianças"
ON public.eventos FOR SELECT TO authenticated
USING (crianca_id IN (SELECT get_crianca_ids_for_responsavel(auth.uid())));

-- Fix creches: Members can view their creches (was using wrong column reference)
DROP POLICY IF EXISTS "Members can view their creches" ON public.creches;
CREATE POLICY "Members can view their creches"
ON public.creches FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.creche_membros cm
  WHERE cm.creche_id = creches.id AND cm.user_id = auth.uid()
));
