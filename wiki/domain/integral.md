# Integral (Faturamento Recorrente)

**Summary**: Módulo de faturamento recorrente para alunos em período integral — 10 parcelas por ano letivo com emissão mensal de NF-e.

**Sources**: raw/decisions/eventos-integral.md, raw/decisions/aluno.md

**Last updated**: 2026-06-02

---

## O que é

O módulo Integral cobre o faturamento recorrente gerado por alunos cadastrados como `is_full_time = true`. A cantina presta serviço de alimentação para esses alunos ao longo do ano letivo e cobra da escola em parcelas mensais.

## Regras de negócio

- **Elegibilidade**: alunos com `is_full_time = true` no cadastro (campo já existe na tabela `students`).
- **Parcelas**: 10 por ano letivo.
- **NF-e**: uma nota fiscal por parcela mensal — emissão obrigatória.
- **Destinatário**: a cobrança é feita para a escola, não para o aluno individualmente.
- **Hoje**: fluxo 100% manual — o cliente realiza a cobrança e emite as NF-es manualmente.

## Status de implementação

❌ **Não implementado.** Requer:

- Tabela nova para registrar parcelas e status de recebimento (ex.: `recurring_invoices`)
- Lógica de geração das 10 parcelas no início do ano letivo
- Módulo fiscal (NF-e) — ver [[fiscal]]
- RBAC: quem acessa (provavelmente supervisor/admin)

O campo `is_full_time` já existe no schema de `students` — não requer migration adicional para esse campo.

## Dependências

- [[fiscal]] — NF-e é requisito do fluxo
- [[aluno]] — `is_full_time` já definido
- [[gap-analysis]] — prioridade P4 no roadmap

## Related pages

- [[aluno]]
- [[fluxo-operacional]]
- [[fiscal]]
- [[gap-analysis]]
- [[eventos]]
