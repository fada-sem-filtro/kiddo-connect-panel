-- Funções que são APENAS triggers do Postgres — revogar EXECUTE de todos os roles da API
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_admin_on_suporte() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_medication_reminder() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_recado() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_responsaveis_on_evento() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- Garante que anon não pode chamar nenhum helper (mantém só authenticated + service_role, exigidos pelas RLS)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_creche_id(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_creche_id_from_turma(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_crianca_ids_for_responsavel(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_turma_ids_for_responsavel(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_diretor_of_creche(uuid, uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_educador_of_turma(uuid, uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_in_same_creche(uuid, uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_member_of_turma_creche(uuid, uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_responsavel_of_crianca(uuid, uuid) FROM anon, PUBLIC;