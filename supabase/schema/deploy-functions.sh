#!/usr/bin/env bash
# Deploy automatizado de todas as Edge Functions do Agenda Fleur para um projeto Supabase externo.
#
# Uso:
#   bash supabase/schema/deploy-functions.sh <project-ref>
#
# Exemplo:
#   bash supabase/schema/deploy-functions.sh rjjzkozvicsnjczlsnjr
#
# Pré-requisitos:
#   - Supabase CLI instalado (`npm i -g supabase`)
#   - `supabase login` executado
#   - Executar da raiz do projeto (onde está a pasta supabase/)

set -euo pipefail

PROJECT_REF="${1:-}"

if [[ -z "$PROJECT_REF" ]]; then
  echo "❌ Uso: bash supabase/schema/deploy-functions.sh <project-ref>"
  echo "   Ex.: bash supabase/schema/deploy-functions.sh rjjzkozvicsnjczlsnjr"
  exit 1
fi

if ! command -v supabase >/dev/null 2>&1; then
  echo "❌ Supabase CLI não encontrado. Instale com: npm i -g supabase"
  exit 1
fi

if [[ ! -d "supabase/functions" ]]; then
  echo "❌ Execute este script da raiz do projeto (pasta supabase/functions não encontrada)."
  exit 1
fi

# Lista de funções (ignora pastas privadas começando com _)
FUNCTIONS=(
  asaas-cancel-payment
  asaas-connect
  asaas-create-payment
  asaas-create-subscription
  asaas-disconnect
  asaas-resend-notification
  asaas-sync-subscriptions
  asaas-update-subscription
  asaas-webhook
  auth-email-hook
  bootstrap-admin
  create-user
  delete-user
  finance-create-charge
  financial-auto-sync
  financial-collection-runner
  google-indexing-request
  inter-balance
  inter-cancel-invoice
  inter-connect
  inter-create-invoice
  inter-disconnect
  inter-get-invoice
  inter-get-pdf
  inter-register-webhook
  inter-reprocess-webhook
  inter-statement
  inter-status
  inter-sync-invoices
  inter-update-due-date
  inter-webhook
  process-email-queue
  reset-user-password
  rss-xml
  saas-generate-monthly-invoices
  saas-inter-cancel-invoice
  saas-inter-connect
  saas-inter-create-invoice
  saas-inter-disconnect
  saas-inter-get-invoice
  saas-inter-status
  saas-inter-sync-invoices
  saas-inter-webhook
  saas-mark-overdue
  send-orcamento-email
  sitemap-xml
)

TOTAL=${#FUNCTIONS[@]}
OK=0
FAIL=0
FAILED_FUNCS=()

echo "🚀 Deploy de $TOTAL edge functions para projeto: $PROJECT_REF"
echo "────────────────────────────────────────────────────────────"

for i in "${!FUNCTIONS[@]}"; do
  FN="${FUNCTIONS[$i]}"
  NUM=$((i + 1))
  printf "[%2d/%d] %-40s " "$NUM" "$TOTAL" "$FN"

  if supabase functions deploy "$FN" --project-ref "$PROJECT_REF" >/tmp/deploy-"$FN".log 2>&1; then
    echo "✅"
    OK=$((OK + 1))
  else
    echo "❌"
    FAIL=$((FAIL + 1))
    FAILED_FUNCS+=("$FN")
    echo "    Log: /tmp/deploy-$FN.log"
  fi
done

echo "────────────────────────────────────────────────────────────"
echo "✅ Sucesso: $OK  |  ❌ Falhas: $FAIL  |  Total: $TOTAL"

if (( FAIL > 0 )); then
  echo ""
  echo "Funções que falharam:"
  for FN in "${FAILED_FUNCS[@]}"; do
    echo "  - $FN  (veja /tmp/deploy-$FN.log)"
  done
  echo ""
  echo "💡 Dica: se muitas falharem com 500, remova deno.lock e tente novamente."
  exit 1
fi

echo ""
echo "🎉 Todas as funções deployadas com sucesso!"
echo ""
echo "Próximos passos:"
echo "  1. Configure os secrets no dashboard → Edge Functions → Manage secrets"
echo "     (veja supabase/schema/MIGRATION_CHECKLIST.md → passo 8)"
echo "  2. Configure o Auth Hook em Authentication → Hooks"
echo "     apontando para: https://$PROJECT_REF.supabase.co/functions/v1/auth-email-hook"
