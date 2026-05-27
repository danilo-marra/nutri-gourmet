# Escopo — O que está fora desta fase

**Summary**: Lista de funcionalidades explicitamente excluídas do escopo desta fase do projeto.

**Sources**: raw/prd.md

**Last updated**: 2026-05-27

---

Para garantir previsibilidade e foco no núcleo da operação, os itens abaixo **não fazem parte desta fase**: (source: raw/prd.md)

- **Aplicativo mobile** — sem app para pais ou gestão
- **Integrações fiscais** — sem NF-e, integração com sistemas externos de contabilidade ou fiscais
- **Múltiplas unidades** — sistema single-tenant, uma cantina apenas
- **Novos módulos** — qualquer funcionalidade fora do levantamento inicial está fora de escopo

## Implicação para implementação

Decisões de arquitetura não precisam contemplar multi-tenancy, offline-first, ou emissão fiscal nesta fase. Evitar over-engineering para esses casos.

## Related pages

- [[prd-summary]]
- [[seguranca]]
