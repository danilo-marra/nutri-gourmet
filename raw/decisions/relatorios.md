---
source: q&a-2026-05-27
status: decided
---

# Decisão: Relatórios

**Data:** 2026-05-27
**Status:** decided

## Decisões

### Escopo desta fase

**Decisão:** Cinco relatórios prioritários, todos acessíveis por supervisor e admin (não operador):

1. **Vendas por período** — total de vendas filtrado por data (dia/semana/mês); agrupa por forma de pagamento.
2. **Créditos adicionados** — histórico de créditos manuais e de pacotes por aluno; filtrável por aluno e por período.
3. **Saldo por aluno** — lista de todos os alunos com saldo atual; destaca saldos negativos.
4. **Fechamentos de caixa** — histórico de fechamentos por operador e por data; exibe status `pending` para dias sem fechamento.
5. **Pacotes vigentes** — lista de pacotes ativos (`expires_at IS NULL OR expires_at > NOW()`); exibe aluno, valor creditado e data de expiração quando definida.

**Justificativa:** Esses cinco cobrem as necessidades operacionais e financeiras imediatas sem exigir motor de relatórios genérico. Outros relatórios (por produto, por turma, etc.) ficam para fases futuras.

### Granularidade de data

**Decisão:** Filtro por data suporta seleção de dia, semana ou mês. Sem granularidade de hora — o sistema opera em turno único diário.

### Formato de saída

**Decisão:** Visualização em tela (tabela paginada). Exportação (CSV, PDF) fora do escopo desta fase.

### Permissões

**Decisão:** Todos os relatórios acessíveis por supervisor e admin. Operador não acessa relatórios.
