# Schema consolidado — Agenda Fleur

`schema.sql` é a concatenação ordenada de **todas as migrations** de `supabase/migrations/`, precedida das extensões base (`pgcrypto`, `uuid-ossp`, `pg_trgm`, `citext`).

## O que contém
Tudo que existe hoje no banco de produção:
- **Extensions**, **ENUMs** (`app_role`, tipos de evento, etc.)
- **Tabelas** do `public` (60+) com PK UUID, `created_at`/`updated_at` e triggers de `updated_at`
- **Foreign Keys**, **CHECK constraints**, **UNIQUE**, **índices** (inclusive parciais e GIN)
- **Funções `SECURITY DEFINER`** (`has_role`, `get_user_role`, `is_diretor_of_creche`, `can_access_crianca`, `is_financeiro_admin`, `notify_*`, `handle_new_user`, …)
- **Triggers** (auditoria de fotos, notificações, updated_at, fila de emails via pgmq)
- **RLS habilitado** em todas as tabelas + **policies** por perfil (`admin`, `diretor`, `secretaria`, `educador`, `responsavel`, `aluno`)
- **GRANTs** para `authenticated`, `anon` e `service_role`
- Views auxiliares e configurações da fila `pgmq` de emails

## Como aplicar em um banco novo
1. Crie um projeto Supabase vazio.
2. Abra o SQL Editor e cole o conteúdo de `schema.sql` (ou rode `psql "$DATABASE_URL" -f schema.sql`).
3. Execute uma única vez. Como as migrations usam `CREATE OR REPLACE`, `IF NOT EXISTS` e `DROP POLICY IF EXISTS`, reexecuções são majoritariamente idempotentes.
4. Crie os **Storage buckets** (não vêm no SQL):
   `email-assets`, `creche-logos`, `blog-imagens` (públicos)
   `recado-anexos`, `atividades-arquivos`, `authorized-pickups-photos`, `inter-certificates`, `saas-inter-certificates` (privados)
5. Configure os **Auth providers** e defina os **secrets** das Edge Functions (`RESEND_API_KEY`, `ENCRYPTION_KEY`, `BOOTSTRAP_SECRET`, `PROCESS_EMAIL_SECRET`, chaves do Inter, etc.).
6. Faça deploy das Edge Functions em `supabase/functions/`.

## Dados
Este arquivo é **schema-only**. Para exportar o conteúdo das tabelas use
**Cloud → Advanced settings → Export data** no Lovable, que gera o dump completo com dados preservando IDs e relacionamentos.

## Observações
- Não há necessidade de recriar o schema `auth` — o Supabase provê.
- `handle_new_user` depende do trigger `on_auth_user_created` em `auth.users`; se aplicar em outro projeto, recrie esse trigger manualmente no dashboard Auth Hooks.
- A ordem cronológica das migrations resolve corretamente todas as dependências (tabelas antes de FKs, funções antes das policies que as usam).
