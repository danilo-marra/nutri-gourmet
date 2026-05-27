# Crédito

**Summary**: Saldo individual de um aluno em R$, usado para pagamento de vendas na cantina.

**Sources**: raw/prd.md, raw/decisions/credito-pacote.md

**Last updated**: 2026-05-27

---

Cada [[aluno]] possui um saldo de crédito individual em R$. O crédito é a principal forma de pagamento nas [[venda|vendas]]. (source: raw/prd.md)

## Modelo

Saldo monetário em R$ — campo `balance DECIMAL(10,2)` no cadastro do aluno. Crédito avulso e crédito de [[pacote]] compartilham o mesmo pool (não há saldo separado). (source: raw/decisions/credito-pacote.md)

## Regras de negócio

### Saldo negativo

**Adição de crédito**: operador pode creditar mesmo resultando em `balance < 0`. Uma vez negativo, operador fica bloqueado de novos créditos — apenas supervisor ou admin podem creditar. (source: raw/decisions/credito-pacote.md)

**Venda a crédito**: saldo insuficiente **bloqueia a venda** — não há confirmação implícita. Ver [[venda]]. (source: raw/decisions/venda.md)

### Adição de crédito

Implementado via `POST /api/v1/students/:id/credits`. A tabela `credit_transactions` registra cada evento com `type` (`manual` ou `package`), `amount`, `balance_after` e `operator_id` para auditoria. (source: raw/decisions/credito-pacote.md)

## Related pages

- [[aluno]]
- [[pacote]]
- [[venda]]
- [[operador]]
