
# Módulo Financeiro Asaas — Plano de Execução

## 1. Escopo confirmado
- Remover módulo "Boletos" (páginas, modais, tabela `boletos`, rotas, links sidebar).
- Criar módulo **Financeiro** com submenus: Dashboard, Mensalidades, Cobranças, Inadimplência, Integração Asaas, Relatórios.
- Cada escola usa **sua própria** API Key Asaas (multi-tenant). Nenhum valor passa pela Agenda Fleur.
- Criptografia AES-256-GCM com `ENCRYPTION_KEY` (32 bytes, secret).
- Webhooks configurados automaticamente via API Asaas, com URL única + token por escola.

## 2. Banco de dados (migration única)

**Drop:** tabela `boletos` (e dependências).

**Novas tabelas (todas com RLS por `creche_id`):**

- `financial_settings` — uma linha por escola
  - `creche_id` (FK), `asaas_api_key_encrypted` (bytea), `asaas_api_key_iv`, `asaas_api_key_tag`, `asaas_api_key_last4`, `asaas_environment` (`production`|`sandbox`), `asaas_connected` (bool), `asaas_account_name`, `asaas_last_validation`, `asaas_webhook_token` (uuid), `asaas_webhook_id`.

- `financial_customers` — clientes Asaas espelhados
  - `creche_id`, `crianca_id` (nullable), `responsavel_user_id` (nullable), `asaas_customer_id`, `name`, `email`, `phone`, `cpf_cnpj`.

- `invoices` — cobranças
  - `creche_id`, `crianca_id`, `customer_id` (FK financial_customers), `asaas_payment_id`, `description`, `value` numeric, `due_date`, `payment_method` (`PIX`|`BOLETO`|`CREDIT_CARD`|`UNDEFINED`), `status`, `invoice_url`, `bank_slip_url`, `pix_qrcode`, `pix_copy_paste`, `pix_expires_at`, `subscription_id` (nullable), `legacy` bool default false.

- `payments` — eventos de pagamento confirmados
  - `creche_id`, `invoice_id`, `paid_at`, `value`, `payment_method`, `status`, `transaction_id`, `net_value`.

- `subscriptions` — recorrências
  - `creche_id`, `customer_id`, `crianca_id`, `asaas_subscription_id`, `value`, `cycle` (`MONTHLY`|`QUARTERLY`|`YEARLY`), `next_due_date`, `description`, `status`.

- `asaas_webhook_logs` — auditoria
  - `creche_id`, `event`, `payload` jsonb, `processed` bool, `error`, `received_at`.

**RLS:** SELECT/INSERT/UPDATE/DELETE só para diretor/secretaria/admin da `creche_id`. `financial_settings.asaas_api_key_*` nunca exposto via SELECT do client (policies bloqueiam colunas sensíveis usando função `get_financial_settings_safe`).

**Funções/triggers:**
- `is_financeiro_admin(_user_id, _creche_id)` SECURITY DEFINER.
- Trigger `updated_at` nas novas tabelas.
- View `vw_financial_settings_safe` expondo só metadados (sem chave).

## 3. Edge Functions

Todas com `verify_jwt = false` (Supabase signing-keys), validação manual via `getClaims()` exceto webhook.

- `asaas-connect` — recebe API key + ambiente. Valida no Asaas (`GET /v3/myAccount`), criptografa AES-256-GCM, salva, registra webhook automaticamente (`POST /v3/webhooks`), retorna status. **Nunca** retorna a chave.
- `asaas-disconnect` — remove webhook na Asaas, limpa colunas sensíveis.
- `asaas-status` — testa conexão (revalida).
- `asaas-customer-upsert` — cria/atualiza cliente Asaas a partir de aluno/responsável.
- `asaas-create-payment` — cria cobrança (PIX/Boleto/Cartão), grava `invoices`, busca QR Code PIX (`GET /v3/payments/{id}/pixQrCode`).
- `asaas-create-subscription` — recorrência mensal/trimestral/anual.
- `asaas-cancel-payment` — cancela.
- `asaas-resend-notification` — `POST /v3/payments/{id}/notifications`.
- `asaas-webhook` — público; valida `asaas-access-token` header contra `asaas_webhook_token`. Processa `PAYMENT_RECEIVED`, `PAYMENT_CONFIRMED`, `PAYMENT_OVERDUE`, `PAYMENT_DELETED`, `PAYMENT_REFUNDED`. Idempotente (chave: `event + payment.id`). Loga em `asaas_webhook_logs`.

**Service:** `_shared/asaas.ts` com `decryptApiKey()`, `asaasFetch(school, path, init)`.

**Secret necessário:** `ENCRYPTION_KEY` (32 bytes base64) — vou solicitar via add_secret.

## 4. Frontend

Remover: `src/pages/BoletosPage.tsx`, `src/components/modals/BoletoModal.tsx`, `BoletoLoteModal.tsx`, `src/components/financeiro/FinanceiroDashboard.tsx` (será reescrito).

Criar em `src/pages/financeiro/`:
- `FinanceiroDashboardPage.tsx` — KPIs (recebido, pendente, vencido, taxa), gráfico mensal, últimas cobranças, últimos pagamentos.
- `MensalidadesPage.tsx` — listagem por aluno, filtros (status, turma, mês), gerar mensalidade individual.
- `CobrancasPage.tsx` — todas invoices com ações: visualizar, copiar Pix, reenviar notificação, cancelar, ver QR.
- `InadimplenciaPage.tsx` — só vencidos agrupados por aluno/turma com totais.
- `IntegracaoAsaasPage.tsx` — formulário API key, ambiente, status, botões validar/desconectar/reconectar; mostra `****abcd`.
- `RelatoriosFinanceirosPage.tsx` — exportar CSV/PDF (recebimentos por período, inadimplência).

Componentes reutilizáveis: `InvoiceCard`, `PaymentMethodBadge`, `PixQrModal`, `KpiCard`.

Rotas: `/diretor/financeiro/*` e `/admin/financeiro/*`. Atualizar `App.tsx`, sidebar (`sidebar-defaults.ts`, `Sidebar.tsx`).

## 5. Painel Admin Global
- `/admin/financeiro/escolas` — lista escolas com status integração, última validação, contagem invoices.
- `/admin/financeiro/webhooks` — logs de webhook (read-only), filtros por escola/evento/erro. **Sem acesso a valores recebidos** além do necessário para diagnóstico.

## 6. Segurança
- API key descriptografada apenas em memória dentro da edge function.
- Logs nunca incluem a chave.
- RLS estrita; admin master usa `has_role('admin')`.
- Webhook valida token único por escola (HMAC-style header check).
- Idempotência: unique index em `asaas_webhook_logs(event, (payload->>'payment'->>'id'))`.

## 7. Detalhes técnicos relevantes

- Criptografia: Node Web Crypto (Deno) `crypto.subtle.importKey` + `AES-GCM` 256 bits.
- IV: 12 bytes random por chave.
- `ENCRYPTION_KEY` em base64 (44 chars).
- Recorrência Asaas: usa `/v3/subscriptions`; mensalidades geradas automaticamente pela Asaas e replicadas via webhook.
- Lembretes/avisos: configurar `notifications` direto no Asaas (eles disparam email/SMS). Não duplicaremos no nosso lado.

## 8. Ordem de execução
1. Migration (drop boletos + criar novas tabelas/RLS/funções).
2. Solicitar secret `ENCRYPTION_KEY`.
3. Criar edge functions + shared service.
4. Frontend: páginas + rotas + sidebar.
5. Remover arquivos antigos de boletos.
6. Atualizar `system-features.ts` e changelog.
7. QA visual rápido no preview.

## Limitações / pontos de atenção
- Asaas não permite descobrir `walletId` para split — não usaremos split.
- Sandbox vs produção: ambiente é por escola; URL base muda (`api.asaas.com` vs `sandbox.asaas.com`).
- Atualização de status depende do webhook estar entregando — exibiremos botão "Sincronizar" como fallback (`GET /v3/payments?status=...`).
- Fila/processamento assíncrono pesado **não** será implementado — o webhook é síncrono e idempotente, suficiente até alto volume.
- Devido ao tamanho, vou implementar em uma única passada; ajustes finos virão por feedback.
