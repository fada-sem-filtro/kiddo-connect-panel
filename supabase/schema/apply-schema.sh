#!/usr/bin/env bash
# Aplica supabase/schema/schema.sql em um banco Supabase externo via psql.
#
# Uso:
#   export SUPABASE_DB_URL="postgresql://postgres:SENHA@db.<ref>.supabase.co:5432/postgres"
#   bash supabase/schema/apply-schema.sh
#
# Ou passando a URL como argumento:
#   bash supabase/schema/apply-schema.sh "postgresql://postgres:SENHA@db.<ref>.supabase.co:5432/postgres"
#
# Pré-requisitos:
#   - psql instalado (vem no pacote postgresql-client)
#       macOS:  brew install libpq && brew link --force libpq
#       Ubuntu: sudo apt install postgresql-client
#       Windows: instale o PostgreSQL ou use WSL
#   - Executar da raiz do projeto
#
# Segurança:
#   - NUNCA commite a connection string com senha.
#   - Prefira export SUPABASE_DB_URL="..." no seu shell local (não vai pro git).
#   - A senha do banco só é exibida uma vez no dashboard; se perder, reset em
#     Project Settings → Database → Reset database password.

set -euo pipefail

SCHEMA_FILE="supabase/schema/schema.sql"
DB_URL="${1:-${SUPABASE_DB_URL:-}}"

# ─── Validações ─────────────────────────────────────────────
if [[ -z "$DB_URL" ]]; then
  cat <<EOF
❌ Connection string não informada.

Uso:
  export SUPABASE_DB_URL="postgresql://postgres:SENHA@db.<ref>.supabase.co:5432/postgres"
  bash supabase/schema/apply-schema.sh

Ou:
  bash supabase/schema/apply-schema.sh "postgresql://postgres:SENHA@..."

Pegue a connection string em:
  Dashboard Supabase → Project Settings → Database → Connection string (URI)
EOF
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "❌ psql não encontrado. Instale postgresql-client primeiro."
  echo "   macOS:  brew install libpq && brew link --force libpq"
  echo "   Ubuntu: sudo apt install postgresql-client"
  exit 1
fi

if [[ ! -f "$SCHEMA_FILE" ]]; then
  echo "❌ $SCHEMA_FILE não encontrado. Execute da raiz do projeto."
  exit 1
fi

# Redact senha pra log (mostra só host)
HOST_ONLY=$(echo "$DB_URL" | sed -E 's|://[^@]+@|://***@|')

echo "🎯 Alvo:       $HOST_ONLY"
echo "📄 Schema:     $SCHEMA_FILE ($(wc -l < "$SCHEMA_FILE") linhas)"
echo ""

# ─── Confirmação ────────────────────────────────────────────
echo "⚠️  Isto vai executar ~5.700 linhas de SQL no banco alvo."
echo "    Se o banco já tiver tabelas com mesmos nomes, algumas instruções"
echo "    podem falhar (CREATE TABLE sem IF NOT EXISTS). O script continua"
echo "    com ON_ERROR_STOP=0 e reporta erros no final."
echo ""
read -r -p "Continuar? (digite 'sim' pra confirmar): " CONFIRM
if [[ "$CONFIRM" != "sim" ]]; then
  echo "Abortado."
  exit 0
fi

# ─── Testa conexão ──────────────────────────────────────────
echo ""
echo "🔌 Testando conexão..."
if ! psql "$DB_URL" -c "SELECT version();" >/dev/null 2>&1; then
  echo "❌ Falha ao conectar. Verifique senha, host e liberação de IP."
  echo "   Dica: se estiver atrás de proxy corporativo, use IPv4 pooler:"
  echo "   Dashboard → Project Settings → Database → Connection pooler (Session mode)"
  exit 1
fi
echo "✅ Conexão OK"

# ─── Pré-requisito: extensions ─────────────────────────────
echo ""
echo "📦 Habilitando extensions..."
psql "$DB_URL" -v ON_ERROR_STOP=1 <<'SQL'
create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";
create extension if not exists pg_trgm;
create extension if not exists citext;
create extension if not exists pg_cron;
create extension if not exists pg_net;
create extension if not exists pgmq cascade;
create extension if not exists vault cascade;
SQL
echo "✅ Extensions OK"

# ─── Aplica schema ─────────────────────────────────────────
LOG_FILE="/tmp/apply-schema-$(date +%Y%m%d-%H%M%S).log"
echo ""
echo "🚀 Aplicando schema... (log em $LOG_FILE)"
echo ""

# ON_ERROR_STOP=0 pra continuar mesmo se algumas instruções falharem
# (útil pra reaplicar em banco parcialmente preenchido)
set +e
psql "$DB_URL" \
  -v ON_ERROR_STOP=0 \
  -v VERBOSITY=terse \
  --echo-errors \
  -f "$SCHEMA_FILE" \
  > "$LOG_FILE" 2>&1
EXIT_CODE=$?
set -e

# ─── Análise do resultado ──────────────────────────────────
ERROR_COUNT=$(grep -c "^ERROR:" "$LOG_FILE" || true)
NOTICE_COUNT=$(grep -c "^NOTICE:" "$LOG_FILE" || true)

echo ""
echo "────────────────────────────────────────────────────────"
echo "📊 Resultado:"
echo "   Exit code:    $EXIT_CODE"
echo "   ERRORs:       $ERROR_COUNT"
echo "   NOTICEs:      $NOTICE_COUNT (normalmente 'already exists' — ok)"
echo "   Log completo: $LOG_FILE"
echo "────────────────────────────────────────────────────────"

if (( ERROR_COUNT > 0 )); then
  echo ""
  echo "⚠️  Primeiros 10 erros:"
  grep "^ERROR:" "$LOG_FILE" | head -10
  echo ""
  echo "Erros comuns e o que fazer:"
  echo "  • 'relation already exists'  → banco já tem a tabela; ok se for reaplicação"
  echo "  • 'permission denied for schema auth' → esperado; o trigger em auth.users"
  echo "    precisa ser criado manualmente (veja MIGRATION_CHECKLIST.md passo 3)"
  echo "  • 'extension pgmq does not exist' → extension não disponível no plano;"
  echo "    contate suporte Supabase"
fi

# ─── Validação ─────────────────────────────────────────────
echo ""
echo "🔍 Contagem de tabelas em public:"
TABLE_COUNT=$(psql "$DB_URL" -tAc "select count(*) from information_schema.tables where table_schema = 'public';")
echo "   → $TABLE_COUNT tabelas (esperado: ~60)"

echo ""
echo "🔍 Contagem de funções em public:"
FN_COUNT=$(psql "$DB_URL" -tAc "select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public';")
echo "   → $FN_COUNT funções (esperado: ~25)"

echo ""
if (( TABLE_COUNT >= 55 )); then
  echo "✅ Schema aplicado com sucesso."
  echo ""
  echo "Próximos passos (veja supabase/schema/MIGRATION_CHECKLIST.md):"
  echo "  3. Criar trigger on_auth_user_created em auth.users"
  echo "  4. Criar vault secret 'email_queue_service_role_key'"
  echo "  5. Criar storage buckets"
  echo "  6. Configurar Auth providers + Auth Hook"
  echo "  7. Deploy edge functions: bash supabase/schema/deploy-functions.sh <ref>"
  echo "  8. Configurar Edge Function secrets"
else
  echo "❌ Contagem baixa demais. Revise $LOG_FILE antes de prosseguir."
  exit 1
fi
