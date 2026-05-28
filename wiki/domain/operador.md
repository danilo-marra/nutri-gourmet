# Operador

**Summary**: Persona responsável pelas operações do dia a dia da cantina — vendas, consumo, créditos e fechamento de caixa.

**Sources**: raw/prd.md

**Last updated**: 2026-05-28

---

O Operador é o usuário que executa as operações rotineiras da cantina. Sua visibilidade é restrita: **não acessa dados financeiros globais** da operação. (source: raw/prd.md)

## Permissões

- Realizar [[venda|vendas]] diárias
- Registrar consumo por [[aluno]]
- Gerenciar [[credito|créditos]] individuais
- Executar [[fechamento-de-caixa|fechamento de caixa]] diário

## O que o Operador não acessa

- Faturamento consolidado
- Relatórios financeiros globais
- Dados de desempenho de vendas agregados

## Criação da conta

Admin ou Supervisor cria via painel → convite por e-mail usando o fluxo de ativação existente (`models/activation.js`). Mesmo fluxo do [[supervisor]]. (source: raw/decisions/operacoes.md, raw/decisions/supervisor.md)

## Cancelamento de vendas

O operador pode **cancelar a própria venda em até 5 minutos** após o registro (feature `delete:sale:self`). Após esse prazo, apenas [[supervisor]] ou [[administrador]] podem estornar. (source: raw/decisions/venda.md)

## Related pages

- [[supervisor]]
- [[administrador]]
- [[venda]]
- [[credito]]
- [[fechamento-de-caixa]]
- [[seguranca]]
