
CREATE TABLE public.creche_membros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creche_id uuid NOT NULL REFERENCES public.creches(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_diretor boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(creche_id, user_id)
);

ALTER TABLE public.creche_membros ENABLE ROW LEVEL SECURITY;

-- Members can view their creches
CREATE POLICY "Members can view their creches"
  ON public.creches FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.creche_membros cm
      WHERE cm.creche_id = id AND cm.user_id = auth.uid()
    )
  );

-- Security definer function to check diretor status (avoids recursion)
CREATE OR REPLACE FUNCTION public.is_diretor_of_creche(_user_id uuid, _creche_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.creche_membros
    WHERE user_id = _user_id
      AND creche_id = _creche_id
      AND is_diretor = true
  )
$$;

-- Admins can manage all membros
CREATE POLICY "Admins can manage all membros"
  ON public.creche_membros FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Diretores can manage membros of their creche
CREATE POLICY "Diretores can manage membros of their creche"
  ON public.creche_membros FOR ALL
  TO authenticated
  USING (public.is_diretor_of_creche(auth.uid(), creche_id))
  WITH CHECK (public.is_diretor_of_creche(auth.uid(), creche_id));

-- Users can view their own membership
CREATE POLICY "Users can view own membership"
  ON public.creche_membros FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
