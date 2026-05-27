# Produto

**Summary**: Item comercializado na cantina, associado a vendas e ao controle de preços.

**Sources**: raw/prd.md, raw/decisions/produto.md

**Last updated**: 2026-05-27

---

Produtos são cadastrados pelo [[administrador]] e utilizados nas operações de [[venda]] pelo [[operador]]. (source: raw/prd.md)

## Campos

- `name` — nome do produto (obrigatório)
- `price` — preço em R$ (`DECIMAL(10,2)`, obrigatório)
- `category` — enum fixo: `lanche`, `bebida`, `vitamina`, `refeicao`, `sobremesa`
- `active` — flag boolean (`DEFAULT true`); produto inativo não aparece na tela de venda

(source: raw/decisions/produto.md)

## Regras de negócio

### Categorias

5 categorias fixas. "Vitamina" é separada de "bebida" por ser produto distinto (vitamina de fruta vs. suco/refrigerante/água). (source: raw/decisions/produto.md)

### Flag ativo/inativo

Produto inativo não aparece na tela de venda, mas permanece vinculado a registros históricos de [[venda|vendas]]. Não é deletado. (source: raw/decisions/produto.md)

### Histórico de preço

A venda grava `unit_price` no momento da transação (snapshot). Alterar o preço do produto não modifica vendas passadas. (source: raw/decisions/produto.md)

## Related pages

- [[venda]]
- [[administrador]]
- [[operador]]
