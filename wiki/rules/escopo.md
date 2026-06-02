# Escopo — O que está fora desta fase

**Summary**: Lista de funcionalidades explicitamente excluídas do escopo desta fase do projeto.

**Sources**: raw/prd.md, raw/decisions/sistemas-externos.md, raw/decisions/eventos-integral.md

**Last updated**: 2026-06-02

---

Para garantir previsibilidade e foco no núcleo da operação, os itens abaixo **não fazem parte desta fase**: (source: raw/prd.md)

- **Aplicativo mobile** — sem app para pais ou gestão
- **Integrações fiscais** — sem NF-e, integração com sistemas externos de contabilidade ou fiscais
- **Múltiplas unidades** — sistema single-tenant, uma cantina apenas
- **Novos módulos** — qualquer funcionalidade fora do levantamento inicial está fora de escopo

## Implicação para implementação

Decisões de arquitetura não precisam contemplar multi-tenancy, offline-first, ou emissão fiscal nesta fase. Evitar over-engineering para esses casos.

## Expectativa do cliente vs. Phase 1

Os documentos operacionais elaborados pelo cliente (raw/fluxo-cantina.md, raw/mapeamento-sistemas-atuais.md) descrevem um sistema mais amplo do que o Phase 1 cobre. Os itens abaixo são esperados pelo cliente mas **intencionalmente adiados**:

| Expectativa do cliente                           | Por que está fora do Phase 1                                                 |
| ------------------------------------------------ | ---------------------------------------------------------------------------- |
| Integração com Stone (webhook de pagamento)      | Viável tecnicamente; aguarda decisão de priorização                          |
| Integração com Vlupt (recarga automática)        | Viável se Vlupt tiver API; aguarda confirmação com suporte                   |
| Integração com MarketUp (push de venda / fiscal) | API limitada/fechada; emissão fiscal permanece no MarketUp                   |
| Controle de estoque próprio                      | MarketUp cobre; construir só se MarketUp sair                                |
| Emissão de NFC-e / NF-e / DANFE                  | ⚠️ **Backlog prioritário** — risco fiscal ativo (Q&A 2026-06-02)             |
| Eventos escolares (Fluxo 4)                      | ⚠️ **Backlog prioritário** — faturamento perdido, ≥ 1–2/mês (Q&A 2026-06-02) |
| Módulo Integral (faturamento recorrente)         | ⚠️ **Backlog prioritário** — 10 parcelas/ano, NF-e mensal, 100% manual hoje  |
| Multi-escola / multi-unidade                     | Single-tenant por decisão arquitetural do Phase 1                            |
| Relatórios por escola / unidade                  | Bloqueados por multi-unidade                                                 |

**Nota (Q&A 2026-06-02)**: os itens marcados com ⚠️ foram elevados a backlog prioritário após sessão de Q&A com o cliente. Vendas Stone não estão sendo registradas (risco fiscal ativo); eventos ocorrem ≥ 1–2/mês com cobrança manual; Integral tem 10 parcelas/ano com NF-e manual. Esses itens saem da categoria "fora de escopo definitivo" e entram no roadmap de Phase 2. Ver [[fiscal]] e [[gap-analysis]].

Ver [[gap-analysis]] para o consolidado completo de o que está implementado vs. o que falta.

## Related pages

- [[prd-summary]]
- [[seguranca]]
- [[gap-analysis]]
- [[fluxo-operacional]]
- [[fiscal]]
