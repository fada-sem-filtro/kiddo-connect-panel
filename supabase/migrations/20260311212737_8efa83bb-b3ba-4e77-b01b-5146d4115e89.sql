-- Update profiles RLS for directors to use role instead of is_diretor flag
DROP POLICY IF EXISTS "Directors can view profiles of creche members" ON public.profiles;
CREATE POLICY "Directors can view profiles of creche members"
ON public.profiles FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM creche_membros my_membership
    JOIN creche_membros their_membership ON my_membership.creche_id = their_membership.creche_id
    JOIN user_roles ur ON ur.user_id = my_membership.user_id
    WHERE my_membership.user_id = auth.uid()
      AND ur.role = 'diretor'
      AND their_membership.user_id = profiles.user_id
  )
);

-- Update user_roles RLS for directors to use role instead of is_diretor flag
DROP POLICY IF EXISTS "Directors can view roles of creche members" ON public.user_roles;
CREATE POLICY "Directors can view roles of creche members"
ON public.user_roles FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM creche_membros my_membership
    JOIN creche_membros their_membership ON my_membership.creche_id = their_membership.creche_id
    JOIN user_roles my_role ON my_role.user_id = my_membership.user_id
    WHERE my_membership.user_id = auth.uid()
      AND my_role.role = 'diretor'
      AND their_membership.user_id = user_roles.user_id
  )
  AND role <> 'admin'
);