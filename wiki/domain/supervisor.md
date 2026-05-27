# Supervisor

**Summary**: Persona de nível intermediário com acesso a relatórios, estorno, pacotes, cadastros globais e gestão de operadores.

**Sources**: raw/prd.md, raw/decisions/supervisor.md

**Last updated**: 2026-05-27

---

O Supervisor ocupa um nível intermediário entre [[operador]] e [[administrador]]. Cobre todos os casos onde o Operador é bloqueado por política e tem acesso a informações de supervisão operacional. (source: raw/decisions/supervisor.md)

## Permissões

Herda todas as permissões do [[operador]], mais:

- **Estorno de vendas** — único nível abaixo de admin com essa permissão.
- **Registro de pacotes** — junto com admin; operador não pode registrar.
- **Creditar saldo negativo** — quando `balance < 0`, operador é bloqueado; supervisor pode creditar.
- **Fechar caixa em nome de operador** — delegação com registro de `closed_by_id` distinto do `operator_id`.
- **Relatórios** — acesso a todos os 5 relatórios operacionais e financeiros (ver [[relatorios]]).
- **Criar/editar contas de Operador** — supervisor gerencia os operadores.
- **Cadastros globais (alunos, produtos)** — supervisor pode criar e editar alunos e produtos.

(source: raw/decisions/supervisor.md)

## O que o Supervisor não acessa

- Criar ou editar contas de Supervisor ou Admin — exclusivo do [[administrador]].

## Criação da conta

Admin cria via painel → convite por e-mail usando o fluxo de ativação existente (`models/activation.js`). Mesmo fluxo do [[operador]]. (source: raw/decisions/supervisor.md)

## Related pages

- [[operador]]
- [[administrador]]
- [[relatorios]]
- [[seguranca]]
