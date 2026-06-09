# Crédito

**Summary**: Saldo individual de um aluno em R$, usado para pagamento de vendas na cantina.

**Sources**: raw/prd.md, raw/decisions/credito-pacote.md

**Last updated**: 2026-06-09

---

Cada [[aluno]] possui um saldo de crédito individual em R$. O crédito é a principal forma de pagamento nas [[venda|vendas]]. (source: raw/prd.md)

## Modelo

Saldo monetário em R$ — campo `balance DECIMAL(10,2)` no cadastro do aluno. Crédito avulso e crédito de [[pacote]] compartilham o mesmo pool (não há saldo separado). (source: raw/decisions/credito-pacote.md)

## Regras de negócio

### Saldo negativo

Nenhuma operação normal deixa o saldo negativo: adição de crédito sempre soma um valor positivo ao `balance`, e vendas a crédito são bloqueadas quando `balance < total`. (source: raw/decisions/venda.md)

### Adição de crédito

Implementado via `POST /api/v1/students/:id/credits`. A tabela `credit_transactions` registra cada evento com `type` (`manual`, `package` ou `stone`), `amount`, `balance_after` e `operator_id` para auditoria. (source: raw/decisions/credito-pacote.md)

Transações do tipo `stone` são geradas pelo fluxo de reconciliação Stone/Pagar.me: o webhook cria um registro em `pending_stone_payments`, e o supervisor vincula o pagamento a um aluno via `POST /api/v1/stone-payments/[id]/match`. A coluna `stone_payment_id` em `credit_transactions` garante idempotência. Ver [[stone-webhook]].

## Related pages

- [[aluno]]
- [[pacote]]
- [[venda]]
- [[operador]]
- [[stone-webhook]]
