# Administrador (Gestora)

**Summary**: Persona com acesso total ao sistema, incluindo dados financeiros e relatórios consolidados.

**Sources**: raw/prd.md, infra/scripts/seed-admin.js

**Last updated**: 2026-06-11

---

O Administrador — referido no PRD como "Gestora" — tem visibilidade completa da operação. É o único perfil que acessa dados financeiros globais e relatórios gerenciais consolidados. (source: raw/prd.md)

## Permissões

- Acesso total ao sistema
- Visualização de faturamento
- Relatórios financeiros consolidados
- Dados de desempenho de vendas
- Visão global da operação
- Cadastro de usuários, alunos e produtos

## Criação da conta

Via seed script: `npm run seed:admin` (`infra/scripts/seed-admin.js`) cria ou promove um usuário a `role = 'admin'` por upsert no email. Requer `ADMIN_EMAIL` e `ADMIN_PASSWORD` (mín. 8 caracteres) como variáveis de ambiente; `ENV_PATH` seleciona o arquivo de env (padrão `.env.development`). Não há fluxo de convite para admin — diferente de [[operador]] e [[supervisor]]. (source: infra/scripts/seed-admin.js)

## Perguntas em aberto

- Pode haver mais de um Administrador simultaneamente? Tecnicamente sim — o seed não impõe limite e nada no schema restringe; nenhuma decisão de negócio registrada. `[needs verification]`

## Related pages

- [[operador]]
- [[supervisor]]
- [[seguranca]]
- [[prd-summary]]
