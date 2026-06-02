# Eventos Escolares

**Summary**: Módulo de eventos escolares — ciclo de vida desde a solicitação até a emissão de NF-e e cobrança da escola.

**Sources**: raw/decisions/eventos-integral.md, raw/fluxo-cantina.md

**Last updated**: 2026-06-02

---

## O que é

Eventos são serviços de alimentação prestados pela cantina em ocasiões especiais organizadas pelas escolas (festas, reuniões, atividades extracurriculares). Ocorrem com frequência (≥ 1–2 por mês) e representam parte relevante do faturamento.

## Ciclo de vida

1. **Solicitação**: escola solicita o evento com data, tipo e estimativa de consumo.
2. **Registro de consumo**: durante o evento, o operador registra os itens consumidos.
3. **Encerramento**: ao finalizar, o sistema calcula o valor total com base nos itens registrados.
4. **Cobrança**: geração da cobrança para a escola.
5. **NF-e**: emissão de NF-e (DANFE) referente ao evento.
6. **Acompanhamento**: registro do recebimento quando o pagamento ocorrer.

Hoje esse fluxo é **100% manual** — o cliente realiza a cobrança e emite as notas manualmente.

## Regras de negócio

- A cobrança é feita para a escola, não para alunos individualmente.
- Emissão de NF-e é obrigatória para cada evento.
- Frequência: ≥ 1–2 eventos por mês.

## Status de implementação

❌ **Não implementado.** Requer:

- Tabelas novas: `events`, `event_items`
- Entidade "escola" como cliente do evento
- Módulo fiscal (NF-e) — ver [[fiscal]]
- RBAC: quem pode criar/encerrar eventos (provavelmente supervisor/admin)

## Dependências

- [[fiscal]] — NF-e é requisito do fluxo
- [[gap-analysis]] — prioridade P3 no roadmap

## Related pages

- [[fluxo-operacional]]
- [[gap-analysis]]
- [[fiscal]]
- [[venda]]
- [[integral]]
