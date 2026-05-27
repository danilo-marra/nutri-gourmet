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

Venda com saldo insuficiente é permitida com confirmação explícita do [[operador]]. Uma vez negativo, apenas **supervisor** ou **admin** podem adicionar crédito — operador não pode editar `balance < 0`. (source: raw/decisions/credito-pacote.md)

### Adição de crédito

O mecanismo operacional (caixa físico, transferência) será detalhado no módulo de créditos. O schema deve incluir tabela `credit_transactions` com campo `type` (`manual`, `package`) para auditoria.

## Related pages

- [[aluno]]
- [[pacote]]
- [[venda]]
- [[operador]]
