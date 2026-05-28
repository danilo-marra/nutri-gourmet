# Recuperação de Senha

**Summary**: Fluxo self-service de redefinição de senha via email com token de uso único e expiração de 30 minutos.

**Sources**: infra/migrations/, models/passwordReset.js, pages/api/v1/password/recovery/

**Last updated**: 2026-05-28

---

O sistema oferece recuperação de senha sem intervenção de operador. O usuário solicita o link, recebe por email e define uma nova senha diretamente.

## Fluxo completo

1. Usuário informa o email em `POST /api/v1/password/recovery`
2. Se o email existir, um token é gerado em `password_reset_tokens` e enviado por email
3. O email contém um link `<PRODUCTION_URL>/recovery/<token_id>`
4. Usuário clica no link e envia a nova senha via `PATCH /api/v1/password/recovery/<token_id>`
5. O token é marcado como usado atomicamente; a senha é atualizada

## Endpoints

### POST /api/v1/password/recovery

Solicita o envio do link de recuperação.

- **Auth**: anônimo (não requer sessão)
- **Body**: `{ "email": "..." }`
- **Resposta**: sempre `200` com mensagem genérica (anti-enumeração — não revela se o email existe)
- **Efeito**: cria token em `password_reset_tokens` e envia email; silencia `NotFoundError` internamente

### PATCH /api/v1/password/recovery/:token_id

Redefine a senha usando o token do link.

- **Auth**: anônimo (o token é a credencial)
- **Body**: `{ "password": "..." }`
- **Resposta**: `204` em caso de sucesso; `404` se token inválido, já usado ou expirado
- **Efeito**: consumo atômico do token (`WHERE used_at IS NULL AND expires_at > NOW()`) + atualização de senha

## Segurança

- **Anti-enumeração**: POST sempre retorna 200, independente do email existir
- **Consumo atômico**: UPDATE único que valida e marca em uma operação (TOCTOU-safe)
- **Expiração**: tokens expiram em 30 minutos (`expires_at = NOW() + INTERVAL '30 minutes'`)
- **Token único**: `used_at IS NULL` garante uso único por token

## Tabela

`password_reset_tokens`: `id` (UUID PK), `user_id` (uuid NOT NULL — sem FK constraint no banco), `expires_at` (timestamptz), `used_at` (timestamptz nullable), `created_at`, `updated_at`.

## Related pages

- [[seguranca]]
- [[operador]]
- [[administrador]]
