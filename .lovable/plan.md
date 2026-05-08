# Financeiro SaaS Agenda Fleur — Banco Inter PJ

## Objetivo
Criar um módulo administrativo (acessível somente ao admin master) para cobrar as mensalidades SaaS das escolas usando a conta Banco Inter PJ da própria Agenda Fleur. Totalmente isolado do módulo financeiro existente das escolas (Asaas/Inter por escola).

## Princípio de isolamento
- Tabelas com prefixo `saas_*` (não reaproveitar `financial_*`)
- Edge functions com prefixo `saas-inter-*` (não reaproveitar `inter-*`)
- Bucket de certificados separado: `saas-inter-certificates`
- Provider/credenciais únicas e globais (1 conta Inter PJ da plataforma)
- Acesso restrito a `role = admin`

---

## 1. Banco de dados (migration)

### Tabelas
- **`saas_financial_account`** — única linha (singleton) com a conta Inter PJ da Agenda Fleur
  - `provider` ('inter'), `client_id`, `encrypted_client_secret` (bytea), `client_secret_iv`, `client_secret_tag`, `certificate_path`, `private_key_path`, `conta_corrente`, `environment` (sandbox/production), `webhook_secret` (uuid), `connected` (bool), `last_validation`, `last_error`
- **`saas_plans`** — catálogo de planos
  - `code` (trial/basico/premium/enterprise), `name`, `monthly_price`, `features` (jsonb), `active`
- **`saas_subscriptions`** — assinatura por escola
  - `creche_id` (FK creches), `plan_id` (FK saas_plans), `status` (active/trialing/past_due/canceled), `start_date`, `next_billing_date`, `trial_ends_at`, `monthly_amount`, `due_day` (1-28)
- **`saas_invoices`** — mensalidades emitidas
  - `subscription_id`, `creche_id`, `external_id` (Inter), `invoice_number`, `amount`, `due_date`, `status` (PENDING/A_RECEBER/RECEBIDO/ATRASADO/CANCELADO), `pix_qrcode`, `pix_copy_paste`, `boleto_pdf_url`, `linha_digitavel`, `paid_at`, `cancelled_at`, `raw_payload` (jsonb)
- **`saas_transactions`** — pagamentos confirmados
  - `invoice_id`, `transaction_type` (PAYMENT/REFUND), `amount`, `status`, `raw_payload`, `paid_at`
- **`saas_webhook_logs`** — auditoria
  - `event`, `external_id`, `payload` (jsonb), `processed`, `error`, `received_at`

### RLS
Todas as tabelas: somente `has_role(auth.uid(), 'admin')` para ALL. `saas_webhook_logs` e `saas_invoices` aceitam INSERT do service role (webhook).

### Seeds
Inserir 4 planos padrão (Trial R$0, Básico, Premium, Enterprise).

---

## 2. Storage
Bucket privado **`saas-inter-certificates`** com política: somente service role lê/escreve.

---

## 3. Edge Functions (prefixo `saas-inter-*`)
- `saas-inter-connect` — admin salva client_id/secret + uploads de .crt/.key (criptografa secret com `ENCRYPTION_KEY` AES-256-GCM, salva certs no bucket)
- `saas-inter-status` — testa OAuth2 + mTLS, retorna `connected` + `last_validation`
- `saas-inter-disconnect` — limpa credenciais
- `saas-inter-create-invoice` — gera cobrança Inter (PIX + boleto) para uma `saas_invoice`
- `saas-inter-get-invoice` — consulta detalhe (status, QR, PDF)
- `saas-inter-cancel-invoice` — cancela cobrança no Inter
- `saas-inter-sync-invoices` — varre invoices abertas e atualiza status
- `saas-inter-webhook` — recebe callbacks do Inter (verify_jwt=false, validado por `webhook_secret` na URL); grava em `saas_webhook_logs` e atualiza invoice + cria transaction
- `saas-generate-monthly-invoices` — job: para cada subscription `active`, cria `saas_invoice` do mês corrente e dispara `saas-inter-create-invoice`
- `saas-billing-reminders` — job: envia lembretes (3 dias antes / vencidas) via Resend
- `saas-mark-overdue` — job: marca invoices vencidas + bloqueia escolas inadimplentes

### Shared
`supabase/functions/_shared/saas-inter.ts` — cópia adaptada de `_shared/inter.ts` mas lê de `saas_financial_account` (singleton). Não importar do shared antigo para garantir isolamento.

---

## 4. Cron jobs (pg_cron + pg_net)
- `saas-generate-invoices` — diário 03:00
- `saas-billing-reminders` — diário 09:00
- `saas-mark-overdue` — diário 00:30
- `saas-inter-sync` — a cada 30 min

---

## 5. Frontend (admin)

### Rotas
- `/admin/saas-financeiro` — dashboard principal com tabs

### Sidebar
Adicionar grupo "Administração → Financeiro SaaS" para `role=admin` com itens: Dashboard, Escolas, Mensalidades, Cobranças, Inadimplência, Relatórios, Banco Inter PJ.

### Páginas/Tabs
- **Dashboard**: cards (MRR, receita mês, recebido, em aberto, taxa inadimplência), gráfico de receita 6 meses, top inadimplentes
- **Escolas**: tabela com plano, status assinatura, próxima cobrança, ações (alterar plano, suspender, gerar cobrança avulsa)
- **Mensalidades** (subscriptions): criar/editar assinatura por escola, definir plano + dia de vencimento
- **Cobranças** (invoices): tabela com filtros, modal com QR/PIX/Boleto, botões cancelar/sincronizar/reprocessar
- **Inadimplência**: lista de escolas com invoices vencidas, ação enviar lembrete
- **Relatórios**: exportar CSV de invoices/transactions por período
- **Banco Inter PJ**: configuração (client_id, secret, upload .crt/.key, ambiente, testar conexão) + logs de webhook

### Componentes reutilizados
shadcn/ui (Card, Table, Tabs, Dialog, Badge), lucide-icons, padrão visual do `SchoolFinancialManagementPage`.

---

## 6. Bloqueio de funcionalidades premium
Hook `useSaasSubscription(creche_id)` retorna `{ status, isOverdue, plan }`. Componentes premium checam e exibem badge/aviso quando `status in ('past_due','canceled')`.

---

## 7. Segredos necessários
Já existentes: `ENCRYPTION_KEY`, `RESEND_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. Não há novos secrets — credenciais Inter ficam no DB cifradas.

---

## Entregáveis
1. Migration (tabelas + RLS + seeds + bucket)
2. 10 edge functions com config.toml atualizado
3. Cron jobs agendados
4. 7 páginas/tabs no admin + sidebar
5. Hook de bloqueio premium

Tempo estimado: ~30 arquivos novos/editados.