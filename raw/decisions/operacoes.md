---
source: q&a-2026-05-27
status: decided
---

# Decisão: Operações e Administração

**Data:** 2026-05-27
**Status:** decided

## Decisões

### Fechamento de caixa

**Decisão:** Recomendado, mas não bloqueante. O sistema não impede novas vendas se o caixa do dia anterior não foi fechado. Dias sem fechamento ficam com status `pending` nos relatórios.

**Justificativa:** Bloquear vendas por caixa não fechado seria punitivo em caso de esquecimento ou imprevisto. O status `pending` nos relatórios fornece visibilidade sem prejudicar a operação.

### Relatório do fechamento de caixa

**Decisão:** O fechamento gera um resumo básico visível por supervisor e admin contendo: total de vendas do dia, total por forma de pagamento (`credit`, `cash`, `card`) e nome do operador responsável pelo fechamento.

**Justificativa:** O resumo básico é suficiente para auditoria diária. Vendas individuais já ficam acessíveis no relatório de vendas por período; não é necessário duplicar o detalhamento no fechamento.

### Delegação do fechamento de caixa

**Decisão:** Supervisor ou admin pode fechar o caixa em nome do operador. O registro do fechamento deve guardar o `operator_id` (dono do turno) e o `closed_by_id` (quem executou o fechamento, que pode ser diferente).

**Justificativa:** Situações de ausência ou indisponibilidade do operador não devem deixar o dia em `pending` indefinidamente. A delegação com registro de quem fechou mantém rastreabilidade.

### Criação de contas de Operador e Supervisor

**Decisão:** Admin cria a conta via painel informando nome e e-mail. O sistema envia um convite por e-mail usando o **fluxo de ativação já existente no repositório** (`models/activation.js`, endpoint de ativação).

**Justificativa:** Reutilizar o fluxo de ativação existente evita duplicação de lógica de convite/senha temporária. O novo usuário recebe um link de ativação e define sua própria senha.

### Recuperação de senha

**Decisão:** Fora do escopo desta fase. Não implementar recuperação de senha por enquanto.
