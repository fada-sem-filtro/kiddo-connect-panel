-- Revogar EXECUTE de anon em todas as funções SECURITY DEFINER (mantém authenticated)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_user_creche_id(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_creche_id_from_turma(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_crianca_ids_for_responsavel(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_turma_ids_for_responsavel(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_diretor_of_creche(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_educador_of_turma(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_in_same_creche(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_member_of_turma_creche(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_responsavel_of_crianca(uuid, uuid) FROM anon, public;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_creche_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_creche_id_from_turma(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_crianca_ids_for_responsavel(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_turma_ids_for_responsavel(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_diretor_of_creche(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_educador_of_turma(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_in_same_creche(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_member_of_turma_creche(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_responsavel_of_crianca(uuid, uuid) TO authenticated;

-- Tornar privados os buckets sensíveis (mantém logos e email-assets públicos)
UPDATE storage.buckets SET public = false
WHERE id IN ('recado-anexos', 'authorized-pickups-photos', 'atividades-arquivos');