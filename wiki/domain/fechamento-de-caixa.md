# Fechamento de Caixa

**Summary**: Operação diária que consolida as vendas do turno — recomendada mas não bloqueante.

**Sources**: raw/prd.md, raw/decisions/operacoes.md

**Last updated**: 2026-05-27

---

O fechamento de caixa é realizado pelo [[operador]] ao fim do dia e está integrado ao módulo de Operação de Caixa e Vendas. (source: raw/prd.md)

## Regras de negócio

### Obrigatoriedade

Recomendado, mas não bloqueante. O sistema não impede novas vendas se o caixa do dia anterior não foi fechado. Dias sem fechamento ficam com status `pending` nos relatórios. (source: raw/decisions/operacoes.md)

### Relatório gerado

O fechamento gera um resumo básico visível por [[supervisor]] e [[administrador]], contendo:

- Total de vendas do dia
- Total por forma de pagamento (`credit`, `cash`, `card`)
- Nome do operador responsável pelo fechamento

(source: raw/decisions/operacoes.md)

### Delegação

[[supervisor|Supervisor]] ou [[administrador|admin]] pode fechar o caixa em nome do [[operador]]. O registro do fechamento guarda o `operator_id` (dono do turno) e o `closed_by_id` (quem executou o fechamento). (source: raw/decisions/operacoes.md)

## Related pages

- [[operador]]
- [[supervisor]]
- [[administrador]]
- [[venda]]
