---
source: q&a-2026-05-27
status: decided
---

# Decisão: Produto

**Data:** 2026-05-27
**Status:** decided

## Decisões

### Campos obrigatórios

**Decisão:** `name` (texto), `price` (decimal, ex: `DECIMAL(10,2)`), `category` (enum fixo), `active` (boolean, default `true`).

**Justificativa:** Campos mínimos para viabilizar vendas e relatórios por categoria.

### Categorias

**Decisão:** Enum fixo com 5 valores: `lanche`, `bebida`, `vitamina`, `refeicao`, `sobremesa`.

**Justificativa:** Categorias livres causam inconsistência nos relatórios. "Vitamina" é separada de "bebida" por ser um produto distinto na cantina (vitamina de fruta vs. suco/refrigerante/água).

### Flag ativo/inativo

**Decisão:** Campo `active boolean NOT NULL DEFAULT true`. Produto inativo não aparece na tela de venda mas permanece vinculado a registros históricos de vendas.

**Justificativa:** Permite descontinuar produtos sem perda de rastreabilidade histórica.

### Histórico de preço

**Decisão:** A venda grava `unit_price` no momento da transação (snapshot). Alterar o preço do produto não modifica registros de vendas passadas.

**Justificativa:** Consistência histórica é requisito para relatórios financeiros confiáveis. Sem isso, recalcular o faturamento de períodos passados seria impossível.
