# Ativação de Conta

**Summary**: Fluxo de ativação de novas contas criadas via convite — token de uso único enviado por email, válido por 15 minutos.

**Sources**: models/activation.ts, pages/api/v1/activations/[token_id]/index.ts, pages/api/v1/users/index.ts

**Last updated**: 2026-06-12

---

Novas contas são criadas por [[supervisor]] ou [[administrador]] via `POST /api/v1/users`. O sistema envia um email de ativação ao novo usuário, que deve clicar no link para ativar a conta e definir seu role como operador.

## Fluxo completo

1. Supervisor/admin faz `POST /api/v1/users` com nome, email e role desejado
2. A conta é criada com `role = "pending"` (independente do role solicitado) e `features = ["read:activation_token"]`
3. Um token é gerado em `user_activation_tokens` (UUID, válido por 15 min) e o email é enviado
4. O usuário clica no link `<APP_URL>/activate/<token_id>`
5. O frontend chama `PATCH /api/v1/activations/<token_id>`
6. O endpoint verifica o token (não expirado, não usado), ativa o usuário (`role = "operador"`, `features = []`) e marca o token como usado

## Endpoint

### PATCH /api/v1/activations/[token_id]

- **Auth**: nenhuma restrição por sessão — o token é o fator de autenticação
- **Resposta sucesso**: `200` com dados do token (`id`, `user_id`, `expires_at`, `used_at`, `created_at`, `updated_at`)
- **Erros**:
  - `404 NotFoundError` — token não encontrado, expirado ou já usado
  - `403 ForbiddenError` — usuário alvo já está ativado (perdeu a feature `read:activation_token`)

Qualquer usuário (logado ou anônimo) pode usar um token válido — isso permite que supervisores/admins ativem contas em nome de outros usuários sem precisar sair da sessão.

## Email enviado

- **Assunto**: `Ative sua conta no {appName}`
- **Formatos**: plaintext + HTML (template responsivo com botão verde "Ativar conta")
- **Segurança HTML**: `escapeHtml` aplicado ao `username` antes de interpolação (previne XSS em clientes de email)
- **Link**: `{webserver.origin}/activate/{token_id}` — válido por 15 minutos

## Sempre pending no convite

`POST /api/v1/users` ignora o `role` do body e força `role = "pending"` na criação. Isso previne pré-acesso: se o role fosse aplicado antes da ativação, a conta herdaria as features do role-alvo antes do clique no link.

O role `"operador"` é atribuído por `activation.activateUserByUserId()` no momento da ativação.

## Tabela

`user_activation_tokens`: `id` (UUID PK), `user_id` (uuid FK→users), `expires_at` (timestamptz), `used_at` (timestamptz nullable), `created_at`, `updated_at`.

## Related pages

- [[seguranca]]
- [[supervisor]]
- [[administrador]]
- [[recuperacao-de-senha]]
