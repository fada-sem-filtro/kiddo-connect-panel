
DROP VIEW IF EXISTS public.financial_settings_safe;
REVOKE EXECUTE ON FUNCTION public.is_financeiro_admin(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_financeiro_admin(uuid, uuid) TO authenticated, service_role;
