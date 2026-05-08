# Módulo Financeiro Multi-Provider — Banco Inter PJ

Adicionar Banco Inter como provider alternativo ao Asaas (que continua intacto). Cada escola escolhe seu provider; toda movimentação financeira ocorre direto na conta da escola.

## 1. Arquitetura

```text
financial_provider (enum: 'asaas' | 'inter')
       │
       ├── Asaas (já implementado, intocado)
       └── Inter (novo)
              ├── OAuth2 Client Credentials + mTLS
              ├── Cobranças (Boleto/PIX)
              ├── Webhook
              └── Sync periódico
```

Provider abstrato em `_shared/financial-provider.ts` com interface unificada (`createInvoice`, `getInvoice`, `cancelInvoice`, `registerWebhook`). Implementações: `AsaasProvider` (wrapper do código atual) e `InterProvider` (novo).

## 2. Banco de dados (1 migration)

**Novas tabelas (RLS por `creche_id`, função `is_financeiro_admin` reutilizada):**

- `financial_accounts` — credenciais por escola
  - `creche_id`, `provider` ('inter'|'asaas'), `client_id`, `encrypted_client_secret`, `client_secret_iv`, `client_secret_tag`, `certificate_path` (storage), `private_key_path` (storage), `webhook_secret`, `account_name`, `connected`, `last_validation`, `environment` ('production'|'sandbox')
  - Único por `(creche_id, provider)`

- `financial_invoices` — cobranças unificadas (independente de provider)
  - `creche_id`, `crianca_id`, `provider`, `external_id`, `nosso_numero`, `amount`, `due_date`, `status`, `payment_method`, `pix_qrcode`, `pix_copy_paste`, `boleto_pdf_url`, `boleto_linha_digitavel`, `paid_at`, `description`

- `financial_transactions` — eventos de pagamento
  - `creche_id`, `invoice_id`, `transaction_type`, `amount`, `status`, `raw_payload`, `paid_at`

- `financial_webhook_logs` — auditoria
  - `creche_id`, `provider`, `event`, `external_id`, `payload`, `processed`, `error`, `received_at`
  - Unique `(provider, event, external_id)` para idempotência

**Storage privado:** bucket `inter-certificates` (private). Path: `{creche_id}/cert.crt` e `{creche_id}/key.key`. RLS: só admin/diretor da escola lê/escreve. Edge functions usam service role.

**Reuso:** mantemos `invoices`, `payments`, `subscriptions`, `financial_settings` do Asaas como estão. As novas tabelas são paralelas para Inter; UI futuramente unifica via `provider`.

## 3. Edge Functions (todas com `verify_jwt = false` + validação manual via `getUser`)

- `inter-connect` — recebe client_id, client_secret, certificado e chave (multipart). Valida via `POST /oauth/v2/token` com mTLS. Salva certificados em storage privado, criptografa secret AES-256-GCM com `ENCRYPTION_KEY`, registra webhook.
- `inter-disconnect` — remove webhook, apaga certificados do storage, marca `connected=false`.
- `inter-status` — testa conexão.
- `inter-create-invoice` — cria cobrança (Boleto/PIX) via `POST /cobranca/v3/cobrancas`, busca PIX QR Code, persiste em `financial_invoices`.
- `inter-get-invoice` — sincroniza status de uma cobrança.
- `inter-cancel-invoice` — cancela cobrança.
- `inter-sync-invoices` — varre cobranças pendentes e atualiza status (fallback do webhook).
- `inter-webhook` — público, valida `webhook_secret` por escola via path token, processa eventos `RECEBIDO`/`CANCELADO`/`EXPIRADO`, idempotente.

**Shared:** `_shared/inter.ts` com:
- `getInterToken(account)` — OAuth2 Client Credentials com cache (TTL 50min)
- `interFetch(account, path, init)` — fetch com mTLS usando `Deno.createHttpClient` + `caCerts` + cliente cert (via `Deno.env`-loaded PEM)
- `decryptSecret(account)` / `encryptSecret(value)`
- `loadCertFromStorage(creche_id)` / `saveCertToStorage(creche_id, cert, key)`

**Limitação técnica importante:** Deno Edge Runtime tem suporte a mTLS via `Deno.createHttpClient({ cert, key })`. Isso é estável no edge runtime do Supabase. Se houver problema, fallback é usar `fetch` com `Deno.createHttpClient` + cliente HTTP customizado.

## 4. Jobs agendados (pg_cron, sem Redis/BullMQ)

- `inter_sync_daily` — diariamente às 03:00 chama `inter-sync-invoices` para todas escolas conectadas.
- `inter_overdue_check` — diariamente às 04:00 marca invoices vencidas como `OVERDUE`.
- (Geração mensal e régua de cobrança seguem como ações manuais nesta fase para não introduzir efeitos colaterais.)

## 5. Frontend

Atualizar `src/pages/financeiro/FinanceiroPage.tsx`:
- Nova aba **"Banco Inter"** ao lado de **"Integração Asaas"**.
- Indicador visual de qual provider está ativo na escola (ou ambos).

Novos componentes em `src/pages/financeiro/`:
- `IntegracaoInterPage.tsx` (ou aba) — formulário: client_id, client_secret, upload `.crt`, upload `.key`, ambiente. Botões validar/desconectar. Mostra status conexão e nome conta.
- `InterCobrancasPage.tsx` — lista `financial_invoices` do provider Inter, ações: ver boleto PDF, copiar PIX copia-e-cola, mostrar QR, cancelar, sincronizar.
- `NovaCobrancaInterModal.tsx` — selecionar aluno, valor, vencimento, descrição, tipo (Boleto/PIX/Boleto+PIX).

Sidebar: adicionar entradas "Banco Inter" e "Cobranças Inter" sob Financeiro (toggle pelo módulo pedagógico).

## 6. Segurança

- Certificados em **storage privado** (`inter-certificates`), nunca em coluna do banco.
- Apenas service role (edge functions) lê os certificados; signed URLs nunca expostas.
- `client_secret` criptografado AES-256-GCM com `ENCRYPTION_KEY` já existente.
- `webhook_secret` único por escola — validado em todo POST de webhook.
- RLS: `financial_accounts.encrypted_*` e `*_path` filtrados via view `vw_financial_accounts_safe` (frontend nunca vê valores sensíveis).
- Logs nunca incluem secret/cert/key.
- Idempotência webhook via unique index.

## 7. Detalhes técnicos

- API base produção: `https://cdpj.partners.bancointer.com.br`
- Sandbox: não público — produção apenas. Campo `environment` mantido para futuro.
- Scopes OAuth: `boleto-cobranca.read boleto-cobranca.write webhook-cobranca.read webhook-cobranca.write pix.cob.read pix.cob.write`
- Webhook URL pública: `https://takzcbagxjydlkzenprr.supabase.co/functions/v1/inter-webhook?token={webhook_secret}`
- Inter exige `x-conta-corrente` em alguns endpoints — campo opcional `conta_corrente` em `financial_accounts`.

## 8. Limitações desta fase

- **Régua de cobrança automática (lembretes/escalation)**: não implementada agora — Inter já dispara seus próprios e-mails de boleto. Pode ser fase futura via pg_cron + Resend.
- **Geração mensal automática de mensalidades**: não automatizada; fica para fase 2 (precisa de definição de planos por aluno, valor variável, etc.).
- **Split/multi-conta**: não suportado (e nem solicitado).
- **Sandbox Inter**: API Inter é só produção; testes exigem conta real PJ.
- **Tamanho do certificado**: validamos < 100KB no upload.

## 9. Ordem de execução

1. Migration: tabelas + bucket `inter-certificates` + RLS + view safe.
2. `_shared/inter.ts` + `_shared/financial-provider.ts`.
3. Edge functions Inter (8 funções).
4. Cron jobs.
5. Frontend: aba Inter + cobranças + modal nova cobrança.
6. Sidebar updates.
7. Atualizar `system-features.ts` e memória.
