---
source: q&a-2026-06-02
status: decided
---

# Decisões — Eventos Escolares e Módulo Integral

Respostas do cliente (dono da cantina) em sessão de Q&A realizada em 2026-06-02.

## Eventos Escolares

- Ocorrem com frequência: em média ≥ 1 por mês, podendo haver 2 eventos mensais.
- Representam parte relevante do faturamento — devem ser considerados no desenho do sistema.
- Ciclo de vida: escola solicita evento → consumo registrado durante o evento → evento encerrado → sistema calcula valor total → emite NF-e (DANFE) → gera cobrança → acompanha recebimento.
- Cobrança pós-evento é manual hoje — realizada pelo próprio cliente.
- Emissão de NF-e é requisito do fluxo de eventos.

## Módulo Integral (Faturamento Recorrente)

- Alunos com `is_full_time = true` no cadastro geram faturamento recorrente para a escola.
- Recebimento em **10 parcelas ao longo do ano letivo**.
- Cada parcela requer **emissão mensal de NF-e**.
- Cobrado da escola (não do aluno individualmente).
- Hoje o fluxo é 100% manual: o cliente realiza a cobrança e emite as notas fiscais manualmente.
- O campo `is_full_time` já existe no schema da tabela `students` (ver raw/decisions/aluno.md).
