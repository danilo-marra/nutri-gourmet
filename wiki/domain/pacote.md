# Pacote

**Summary**: Modalidade de crédito pré-definida para alunos do período integral — credita R$ no saldo do aluno.

**Sources**: raw/prd.md, raw/decisions/credito-pacote.md

**Last updated**: 2026-05-27

---

Pacotes são uma forma estruturada de [[credito|crédito]] específica para alunos do período integral (`is_full_time = true`). (source: raw/prd.md)

## Modelo

O pacote credita um valor em R$ diretamente no `balance` do [[aluno]]. Não existe saldo separado para pacotes — o crédito entra no mesmo pool do crédito avulso. O evento de crédito é registrado com `type = 'package'` em `credit_transactions` para rastreabilidade. (source: raw/decisions/credito-pacote.md)

## Regras de negócio

### Validade

Sem vencimento por padrão (`expires_at = NULL`). [[administrador|Admin]] ou [[supervisor]] podem definir uma data de expiração ao criar o pacote. A query de pacotes vigentes filtra por `expires_at IS NULL OR expires_at > NOW()`. (source: raw/decisions/credito-pacote.md)

### Quem pode registrar

Apenas **supervisor** e **admin**. O [[operador]] não tem acesso ao módulo de pacotes. (source: raw/decisions/credito-pacote.md)

### Múltiplos pacotes simultâneos

Permitido sem limite. Cada pacote é um evento em `credit_transactions` com `type = 'package'`. O crédito vai direto ao pool de saldo — não há controle de "pacote ativo" que bloqueie novo registro. (source: raw/decisions/credito-pacote.md)

## Related pages

- [[credito]]
- [[aluno]]
- [[supervisor]]
- [[administrador]]
