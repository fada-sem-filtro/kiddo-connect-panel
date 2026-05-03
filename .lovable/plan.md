# Atualização do Changelog — v2.7

Adicionar uma nova entrada no topo de `src/pages/ChangelogPage.tsx` documentando as funcionalidades e melhorias entregues mais recentemente.

## Nova entrada

**Versão:** 2.6.2 — Maio 2026  
**Título:** Permissões granulares na interface e blindagem de segurança

**Itens:**

- **Correção** — Botões de criar, editar e excluir  respeitam as permissões.
- **Melhoria** — Permissões aplicadas em Alunos, Turmas, Corpo Docente, Usuários, Recados, Eventos, Calendário, Feriados, Matérias, Grade de Aulas, Boletim, Atividades Pedagógicas e Relatórios.
- **Segurança** — Uploads de anexos restritos à pasta do próprio usuário no bucket de recados.
- **Segurança** — Realtime com escopo por identidade, escola, turma e aluno.
- **Segurança** — Função de envio de orçamentos endurecida com validação adicional contra abuso.

## Detalhes técnicos

- Único arquivo editado: `src/pages/ChangelogPage.tsx`.
- Inserir o objeto da v2.7 como primeiro elemento do array `CHANGELOG`, mantendo a v2.6 e demais versões intactas logo abaixo.
- Reaproveitar os tipos existentes (`feature`, `improvement`, `security`) — sem necessidade de alterar `TYPE_M`
  &nbsp;