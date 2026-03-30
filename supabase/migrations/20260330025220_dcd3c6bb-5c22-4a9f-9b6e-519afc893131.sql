
-- Create a helper function to get the creche_id for a user (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.get_user_creche_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT creche_id FROM public.creche_membros
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Drop the recursive policy
DROP POLICY IF EXISTS "Secretaria can view membros of their creche" ON public.creche_membros;

-- Recreate with non-recursive approach
CREATE POLICY "Secretaria can view membros of their creche"
ON public.creche_membros FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'secretaria') AND
  creche_id = get_user_creche_id(auth.uid())
);
