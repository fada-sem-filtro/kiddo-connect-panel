-- Update is_diretor_of_creche to check user_roles instead of is_diretor flag
CREATE OR REPLACE FUNCTION public.is_diretor_of_creche(_user_id uuid, _creche_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.creche_membros cm
    JOIN public.user_roles ur ON ur.user_id = cm.user_id
    WHERE cm.user_id = _user_id
      AND cm.creche_id = _creche_id
      AND ur.role = 'diretor'
  )
$$;