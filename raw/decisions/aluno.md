---
source: q&a-2026-05-27
status: decided
---

# Decisão: Aluno

**Data:** 2026-05-27
**Status:** decided

## Decisões

### Campos obrigatórios

**Decisão:** `name` (texto) e `class` (texto livre, ex: "3º A"). Sem matrícula formal e sem dados de responsável.

**Justificativa:** A operação da cantina identifica o aluno pelo nome e turma. Matrícula e responsável não são necessários para o fluxo de venda/crédito nesta fase.

### Período integral

**Decisão:** Flag booleano `is_full_time` no próprio registro do aluno.

**Justificativa:** Simples e suficiente para determinar elegibilidade a pacotes. O pacote em si é um evento separado (crédito creditado na conta) e não requer uma relação complexa.

### Saldo negativo

**Decisão:** Venda com saldo insuficiente é permitida, mas exige confirmação explícita do operador. Uma vez que o saldo do aluno esteja negativo, o **operador não pode adicionar ou editar o saldo** — apenas supervisor ou admin podem creditar valores quando `balance < 0`.

**Justificativa:** Previne abuso: o operador não pode criar saldo negativo e em seguida corrigi-lo para mascarar a operação. A trava de edição força escalada para um perfil com mais responsabilidade.
