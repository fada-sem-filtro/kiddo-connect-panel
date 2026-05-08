## Reestruturação Financeira — Banco Inter PJ (Provider Architecture)

### Contexto atual
O projeto já possui:
- Módulo financeiro **das escolas** (`financial_accounts`, `financial_invoices`) com integração **Inter** parcial e **Asaas** (`supabase/functions/inter-*`, `asaas-*`, `_shared/inter.ts`, `_shared/asaas.ts`)
- Módulo **SaaS** Agenda Fleur → Escolas (`saas_*` tables, `saas-inter-*` functions) — recém-criado, isolado
- UI: `SchoolFinancialManagementPage`, `BancoInterTab`, `CobrancasInterTab`, `LogsInterTab`, `AdminFinanceiroGlobalPage`

Esta reestruturação foca **apenas no financeiro DAS ESCOLAS** (mensalidades de alunos). O módulo SaaS Agenda Fleur permanece intocado.

---

### 1. Camada de abstração Provider (novo)
Criar `supabase/functions/_shared/providers/`:
- `types.ts` — interface `FinanceProvider` com métodos: `authenticate`, `createCharge`, `getCharge`, `cancelCharge`, `listCharges`, `getBalance`, `getStatement`, `handleWebhook`
- `inter-provider.ts` — implementação Inter PJ (refatora `_shared/inter.ts` para a interface)
- `asaas-provider.ts` — wrapper Asaas existente na mesma interface
- `factory.ts` — `getProvider(crecheId)` lê `creches.financial_provider` e retorna instância

Schema `creches.financial_provider` (`'inter'|'asaas'|null`) já existe.

### 2. Banco Inter PJ — APIs oficiais
Refatorar/expandir `_shared/inter.ts` cobrindo endpoints oficiais (`cdpj.partners.bancointer.com.br`):
- **OAuth2** mTLS — já existe; adicionar retry com backoff, rate-limit handling, refresh proativo (cache existe)
- **Cobrança v3** (boleto + PIX híbrido) — `POST/GET/PATCH /cobranca/v3/cobrancas/...` — já parcial, completar segunda via PDF (`/pdf`), atualização vencimento, cancelamento
- **Pix CobV** (com vencimento) — `PUT /pix/v2/cobv/{txid}` — novo
- **Pix Cob imediato** — `PUT /pix/v2/cob/{txid}` — novo
- **Extrato** — `GET /banking/v2/extrato` e `/extrato/completo` — novo
- **Saldo** — `GET /banking/v2/saldo` — novo
- **Webhooks** — `PUT /cobranca/v3/cobrancas/webhook` + `/pix/v2/webhook` — registro programático

### 3. Edge Functions (novas/refatoradas)
Manter prefixo `inter-*` existente, adicionar:
- `inter-create-pix` (Pix imediato/CobV)
- `inter-get-pdf` (segunda via boleto)
- `inter-update-due-date`
- `inter-balance` / `inter-statement`
- `inter-register-webhook` (provisiona webhooks Inter automaticamente após connect)
- `inter-webhook` — completar: validação de autenticidade (mTLS client cert verification via header), idempotência (dedupe por `txid`+`endToEndId` em `inter_webhook_logs`), conciliação automática
- `finance-create-charge` — fachada que usa ProviderFactory (substitui chamadas diretas a `inter-create-invoice`/`asaas-create-payment` no frontend)

### 4. Banco de dados (migration)
- Adicionar a `financial_accounts`: `webhook_registered_at`, `last_auth_at`, `last_auth_error`
- Nova tabela `inter_audit_logs` (creche_id, action, status, request_id, error, payload, created_at) — RLS: admin/diretor da creche leem
- Nova tabela `inter_balances` (cache saldo) — opcional
- Adicionar a `financial_invoices`: `pix_txid`, `pix_qrcode_image` (url storage), `boleto_pdf_path`
- Habilitar `pgmq` para fila `inter_webhook_queue` (processamento assíncrono)
- Cron `pg_cron` já existe para sync; adicionar job de reconciliação diária

### 5. Frontend — refatoração
- `SchoolFinancialManagementPage`: detectar `creche.financial_provider`, exibir abas dinâmicas (esconder Inter quando provider=asaas e vice-versa)
- `BancoInterTab`: completar — upload cert/key, client_id/secret, conta_corrente, ambiente (sandbox/prod toggle), botão "Testar conexão" (chama `inter-status`), botão "Registrar webhook", status visual, logs recentes
- `CobrancasInterTab`: ações — gerar segunda via PDF, atualizar vencimento, cancelar, ver QR Code Pix com copia-e-cola
- Nova `ExtratoInterTab` — saldo + extrato com filtro de período
- Nova `DashboardFinanceiroTab` — KPIs (MRR, recebido hoje, inadimplência, pendente) + gráficos (recharts já no projeto)
- `LogsInterTab`: já existe — apontar para `inter_audit_logs`
- Permissões: usar `is_financeiro_admin` (existe) — admin/diretor configuram; secretaria só visualiza
- Hook `useFinancialProvider` (existe) — expandir para retornar capabilities do provider ativo

### 6. Sandbox vs Produção
- Coluna `financial_accounts.environment` já existe (`sandbox|production`)
- Base URL alternada em `_shared/inter.ts`: `cdpj-sandbox.partners.uatinter.co` vs `cdpj.partners.bancointer.com.br`
- Toggle visível na UI Banco Inter

### 7. Segurança
- Credenciais já criptografadas (AES-256-GCM via `ENCRYPTION_KEY`)
- Certificados em bucket privado `inter-certificates` (existe)
- Frontend nunca recebe secrets — apenas status/metadata
- Webhook valida assinatura via segredo URL (`webhook_secret` existe na tabela)

### 8. Isolamento de providers
Regra de UI: `financial_provider` da escola determina abas/ações exibidas. Backend rejeita operações cruzadas (ex: `inter-create-invoice` falha se provider≠inter).

### 9. Conciliação automática
Webhook Inter → identifica invoice por `external_id`/`txid` → atualiza `status=RECEBIDO`, `paid_at` → trigger Postgres já existente notifica responsáveis.

---

### Arquivos previstos (~25)
**Migration:** 1 (campos + tabelas auditoria + pgmq)
**Edge functions novas:** `inter-create-pix`, `inter-get-pdf`, `inter-update-due-date`, `inter-balance`, `inter-statement`, `inter-register-webhook`, `finance-create-charge` (7)
**Edge functions refatoradas:** `inter-webhook`, `inter-create-invoice`, `inter-status`, `inter-connect` (4)
**Shared:** `_shared/providers/{types,inter-provider,asaas-provider,factory}.ts` (4), expansão de `_shared/inter.ts`
**Frontend:** `BancoInterTab`, `CobrancasInterTab`, `ExtratoInterTab` (novo), `DashboardFinanceiroTab` (novo), `SchoolFinancialManagementPage`, `useFinancialProvider`, novo `useInterCapabilities`

### Fora de escopo (não tocar)
- Módulo SaaS Agenda Fleur (`saas_*`)
- Auth, escolas, alunos, turmas, recados, calendário, atividades pedagógicas
- Sidebar/navegação geral
- Branding