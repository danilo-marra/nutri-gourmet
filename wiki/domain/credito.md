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

Com a implementação atual, nenhuma operação normal deixa o saldo negativo: adição de crédito sempre soma um valor positivo ao `balance`, e vendas a crédito são bloqueadas quando `balance < total`. (source: raw/decisions/venda.md)

Se o saldo estiver negativo por qualquer razão (ex: ajuste manual no banco), apenas **supervisor** ou **admin** podem adicionar crédito — operador fica bloqueado. Isso é uma guarda defensiva, não um fluxo normal. (source: raw/decisions/credito-pacote.md)

### Adição de crédito

Implementado via `POST /api/v1/students/:id/credits`. A tabela `credit_transactions` registra cada evento com `type` (`manual` ou `package`), `amount`, `balance_after` e `operator_id` para auditoria. (source: raw/decisions/credito-pacote.md)

## Related pages

- [[aluno]]
- [[pacote]]
- [[venda]]
- [[operador]]
