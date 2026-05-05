
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _caller uuid := auth.uid();
BEGIN
  -- Allow when called without an auth context (RLS internal / service role)
  IF _caller IS NOT NULL
     AND _caller <> _user_id
     AND NOT EXISTS (
       SELECT 1 FROM public.user_roles
       WHERE user_id = _caller AND role = 'admin'::app_role
     )
  THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _caller uuid := auth.uid();
  _role app_role;
BEGIN
  IF _caller IS NOT NULL
     AND _caller <> _user_id
     AND NOT EXISTS (
       SELECT 1 FROM public.user_roles
       WHERE user_id = _caller AND role = 'admin'::app_role
     )
  THEN
    RETURN NULL;
  END IF;

  SELECT role INTO _role FROM public.user_roles
  WHERE user_id = _user_id LIMIT 1;
  RETURN _role;
END;
$$;
