# Venda

**Summary**: Registro de uma transação comercial na cantina, associando produto(s), aluno e forma de pagamento.

**Sources**: raw/prd.md, raw/decisions/venda.md

**Last updated**: 2026-05-27

---

A venda é o principal evento operacional do sistema. É realizada pelo [[operador]] e registra o consumo de [[produto|produtos]] por um [[aluno]]. (source: raw/prd.md)

## Schema

Duas tabelas:

**`sales`** — cabeçalho da transação

- `id`, `student_id`, `operator_id`, `payment_method`, `total`, `created_at`

**`sale_items`** — linhas da transação

- `id`, `sale_id`, `product_id`, `qty`, `unit_price`

`unit_price` é snapshot do preço no momento da venda. (source: raw/decisions/venda.md)

## Formas de pagamento

Campo `payment_method` no cabeçalho da venda (não por item):

- `credit` — débito do saldo do [[aluno]]
- `cash` — dinheiro em espécie
- `card` — cartão

(source: raw/decisions/venda.md)

## Estorno

Apenas **supervisor** ou **admin** pode realizar estorno. Operador não tem permissão. Sem restrição de janela de tempo além do papel. (source: raw/decisions/venda.md)

## Venda avulsa

Não definida nesta fase. `student_id` aceita `NULL` para cobrir o caso se surgir operacionalmente. (source: raw/decisions/venda.md)

## Related pages

- [[aluno]]
- [[produto]]
- [[credito]]
- [[operador]]
- [[fechamento-de-caixa]]
