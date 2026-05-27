# Venda

**Summary**: Registro de uma transação comercial na cantina, associando produto(s), aluno e forma de pagamento.

**Sources**: raw/prd.md, raw/decisions/venda.md

**Last updated**: 2026-05-27 (atualizado após implementação do módulo)

---

A venda é o principal evento operacional do sistema. É realizada pelo [[operador]] e registra o consumo de [[produto|produtos]] por um [[aluno]]. (source: raw/prd.md)

## Schema

Duas tabelas:

**`sales`** — cabeçalho da transação

- `id`, `student_id` (nullable — venda avulsa futura), `operator_id`, `payment_method`, `total`
- `reversed_at` (timestamptz, nullable), `reversed_by` (uuid FK→users, nullable) — preenchidos no estorno
- `created_at`, `updated_at`

**`sale_items`** — linhas da transação

- `id`, `sale_id`, `product_id`, `qty`, `unit_price`, `created_at`, `updated_at`

`unit_price` é snapshot do preço no momento da venda. (source: raw/decisions/venda.md)

## Formas de pagamento

Campo `payment_method` no cabeçalho da venda (não por item):

- `credit` — débito do saldo do [[aluno]]
- `cash` — dinheiro em espécie
- `card` — cartão

(source: raw/decisions/venda.md)

## Saldo insuficiente (pagamento credit)

Se o saldo do [[aluno]] for inferior ao total da venda, a venda é **bloqueada** com `ValidationError`. O debit é feito atomicamente com `WHERE balance >= total` para prevenir race conditions. (source: raw/decisions/venda.md)

Nota: essa regra difere do módulo de [[credito|crédito]], onde adição de crédito pode resultar em saldo negativo em casos específicos.

## Cancelamento e estorno

| Quem               | O quê                      | Janela                     |
| ------------------ | -------------------------- | -------------------------- |
| Operador           | Cancelar **própria** venda | Até 5 minutos após criação |
| Supervisor / Admin | Estornar qualquer venda    | Sem restrição de tempo     |

O estorno usa **soft delete**: preenche `reversed_at` e `reversed_by` na tabela `sales`. A venda original permanece no histórico. Se o pagamento foi `credit`, o saldo é devolvido atomicamente. (source: raw/decisions/venda.md)

## Venda avulsa

Não definida nesta fase. `student_id` aceita `NULL` para cobrir o caso se surgir operacionalmente. (source: raw/decisions/venda.md)

## Related pages

- [[aluno]]
- [[produto]]
- [[credito]]
- [[operador]]
- [[fechamento-de-caixa]]
