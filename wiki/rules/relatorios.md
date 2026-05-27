# Relatórios

**Summary**: Cinco relatórios operacionais e financeiros prioritários para esta fase — acessíveis por supervisor e admin.

**Sources**: raw/decisions/relatorios.md

**Last updated**: 2026-05-27

---

## Permissões

Todos os relatórios são acessíveis por [[supervisor]] e [[administrador]]. O [[operador]] não acessa relatórios. (source: raw/decisions/relatorios.md)

> ⚠️ **Inconsistência a resolver antes de implementar:** `models/authorization.js` define `read:report:operational` em `SUPERVISOR_FEATURES` e `read:report:financial` apenas em `ADMIN_FEATURES`. A decisão diz que todos os 5 são supervisor+, sem distinção operacional/financeiro. Ao implementar o módulo de relatórios, escolher entre: (a) adicionar `read:report:financial` ao supervisor e usar apenas essa feature; ou (b) mapear cada relatório a uma das duas features e atualizar a decisão.

## Relatórios disponíveis

### Vendas por período

Total de vendas filtrado por data (dia/semana/mês). Agrupa por forma de pagamento (`credit`, `cash`, `card`). (source: raw/decisions/relatorios.md)

### Créditos adicionados

Histórico de créditos manuais e de [[pacote|pacotes]] por [[aluno]]. Filtrável por aluno e por período. (source: raw/decisions/relatorios.md)

### Saldo por aluno

Lista de todos os [[aluno|alunos]] com saldo atual. Destaca saldos negativos para identificação rápida. (source: raw/decisions/relatorios.md)

### Fechamentos de caixa

Histórico de [[fechamento-de-caixa|fechamentos]] por operador e por data. Exibe status `pending` para dias sem fechamento. (source: raw/decisions/relatorios.md)

### Pacotes vigentes

Lista de [[pacote|pacotes]] ativos (`expires_at IS NULL OR expires_at > NOW()`). Exibe aluno, valor creditado e data de expiração quando definida. (source: raw/decisions/relatorios.md)

## Granularidade de data

Filtro por data suporta seleção de dia, semana ou mês. Sem granularidade de hora — o sistema opera em turno único diário. (source: raw/decisions/relatorios.md)

## Formato de saída

Visualização em tela (tabela paginada). Exportação (CSV, PDF) fora do escopo desta fase. (source: raw/decisions/relatorios.md)

## Related pages

- [[supervisor]]
- [[administrador]]
- [[venda]]
- [[credito]]
- [[pacote]]
- [[fechamento-de-caixa]]
- [[aluno]]
