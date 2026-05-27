# Operador

**Summary**: Persona responsável pelas operações do dia a dia da cantina — vendas, consumo, créditos e fechamento de caixa.

**Sources**: raw/prd.md

**Last updated**: 2026-05-27

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

## Perguntas em aberto

- Como a conta do Operador é criada? Admin faz chamada direta à API ou há fluxo de convite por e-mail? `[needs verification]`
- O Operador pode reverter (estornar) suas próprias vendas? Apenas no mesmo dia ou sem restrição de prazo? `[needs verification]`

## Related pages

- [[supervisor]]
- [[administrador]]
- [[venda]]
- [[credito]]
- [[fechamento-de-caixa]]
- [[seguranca]]
