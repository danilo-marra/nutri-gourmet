# Segurança e Controle de Acesso

**Summary**: Regras de visibilidade e restrição de dados por perfil de usuário.

**Sources**: raw/prd.md, raw/decisions/supervisor.md

**Last updated**: 2026-05-27

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
- Nunca incluir lógica de permissão inline nos handlers

## Related pages

- [[operador]]
- [[supervisor]]
- [[administrador]]
- [[escopo]]
