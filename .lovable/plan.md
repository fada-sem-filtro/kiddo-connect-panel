
## Módulo de Boletos e Cobranças

### 1. Banco de Dados (Migration)
Criar tabela `boletos` com os campos:
- **Básicos**: criança_id, turma_id, creche_id, valor, vencimento, status (pendente/pago/vencido/cancelado), descricao
- **Desconto/multa/juros**: desconto_antecipacao (%), data_limite_desconto, multa_atraso (%), juros_dia (%)
- **Parcelamento**: parcela_atual, total_parcelas, referencia (ex: "Mensalidade Março 2026")
- **Dados bancários**: linha_digitavel, codigo_barras, nosso_numero
- **Extras**: observacoes (campo livre para informações adicionais), data_pagamento, educador_user_id (quem registrou)
- RLS: Admin total, Diretor por escola, Secretaria por escola, Responsável visualiza dos filhos

Adicionar coluna `modulo_boletos_ativo` na tabela `configuracoes_pedagogicas`

Adicionar módulo `boletos` na tabela `permissoes_perfil` para os perfis secretaria e diretor

### 2. Páginas e Telas
- **ConfiguracoesPedagogicasPage**: Adicionar toggle "Módulo de Boletos"
- **BoletoPage** (admin/diretor/secretaria): Listagem de boletos com filtros por turma, aluno, status e período
- **BoletoModal**: Criar/editar boleto com todos os campos
- **Responsável**: Visualizar boletos dos filhos com botão "Copiar linha digitável"

### 3. Navegação
- Adicionar rotas protegidas para `/boletos`, `/secretaria/boletos`, `/diretor/boletos`
- Adicionar ao sidebar de admin, diretor e secretaria (condicionado à permissão)
- Adicionar atalho no dashboard da secretaria e do diretor

### 4. Permissões
- Admin ativa o módulo via Configurações Pedagógicas
- Diretor gerencia boletos da sua escola
- Secretaria gerencia boletos (se permitido pelo diretor via permissões)
- Responsável visualiza e copia linha digitável

### 5. Integração bancária (preparação)
- Estrutura preparada para receber API de banco futuramente
- Campos bancários preenchidos manualmente por enquanto
- Sem edge function de integração neste momento

### ⚠️ Correção pendente
- Corrigir erro de build em `usePresencas.ts` antes de prosseguir
