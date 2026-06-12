# Produto

**Summary**: Item comercializado na cantina, associado a vendas e ao controle de preços.

**Sources**: raw/prd.md, raw/decisions/produto.md

**Last updated**: 2026-06-12 (PR #91)

---

Produtos são cadastrados e gerenciados por [[supervisor]] ou [[administrador]], e utilizados nas operações de [[venda]] pelo [[operador]]. (source: raw/prd.md, raw/decisions/supervisor.md)

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

### Nome único

O campo `name` tem constraint `UNIQUE` no banco (migration `1781212125290_add-products-name-unique`). Tentativa de criar ou renomear um produto para um nome já existente retorna **409 `ConflictError`** com mensagem `"Já existe um produto com este nome."` — tratamento implementado em `models/product.ts` para as funções `create()` e `update()`, capturando o código PostgreSQL `23505` via `err.cause?.code`, seguindo o mesmo padrão de `models/student.ts`. (PR #91)

### Histórico de preço

A venda grava `unit_price` no momento da transação (snapshot). Alterar o preço do produto não modifica vendas passadas. (source: raw/decisions/produto.md)

## Related pages

- [[venda]]
- [[administrador]]
- [[operador]]
