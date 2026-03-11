-- Create a SECURITY DEFINER function to check if two users share a creche
CREATE OR REPLACE FUNCTION public.is_in_same_creche(_user_id uuid, _other_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM creche_membros a
    JOIN creche_membros b ON a.creche_id = b.creche_id
    WHERE a.user_id = _user_id AND b.user_id = _other_user_id
  )
$$;

-- Fix profiles: Drop and recreate the director policy using SECURITY DEFINER functions
DROP POLICY IF EXISTS "Directors can view profiles of creche members" ON public.profiles;
CREATE POLICY "Directors can view profiles of creche members"
ON public.profiles FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'diretor'::app_role)
  AND is_in_same_creche(auth.uid(), profiles.user_id)
);

-- Fix user_roles: Drop and recreate the director policy using SECURITY DEFINER functions
DROP POLICY IF EXISTS "Directors can view roles of creche members" ON public.user_roles;
CREATE POLICY "Directors can view roles of creche members"
ON public.user_roles FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'diretor'::app_role)
  AND is_in_same_creche(auth.uid(), user_roles.user_id)
  AND role <> 'admin'::app_role
);