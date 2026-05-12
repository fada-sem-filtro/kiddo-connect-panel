# Camada Financeira Visual Premium — Agenda Fleur

Implementação de uma **camada visual e operacional** acima das integrações Asaas e Banco Inter PJ já existentes. **Nada da lógica atual será alterado** — apenas consumo, visualização, automações complementares e UX premium.

---

## Princípios

- **Zero alteração** em: webhooks (`asaas-webhook`, `inter-webhook`, `saas-inter-webhook`), edge functions de criação/cancelamento de cobrança, tabelas financeiras principais (`financial_invoices`, `creches.financial_provider`), autenticação, RLS atual.
- **Apenas consumir** dados existentes (`financial_invoices`, `saas_invoices`, `inter_*`, `asaas_*`).
- **Tabelas novas** apenas auxiliares (cache, logs de automação, snapshots) — nunca substituem as existentes.
- Reutiliza `useFinancialProvider`, `DashboardFinanceiroTab`, `CobrancasInterTab`, `AdminFinanceiroGlobalPage`, `SchoolFinancialManagementPage`.

---

## Etapas

### 1. Dashboard Financeiro Premium (`/financeiro` — diretor/secretaria; `/admin/financeiro` — admin)
- Refinar `DashboardFinanceiroTab` existente:
  - KPIs premium (recebido mês, hoje, pendente, vencido, inadimplência %, ticket médio, receita recorrente).
  - Gráficos: barras 6 meses (já existe), linha de fluxo, donut por status, ranking por turma/unidade.
  - Filtros: período (mês/trimestre/ano/custom), unidade (admin), turma.
  - Skeletons, animações Framer Motion sutis, responsivo mobile-first.
- Realtime via Supabase Realtime na tabela `financial_invoices` (apenas SELECT, sem mexer em schema).
- Componentes novos em `src/components/financeiro/`:
  - `KpiPremiumCard.tsx`, `RevenueLineChart.tsx`, `StatusDonut.tsx`, `TurmaRankingCard.tsx`, `PeriodFilter.tsx`.

### 2. Gestão de Cobranças (visual)
- Refinar `CobrancasInterTab` + criar visualização equivalente para Asaas em `src/pages/financeiro/CobrancasAsaasTab.tsx` (lê `financial_invoices` + `asaas_payments` se existir).
- View unificada `CobrancasUnificadasTab.tsx`:
  - Toggle cards/tabela.
  - Filtros: status (pago/pendente/vencido/cancelado/atrasado), método (PIX/boleto), período, busca por aluno/responsável.
  - Ações: copiar PIX, baixar boleto (chama `inter-get-pdf` ou link Asaas existente), segunda via, ver histórico.
  - Paginação + ordenação client-side.
- **Não cria** cobrança nova fora dos endpoints já existentes.

### 3. Régua Automática de Cobrança
- Nova tabela `financial_collection_rules` (config por escola: etapas ativas, mensagens, canais).
- Nova tabela `financial_collection_logs` (histórico de envios).
- Edge function `financial-collection-runner` (cron diário): varre `financial_invoices` pendentes, calcula offset vs `due_date`, dispara notificação interna (`notificacoes`) + email via `auth-email-hook`/Resend já configurado. **Não toca** na cobrança no Asaas/Inter.
- UI: `src/pages/financeiro/ReguaCobrancaPage.tsx` — timeline visual editável (-7, -3, 0, +1, +5, +15, +30 dias), toggle por etapa, editor de template com placeholders, log de envios.

### 4. Comunicação WhatsApp (manual + template)
- Não há provider WhatsApp configurado → implementar via **link `wa.me`** com mensagem pré-preenchida (cliente abre WhatsApp Web/app). Marcado como envio manual no log.
- Componente `WhatsAppSendButton.tsx`: gera link com placeholders resolvidos (nome responsável, criança, vencimento, valor, PIX copia-e-cola, linha digitável).
- Templates configuráveis em `financial_message_templates` (nova tabela auxiliar).
- Caso o usuário queira envio 100% automático no futuro, basta plugar provider — arquitetura já preparada.

### 5. Recibos e Comprovantes PDF
- `src/lib/financial-receipt-pdf.ts` usando jsPDF (já instalado pelo `pdf-export.ts` provavelmente).
- Layout premium com logo da escola (`creches.logo_url`), dados do pagamento de `financial_invoices` (status `RECEBIDO`/`paid_at`).
- Ações: download, imprimir, compartilhar via `navigator.share`, enviar email (reuso de edge function de email genérica).

### 6. Extrato Financeiro
- `src/pages/financeiro/ExtratoUnificadoTab.tsx`: lista cronológica de movimentações (entrada de pagamento, cancelamento, taxa).
- Filtros avançados + export PDF (jsPDF), Excel (SheetJS) e CSV.
- Reaproveita `ExtratoInterTab` para Inter.

### 7. Relatórios Mensais
- `src/pages/financeiro/RelatoriosFinanceirosPage.tsx`: gerar PDF mensal (faturamento, inadimplência, top devedores, comparação MoM).
- Snapshot opcional em nova tabela `financial_report_snapshots` (cache de fechamento mensal).

### 8. Previsão Financeira
- `src/components/financeiro/PrevisaoCard.tsx`: projeção simples (média móvel 3M + cobranças com `due_date` futuro já registradas).
- Cache em `financial_forecast_cache` (regenera a cada 6h via cron leve).
- Insights textuais automáticos ("Receita prevista cresce X% vs mês anterior").

### 9. Portal Financeiro do Responsável
- Nova rota `/responsavel/financeiro` (visível só para role `responsavel`):
  - Lista mensalidades dos filhos vinculados (RLS já permite via `crianca_responsaveis`).
  - Cards mobile-first: status, vencimento, valor, botão "Copiar PIX", "Baixar boleto", "Ver recibo".
  - Histórico paginado.
- Componente `ResponsavelFinanceiroPage.tsx`. Adicionar item no sidebar do responsável.

### 10. Polimento Visual
- Tokens premium em `index.css` (sem quebrar paleta atual): gradientes financeiros sutis, sombras suaves.
- Microinterações com Framer Motion (já no projeto se disponível; senão usar `transition-*` Tailwind).
- Dark mode: garantir todos os novos componentes usam tokens semânticos (`bg-card`, `text-foreground`, `border`, `primary`).
- Skeletons em todas as telas.

### 11. Segurança / LGPD
- RLS em todas as tabelas novas (admin + diretor da escola dona).
- Logs de acesso a recibos (insert em `financial_notification_logs`).
- Sem PII em cache.

### 12. Performance
- React Query em todos os fetches novos (cache + refetch on focus).
- Realtime apenas no dashboard ativo (cleanup no unmount).
- Paginação server-side onde > 100 registros.

---

## Tabelas auxiliares novas (migration)

```sql
-- Régua de cobrança
financial_collection_rules (id, creche_id, stage_offset_days, channel, template, ativo, ...)
financial_collection_logs (id, invoice_id, rule_id, channel, status, sent_at, payload, error)

-- Templates de mensagem
financial_message_templates (id, creche_id, tipo, titulo, body, placeholders, ativo)

-- Cache / snapshots
financial_dashboard_cache (id, creche_id, scope, period_key, payload jsonb, generated_at)
financial_report_snapshots (id, creche_id, ano, mes, payload jsonb, generated_at)
financial_forecast_cache (id, creche_id, payload jsonb, generated_at)
```

Todas com RLS estrita: `admin` total; `diretor`/`secretaria` apenas `creche_id` da sua unidade.

---

## Edge functions novas

- `financial-collection-runner` (cron diário 08:00 BRT) — dispara notificações conforme régua.
- `financial-forecast-refresh` (cron 6h) — popula `financial_forecast_cache`.
- `financial-receipt-email` — envia recibo PDF por email (Resend, mesmo padrão do `auth-email-hook`).

Nenhuma altera webhooks, lógica Asaas/Inter ou tabelas existentes.

---

## Arquivos principais a criar/editar

**Criar (~25 arquivos):**
- `src/pages/financeiro/CobrancasUnificadasTab.tsx`, `CobrancasAsaasTab.tsx`, `ReguaCobrancaPage.tsx`, `RelatoriosFinanceirosPage.tsx`, `ExtratoUnificadoTab.tsx`
- `src/pages/responsavel/ResponsavelFinanceiroPage.tsx`
- `src/components/financeiro/*` (KPIs, gráficos, filtros, WhatsAppSendButton, ReceiptPreview, PrevisaoCard, etc.)
- `src/lib/financial-receipt-pdf.ts`, `src/lib/financial-export.ts`, `src/hooks/useFinancialMetrics.ts`, `useFinancialRealtime.ts`
- `supabase/functions/financial-collection-runner/index.ts`, `financial-forecast-refresh/index.ts`, `financial-receipt-email/index.ts`

**Editar (mínimo):**
- `src/pages/financeiro/FinanceiroPage.tsx`, `AdminFinanceiroGlobalPage.tsx`, `DashboardFinanceiroTab.tsx` — adicionar abas/cards novos sem remover existentes
- `src/App.tsx` — registrar rotas novas
- `src/lib/sidebar-defaults.ts` — adicionar item "Financeiro" ao responsável; "Régua de Cobrança" e "Relatórios Financeiros" para diretor/admin

**Não tocar:** todas as edge functions `asaas-*`, `inter-*`, `saas-inter-*`, `financial-auto-sync`, webhooks, `client.ts`, `types.ts`, schema das tabelas existentes.

---

## Entrega faseada (recomendada)

Pelo tamanho do escopo, sugiro confirmar para entregarmos em 3 PRs:
- **Fase A:** Dashboard premium + Cobranças unificadas + Portal do responsável (visual core).
- **Fase B:** Régua de cobrança + WhatsApp templates + Recibos PDF.
- **Fase C:** Extrato avançado + Relatórios mensais + Previsão financeira.

Confirme se prefere entregar **tudo de uma vez** (PR grande, mais demorado) ou em **fases A→B→C**.