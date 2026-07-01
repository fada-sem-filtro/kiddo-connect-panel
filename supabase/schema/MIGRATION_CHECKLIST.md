# Migração para Supabase Externo — Checklist Completo

Projeto de destino: **`rjjzkozvicsnjczlsnjr`**
URL: `https://rjjzkozvicsnjczlsnjr.supabase.co`

Este documento cobre **tudo** que precisa ser feito no projeto Supabase externo para o Agenda Fleur rodar 100%. Siga na ordem — cada etapa depende da anterior.

---

## Pré-requisitos locais

```bash
# Supabase CLI
npm i -g supabase

# Login e link ao projeto externo
supabase login
supabase link --project-ref rjjzkozvicsnjczlsnjr
```

Tenha em mãos, do dashboard do projeto externo (**Project Settings → API**):

- `SUPABASE_URL` = `https://rjjzkozvicsnjczlsnjr.supabase.co`
- `anon key` (publishable)
- `service_role key` (secreto — nunca commitar)
- JWKS (Auth → JWT Keys)
- Database connection string (Project Settings → Database → Connection string, `postgres://` URI)

---

## 1. Extensions

No **SQL Editor** do projeto externo, rode:

```sql
create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";
create extension if not exists pg_trgm;
create extension if not exists citext;
create extension if not exists pg_cron;
create extension if not exists pg_net;
create extension if not exists pgmq;
create extension if not exists vault;
```

## 2. Aplicar schema consolidado

Cole e execute `supabase/schema/schema.sql` no SQL Editor. Ele cria:
- 60+ tabelas (`profiles`, `creches`, `criancas`, `turmas`, `eventos`, `recados`, `financial_*`, `saas_*`, `blog_*`, etc.)
- Enums (`app_role`, tipos de evento, status financeiros, etc.)
- 25+ funções `SECURITY DEFINER` (has_role, can_access_crianca, is_diretor_of_creche, etc.)
- Triggers de `updated_at`, notificações, auditoria de fotos
- RLS + policies em todas as tabelas
- GRANTs para `authenticated`, `anon`, `service_role`
- Views financeiras e de blog

Após rodar, valide:
```sql
select count(*) from information_schema.tables where table_schema = 'public';
-- deve retornar ~60
```

## 3. Trigger em `auth.users` (fora do schema.sql)

O `schema.sql` não pode tocar no schema `auth`. Crie manualmente:

```sql
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

## 4. Vault secret para envio de emails

O trigger `email_queue_wake` chama `process-email-queue` autenticado com o service role via Vault:

```sql
select vault.create_secret(
  '<SERVICE_ROLE_KEY do projeto externo>',
  'email_queue_service_role_key'
);
```

## 5. Storage buckets

Criar via SQL (ou pelo dashboard → Storage):

```sql
insert into storage.buckets (id, name, public) values
  ('email-assets', 'email-assets', true),
  ('creche-logos', 'creche-logos', true),
  ('blog-imagens', 'blog-imagens', true),
  ('recado-anexos', 'recado-anexos', false),
  ('atividades-arquivos', 'atividades-arquivos', false),
  ('authorized-pickups-photos', 'authorized-pickups-photos', false),
  ('inter-certificates', 'inter-certificates', false),
  ('saas-inter-certificates', 'saas-inter-certificates', false)
on conflict (id) do nothing;
```

As policies em `storage.objects` já vêm no `schema.sql`. Se algo faltar, revise as migrations originais em `supabase/migrations/` filtrando por `storage.objects`.

**Migrar arquivos existentes** (opcional, se quiser preservar uploads):

```bash
# Para cada bucket
supabase storage cp -r ss:///<bucket>/ ss:///<bucket>/ \
  --experimental \
  --source-project <origem> --dest-project rjjzkozvicsnjczlsnjr
```

Ou usar script Node com service role de origem/destino chamando `storage.from(bucket).download` + `.upload`.

## 6. Auth Providers

No dashboard do projeto externo → **Authentication**:

### Providers → Email
- ✅ Enable Email provider
- ❌ **Desabilitar** "Confirm email" (usuários são criados pré-confirmados via `create-user`)
- ✅ Enable "Secure email change"

### Providers → Google
- Client ID e Client Secret próprios (criar no Google Cloud Console)
- Authorized redirect URI no Google: `https://rjjzkozvicsnjczlsnjr.supabase.co/auth/v1/callback`

### URL Configuration
- **Site URL**: `https://agendafleur.app`
- **Redirect URLs**:
  ```
  https://agendafleur.app/**
  https://www.agendafleur.app/**
  https://agendafleur.lovable.app/**
  http://localhost:8080/**
  http://localhost:5173/**
  ```

### Auth Hooks → Send Email Hook
- **HTTP Hook URL**: `https://rjjzkozvicsnjczlsnjr.supabase.co/functions/v1/auth-email-hook`
- Copie o **HTTP Hook Secret** gerado e salve como secret `SEND_EMAIL_HOOK_SECRET` (passo 8).

### Email Templates
Deixe os templates padrão vazios/mínimos — o `auth-email-hook` renderiza tudo via React Email + Resend.

## 7. Deploy das Edge Functions

Use o script automatizado incluso:

```bash
bash supabase/schema/deploy-functions.sh rjjzkozvicsnjczlsnjr
```

Ou manualmente:

```bash
supabase functions deploy --project-ref rjjzkozvicsnjczlsnjr
```

O `supabase/config.toml` já define `verify_jwt = false` nas funções corretas — o CLI respeita.

## 8. Edge Function Secrets

No dashboard → **Edge Functions → Manage secrets**, adicione:

### Automáticos (Supabase preenche)
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL` — já vêm por padrão em novos projetos.

### Obrigatórios (adicionar manualmente)
| Secret | Origem/valor |
|---|---|
| `SUPABASE_PUBLISHABLE_KEY` | mesma anon key |
| `SUPABASE_PUBLISHABLE_KEYS` | mesma anon key (compat) |
| `SUPABASE_SECRET_KEYS` | mesmo service role (compat) |
| `SUPABASE_JWKS` | Auth → JWT Keys → JWKS URL/JSON |
| `RESEND_API_KEY` | Dashboard Resend (mesma conta atual) |
| `ENCRYPTION_KEY` | **Mesmo valor do projeto atual** — senão certificados Inter criptografados não descriptografam |
| `BOOTSTRAP_SECRET` | Random 32+ chars — protege `bootstrap-admin` |
| `PROCESS_EMAIL_SECRET` | Random 32+ chars — auth interna do `process-email-queue` |
| `SEND_EMAIL_HOOK_SECRET` | Copiado do Auth Hook (passo 6) |
| `LOVABLE_API_KEY` | Se usar IA Gateway — senão remova chamadas do código |

## 9. Cron jobs (pg_cron)

O trigger `email_queue_wake` agenda `process-email-queue` sob demanda. Confirme após primeiro envio:

```sql
select jobname, schedule, active from cron.job;
```

Jobs financeiros do SaaS (agendar manualmente se quiser recorrência automática):

```sql
select cron.schedule(
  'saas-generate-monthly-invoices',
  '0 3 1 * *',  -- todo dia 1 às 03:00
  $$ select net.http_post(
    url := 'https://rjjzkozvicsnjczlsnjr.supabase.co/functions/v1/saas-generate-monthly-invoices',
    headers := jsonb_build_object('Content-Type','application/json'),
    body := '{}'::jsonb
  ); $$
);

select cron.schedule(
  'saas-mark-overdue',
  '0 4 * * *',  -- diário às 04:00
  $$ select net.http_post(
    url := 'https://rjjzkozvicsnjczlsnjr.supabase.co/functions/v1/saas-mark-overdue',
    headers := jsonb_build_object('Content-Type','application/json'),
    body := '{}'::jsonb
  ); $$
);
```

## 10. Dados

Escolha um caminho:

### (a) Começar zerado
Após schema aplicado, chame `bootstrap-admin` para criar o primeiro admin:

```bash
curl -X POST https://rjjzkozvicsnjczlsnjr.supabase.co/functions/v1/bootstrap-admin \
  -H "Content-Type: application/json" \
  -H "x-bootstrap-secret: <BOOTSTRAP_SECRET>" \
  -d '{"email":"admin@agendafleur.app","password":"fleur@2026","nome":"Admin"}'
```

### (b) Migrar dados atuais
1. No projeto **atual**: **Cloud → Advanced settings → Export data** → baixe o SQL.
2. **Recriar `auth.users`** — o export não inclui. Use Admin API preservando UUIDs originais:
   ```ts
   await admin.auth.admin.createUser({
     id: originalUuid,        // mantém FK
     email, password: 'fleur@2026',
     email_confirm: true,
     user_metadata: { must_change_password: true, nome }
   })
   ```
3. Restaurar tabelas na ordem (FKs):
   ```
   profiles → user_roles → creches → creche_membros →
   turmas → turma_educadores → materias → grade_aulas →
   criancas → crianca_responsaveis → authorized_pickups →
   eventos → recados → notificacoes →
   financial_* → saas_* → blog_* → demais
   ```
4. Reset de sequences (se algum id serial existir):
   ```sql
   select setval(pg_get_serial_sequence(quote_ident(t.table_name), 'id'),
                 coalesce(max(id), 1))
   from information_schema.tables t
   where t.table_schema = 'public';
   ```

## 11. Webhooks externos (reapontar)

Trocar callback URL nos serviços de terceiros:

| Serviço | Nova URL |
|---|---|
| Banco Inter (cobranças escola) | `https://rjjzkozvicsnjczlsnjr.supabase.co/functions/v1/inter-webhook` |
| Banco Inter (SaaS) | `.../functions/v1/saas-inter-webhook` |
| Asaas | `.../functions/v1/asaas-webhook` |

Após trocar credenciais Inter, rode `inter-register-webhook` (via UI Financeiro → Configurações) para registrar automaticamente na API do Inter.

## 12. Frontend (`.env` + `client.ts`)

⚠️ **Estes arquivos são gerenciados pelo Lovable Cloud e podem ser sobrescritos em builds.** Se você seguiu por aqui, provavelmente já saiu do Lovable Cloud manualmente ou está em projeto Vite standalone.

`.env`:
```
VITE_SUPABASE_URL="https://rjjzkozvicsnjczlsnjr.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="<anon key do projeto externo>"
VITE_SUPABASE_PROJECT_ID="rjjzkozvicsnjczlsnjr"
```

`src/integrations/supabase/client.ts` já lê essas envs — não precisa editar o código, só as variáveis.

## 13. Regenerar tipos TypeScript

```bash
supabase gen types typescript --project-id rjjzkozvicsnjczlsnjr \
  > src/integrations/supabase/types.ts
```

---

## Validação pós-migração

Cheque estes fluxos após terminar tudo:

- [ ] Login admin funciona
- [ ] Criar/editar escola (RLS OK, trigger `handle_new_user` OK)
- [ ] Signup novo usuário → email chega via Resend (auth hook OK)
- [ ] Reset de senha → email chega
- [ ] Criar recado → notificações aparecem para responsáveis
- [ ] Upload foto de retirada → bucket funciona + linha em `pickup_photo_audit`
- [ ] Registrar evento tipo `MEDICAMENTO` com horário → notificação para educador
- [ ] Gerar fatura Inter → certificado descriptografa (valida `ENCRYPTION_KEY`)
- [ ] Webhook Inter chega e atualiza `financial_invoices`
- [ ] `select * from cron.job;` mostra `process-email-queue` ativo após primeiro envio

---

## Rollback

Se der ruim, você ainda tem os arquivos `supabase/migrations/*.sql` em ordem cronológica — pode recriar em outro projeto. Faça **backup do SQL export** antes de qualquer coisa.
