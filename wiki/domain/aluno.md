# Aluno

**Summary**: Entidade central do sistema — possui saldo de crédito e é associado a vendas e consumos.

**Sources**: raw/prd.md, raw/decisions/aluno.md

**Last updated**: 2026-06-12

---

O aluno é o beneficiário das operações da cantina. Cada aluno tem saldo de [[credito|créditos]] individual e pode ser do período integral (associado a [[pacote|pacotes]]). (source: raw/prd.md)

## Campos

- `name` — nome do aluno (obrigatório)
- `class` — turma como texto livre, ex: "3º A" (obrigatório)
- `is_full_time` — flag booleano indicando período integral
- `balance` — saldo em R$ (`DECIMAL(10,2)`)

Sem matrícula formal e sem dados de responsável nesta fase. (source: raw/decisions/aluno.md)

## Regras de negócio

### Período integral

Flag `is_full_time` no cadastro do aluno. Determina elegibilidade a [[pacote|pacotes]]. O pacote não cria um saldo separado — credita R$ no mesmo `balance`. (source: raw/decisions/aluno.md)

### Saldo negativo

Nenhuma operação normal deixa o saldo negativo: vendas a crédito são bloqueadas quando `balance < total` (source: raw/decisions/venda.md), e adição de crédito sempre soma um valor positivo.

### Deleção bloqueada por vínculos

Se o aluno possuir [[venda|vendas]] ou transações de [[credito|crédito]] associadas, a tentativa de exclusão retorna `ConflictError` (409):

```
{ "name": "ConflictError", "message": "Este aluno possui vendas ou créditos registrados e não pode ser excluído.", "action": "Remova todas as vendas e transações de crédito associadas antes de excluir o aluno.", "status_code": 409 }
```

A violação é detectada pelo código PostgreSQL `23503` (foreign key violation) capturado em `models/student.ts`.

## Related pages

- [[credito]]
- [[pacote]]
- [[venda]]
- [[operador]]
