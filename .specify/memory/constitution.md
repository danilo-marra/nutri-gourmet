<!--
Sync Impact Report
- Version change: template -> 1.0.0
- Modified principles:
	- Placeholder Principle 1 -> I. Contrato e Compatibilidade da API v1
	- Placeholder Principle 2 -> II. Segurança de Sessão e Controle de Acesso
	- Placeholder Principle 3 -> III. Testes de Integração como Gate de Mudança
	- Placeholder Principle 4 -> IV. Padrões de Dados e Migrations Seguras
	- Placeholder Principle 5 -> V. Observabilidade, Erros Tipados e Proteção de Segredos
- Added sections:
	- Diretrizes de DX e Qualidade
	- Checklist de Conformidade para PR
- Removed sections:
	- Nenhuma
- Templates requiring updates:
	- ✅ .specify/templates/plan-template.md
	- ✅ .specify/templates/spec-template.md
	- ✅ .specify/templates/tasks-template.md
	- ✅ .specify/templates/checklist-template.md
- Deferred TODOs:
	- Nenhum
-->

# Constituição do Projeto Nutri Gourmet

## Core Principles

### I. Contrato e Compatibilidade da API v1

- Endpoints em `pages/api/v1/**` MUST manter compatibilidade retroativa dentro da versão `v1`.
- Toda mudança de payload de sucesso MUST preservar campos existentes; novos campos MUST ser aditivos.
- Toda mudança de payload de erro MUST preservar o contrato `{ name, message, action, status_code }`.
- Remoção/renomeação de campo, mudança de semântica ou alteração de status HTTP em `v1` MUST ser tratada como breaking change e exigir novo versionamento de API.
- Novos endpoints `v1` MUST seguir o padrão atual de handlers (`next-connect`, `controller.errorHandlers`, middlewares de autenticação/autorização).

Rationale: o projeto expõe API pública em `v1` e já possui suíte de integração baseada em contrato.

### II. Segurança de Sessão e Controle de Acesso

- Sessão autenticada MUST usar cookie `session_id` com `httpOnly`, `path=/`, `maxAge` alinhado ao TTL de sessão e `secure` em produção.
- Token de sessão MUST ser persistido em banco e validado por expiração (`expires_at > NOW()`).
- Logout MUST invalidar sessão no banco e limpar cookie no cliente.
- Controle de acesso MUST usar `authorization.can(user, feature, resource?)` e nunca lógica de permissão inline no endpoint.
- Respostas com dados sensíveis MUST passar por `authorization.filterOutput` ou mecanismo equivalente de whitelisting.
- Features RBAC novas MUST ser declaradas de forma explícita e cobertas por testes de autorização positiva e negativa.

Rationale: o modelo atual depende de sessão persistida e RBAC por feature com filtro de saída.

### III. Testes de Integração como Gate de Mudança

- Mudanças em autenticação, sessão, autorização, ativação de conta, migrations e contratos de API MUST incluir testes de integração em `tests/integration/**`.
- Toda correção de bug em fluxo crítico MUST incluir teste que falha antes da correção e passa após a implementação.
- PRs que alteram `pages/api/v1/**`, `models/session.js`, `models/authorization.js`, `models/activation.js` ou `infra/controller.js` MUST executar `npm test` com sucesso.
- Cobertura mínima por fluxo crítico MUST existir com pelo menos 1 cenário feliz e 1 cenário de negação/erro para:
  - criação de usuário e ativação
  - login/logout por sessão
  - autorização RBAC por feature

Rationale: a estabilidade funcional do projeto é garantida principalmente por testes de integração com orquestrador.

### IV. Padrões de Dados e Migrations Seguras

- Alterações de schema MUST ser feitas exclusivamente via `node-pg-migrate` em `infra/migrations`.
- Toda migration nova MUST conter estratégia explícita de rollback (`exports.down`) ou justificativa documentada quando tecnicamente impossível.
- Migrations MUST ser idempotentes na operação pretendida e seguras para reexecução controlada em ambientes de deploy.
- Mudanças potencialmente bloqueantes (reescrita de tabela, backfill grande, constraints pesadas) MUST seguir abordagem de zero-downtime quando possível.
- Timestamps MUST permanecer em `timestamptz` com padrão UTC consistente com o schema existente.

Rationale: o projeto usa PostgreSQL com histórico de migrations e precisa preservar disponibilidade e auditabilidade.

### V. Observabilidade, Erros Tipados e Proteção de Segredos

- Erros de domínio e validação MUST usar classes tipadas em `infra/errors.js` e serialização JSON estável.
- Erros inesperados MUST ser encapsulados como `InternalServerError` para resposta pública.
- Logs MUST ser estruturados o suficiente para diagnóstico e MUST NOT incluir senha, token de sessão, segredo SMTP, `DATABASE_URL` ou cookie cru.
- Fluxos críticos (autenticação, autorização negada, falha de serviço externo) SHOULD registrar contexto mínimo rastreável sem vazamento de segredo.
- Contratos de erro MUST preservar mensagens orientadas à ação para clientes da API.

Rationale: o projeto já possui hierarquia de erro tipada e precisa observabilidade segura em produção.

## Diretrizes de DX e Qualidade

- Código MUST seguir Prettier e ESLint do repositório antes de merge.
- Commits SHOULD seguir convenção semântica (Commitizen/Commitlint) e ser pequenos o suficiente para revisão efetiva.
- Toda PR MUST explicitar impacto em API, segurança e banco de dados.
- Revisão técnica MUST verificar aderência à Constituição e apontar desvios de contrato explicitamente.
- Mudanças em variáveis de ambiente, scripts ou fluxo de desenvolvimento MUST atualizar documentação aplicável no mesmo PR.

## Checklist de Conformidade para PR

- [ ] Não houve breaking change silenciosa na API `v1`.
- [ ] Contratos de erro/resposta permaneceram compatíveis ou foram versionados corretamente.
- [ ] Sessão/cookie e RBAC foram aplicados com `authorization.can` + filtragem de saída.
- [ ] Fluxos críticos alterados possuem teste de integração cobrindo sucesso e falha.
- [ ] Migration (quando aplicável) possui rollback/justificativa, risco documentado e estratégia de deploy segura.
- [ ] Logs e tratamento de erro não expõem segredos.
- [ ] `npm test` passou para mudanças em áreas críticas.
- [ ] Lint/format e revisão de código foram concluídos.

## Governance

- Esta Constituição prevalece sobre convenções locais não documentadas.
- Toda PR MUST declarar conformidade com a seção "Checklist de Conformidade para PR".
- Mudanças nesta Constituição MUST incluir:
  - justificativa da mudança
  - impacto esperado no fluxo de desenvolvimento
  - atualização dos templates do Spec Kit afetados
- Política de versionamento da Constituição (SemVer):
  - MAJOR: remoção/redefinição incompatível de princípio ou governança
  - MINOR: novo princípio, seção obrigatória nova ou expansão normativa material
  - PATCH: esclarecimentos editoriais sem mudança normativa
- Revisão de compliance MUST ocorrer em toda PR que altere API v1, autenticação/autorização, migrations ou tratamento de erro.

**Version**: 1.0.0 | **Ratified**: 2026-05-20 | **Last Amended**: 2026-05-20
