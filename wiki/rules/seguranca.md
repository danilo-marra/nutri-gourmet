# Segurança e Controle de Acesso

**Summary**: Regras de visibilidade e restrição de dados por perfil de usuário.

**Sources**: raw/prd.md, raw/decisions/supervisor.md

**Last updated**: 2026-05-29

---

Segurança da informação é um pilar do sistema. Cada usuário deve visualizar **apenas o necessário para sua função**. Dados financeiros sensíveis não podem ser expostos a funcionários sem permissão. (source: raw/prd.md)

## Princípio geral

> "Garantindo que cada usuário visualize apenas o necessário para sua função."

Isso se traduz diretamente no RBAC já implementado via `users.role` e `authorization.can(user, feature, resource?)`.

## Tabela de permissões por persona

| Permissão                            | [[operador]] | [[supervisor]] | [[administrador]] |
| ------------------------------------ | ------------ | -------------- | ----------------- |
| Realizar vendas                      | ✅           | ✅             | ✅                |
| Registrar consumo de crédito         | ✅           | ✅             | ✅                |
| Fechar caixa do próprio turno        | ✅           | ✅             | ✅                |
| Cancelar própria venda (5 min)       | ✅           | ✅             | ✅                |
| Estornar qualquer venda (sem prazo)  | ❌           | ✅             | ✅                |
| Registrar pacotes                    | ❌           | ✅             | ✅                |
| Creditar saldo negativo              | ❌           | ✅             | ✅                |
| Fechar caixa em nome de operador     | ❌           | ✅             | ✅                |
| Relatórios (todos os 5)              | ❌           | ✅             | ✅                |
| Criar/editar contas de Operador      | ❌           | ✅             | ✅                |
| Criar/editar contas de Supervisor    | ❌           | ❌             | ✅                |
| Cadastros globais (alunos, produtos) | ❌           | ✅             | ✅                |

(source: raw/decisions/supervisor.md)

## Implementação

- Controle via `authorization.can()` e `authorization.filterOutput()` em `models/authorization.js`
- Atribuição de `role` centralizada em `authorization.canAssignRole()` — só admin atribui supervisor/admin; demais ficam limitados a operador|pending
- Nunca incluir lógica de permissão inline nos handlers

## Achados de auditoria (skill `security-check`, 2026-05-29)

Auditoria OWASP Top 10 pontual sobre o repo. Detalhes em `.claude/skills/security-check/`.

**Corrigido (🔴):** escalada de privilégio em `PATCH` e `POST /api/v1/users` — um não-admin (operador autenticado, ou usuário com `update:user:others`/`create:user` concedido por feature manual) conseguia se auto-promover ou criar uma conta **admin** via `role` no body. A regra foi centralizada em `authorization.canAssignRole()`: só admin atribui supervisor/admin; os demais ficam limitados a operador|pending. (PR #29)

**Dívidas conhecidas (🟡, adiadas conscientemente):**

- **Sem rate limiting no login** (`POST /api/v1/sessions`) — sem proteção a brute-force. Aceitável no contexto single-tenant; reavaliar antes de exposição pública. Rastreado na issue #30.
- **Resíduo de role inline** — os caps de atribuição de role foram centralizados em `authorization.canAssignRole()` (PR #29). Resta um único check inline em `pages/api/v1/users/index.js:18` (`getHandler`), que decide quais roles o supervisor enxerga na listagem de usuários. É filtro de leitura, não de permissão de escrita; centralizar é opcional e de baixa prioridade.

## Related pages

- [[operador]]
- [[supervisor]]
- [[administrador]]
- [[escopo]]
