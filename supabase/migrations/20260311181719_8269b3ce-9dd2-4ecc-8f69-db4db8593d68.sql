-- Allow directors to view profiles of members in their creche
CREATE POLICY "Directors can view profiles of creche members"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.creche_membros my_membership
    JOIN public.creche_membros their_membership ON my_membership.creche_id = their_membership.creche_id
    WHERE my_membership.user_id = auth.uid()
      AND my_membership.is_diretor = true
      AND their_membership.user_id = profiles.user_id
  )
);

-- Allow directors to view roles of members in their creche (excluding admins)
CREATE POLICY "Directors can view roles of creche members"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.creche_membros my_membership
    JOIN public.creche_membros their_membership ON my_membership.creche_id = their_membership.creche_id
    WHERE my_membership.user_id = auth.uid()
      AND my_membership.is_diretor = true
      AND their_membership.user_id = user_roles.user_id
  )
  AND role != 'admin'
);