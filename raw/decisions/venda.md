---
source: q&a-2026-05-27
status: decided
---

# Decisão: Venda

**Data:** 2026-05-27
**Status:** decided

## Decisões

### Estrutura da transação

**Decisão:** Uma venda pode conter múltiplos itens. Schema resultante:

- `sales` — cabeçalho da transação (id, student_id, operator_id, payment_method, total, created_at)
- `sale_items` — linhas da transação (id, sale_id, product_id, qty, unit_price)

**Justificativa:** Múltiplos itens por transação é o fluxo real da cantina (aluno compra lanche + bebida de uma vez). Separar cabeçalho de itens permite relatórios por produto e por transação.

### Formas de pagamento

**Decisão:** Campo `payment_method` no cabeçalho da venda com 3 valores possíveis: `credit` (débito do saldo do aluno), `cash` (dinheiro em espécie), `card` (cartão). O método se aplica à transação inteira, não por item.

**Justificativa:** Três formas de pagamento são necessárias para o controle de caixa diário. A granularidade por item seria desnecessária — uma transação usa uma forma de pagamento.

### Venda avulsa (sem aluno)

**Decisão:** Não definida nesta fase. `student_id` pode ser `NULL` para cobrir o caso se surgir, mas o fluxo padrão sempre vincula a um aluno.

### Estorno

**Decisão:** Apenas **supervisor** ou **admin** pode realizar estorno de uma venda. Sem restrição de janela de tempo além do papel (qualquer venda passada pode ser estornada por esses perfis).

**Justificativa:** Operador não tem permissão de estorno para evitar manipulação de registros. A ausência de janela de tempo deixa flexibilidade para corrigir erros antigos quando necessário.

### Saldo insuficiente em venda a crédito

**Decisão:** Se o saldo do aluno for menor que o total da venda e o pagamento for `credit`, a venda é **bloqueada** com `ValidationError`. O saldo nunca fica negativo via venda.

**Justificativa:** Controle de saldo é responsabilidade do módulo de crédito. A cantina não concede crédito implícito.

### Soft delete de estornos

**Decisão:** O estorno não exclui os registros. A tabela `sales` terá colunas `reversed_at` (timestamptz, nullable) e `reversed_by` (uuid FK→users, nullable). Estorno marca essas colunas e devolve o saldo atomicamente se o pagamento foi `credit`.

**Justificativa:** Auditoria completa — a operação original fica no histórico marcada como estornada.

### Cancelamento por operador

**Decisão:** Operador pode cancelar **própria venda dentro de 5 minutos** da criação (feature `delete:sale:self`). Após esse prazo, apenas supervisor/admin pode estornar (`delete:sale`).

**Justificativa:** Permite corrigir erros de digitação sem abrir permissão de estorno ampla para operadores.
