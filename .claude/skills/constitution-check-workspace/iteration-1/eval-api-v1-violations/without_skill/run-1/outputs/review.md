# Constitution Review — `api-v1-violations.diff`

**Scope reviewed:** 2 files

- `pages/api/v1/users/index.js` (POST /users handler)
- `models/user.js` (`create` flow)

**Verdict:** **BLOCK — not ready to merge.** The diff contains multiple hard violations of the constitution (Principles I, II, V) plus a domain-rule bypass in `models/user.js`. None of the changes appear to be accompanied by tests, which independently violates Principle III for a critical flow (user creation).

---

## Findings

### 1. Breaking change in API v1 success payload — **VIOLATION of Principle I**

`pages/api/v1/users/index.js` rewrites the 201 response body for `POST /api/v1/users`:

- `id` → renamed to `user_id`
- `username` → renamed to `user_name`
- `created_at` → renamed to `createdAt` (and changes case convention from snake_case to camelCase, inconsistent with the rest of the API)
- `updated_at` → **removed entirely**

The constitution is explicit:

> "Toda mudança de payload de sucesso MUST preservar campos existentes; novos campos MUST ser aditivos."
> "Remoção/renomeação de campo, mudança de semântica ou alteração de status HTTP em `v1` MUST ser tratada como breaking change e exigir novo versionamento de API."

This is exactly a silent breaking change inside `v1`. Renames and the removal of `updated_at` are forbidden without bumping to a new API version. The Checklist of Conformity item "Não houve breaking change silenciosa na API `v1`" cannot be checked.

**Required fix:** restore `id`, `username`, `created_at`, `updated_at`. If new naming is desired, add them as additive aliases (without removing the originals) or version the API.

---

### 2. Secret/PII leakage in logs — **VIOLATION of Principle V**

Two new `console.log` statements expose sensitive material:

`pages/api/v1/users/index.js`:

```js
console.log(
  `[users.post] session=${request.cookies.session_id} created user=${newUser.id}`,
);
```

This logs the raw `session_id` cookie. Principle V states:

> "Logs MUST NOT incluir senha, token de sessão, segredo SMTP, `DATABASE_URL` ou cookie cru."

Logging the raw session cookie is a direct violation and, combined with any log shipping, would let any log reader hijack a live session.

`models/user.js`:

```js
console.log(`creating user with password=${userInputValues.password}`);
```

This logs the **plaintext password** (it executes before `hashPasswordInObject`). This is the most explicit forbidden case in the constitution.

Additionally, Principle V mandates _structured_ logging — bare `console.log` strings don't meet "Logs MUST ser estruturados o suficiente para diagnóstico" in spirit, and there's no existing precedent in `pages/api/v1/**` for ad-hoc `console.log` lines like these.

**Required fix:** remove both `console.log` statements outright. If telemetry is desired around user creation, use the project's structured logging path and emit only non-sensitive identifiers (e.g., `user.id` after hashing has occurred).

---

### 3. Hardcoded backdoor that bypasses uniqueness validation — **VIOLATION of Principles II and (arguably) IV**

`models/user.js`:

```js
if (userInputValues.email !== "admin@nutri.test") {
  await validateUniqueEmail(userInputValues.email);
}
```

This special-cases `admin@nutri.test` to bypass the unique-email validation. Concretely:

- **Principle II (Segurança de Sessão e Controle de Acesso):** this is permission/identity logic inline in a model, allowing duplicate identities for a specific email. It undermines account integrity and could allow an attacker who knows the magic string to register collisions against an existing admin record (account takeover surface, depending on downstream lookups by email).
- **Principle IV (Padrões de Dados):** depending on the DB constraint state, this either relies on (or worse, conflicts with) a unique constraint on `email`. If the DB enforces uniqueness, this branch is a latent 500. If it doesn't, the schema is missing an integrity guarantee. Either way, the bypass shouldn't exist.
- **Diretrizes de DX e Qualidade:** "Toda PR MUST explicitar impacto em API, segurança e banco de dados." A backdoor like this would need to be called out explicitly — and it should not exist at all.

**Required fix:** remove the conditional and always call `validateUniqueEmail`. If a seed/admin user is needed, that belongs in a migration/seed script, not in production validation logic.

---

### 4. Missing integration tests — **VIOLATION of Principle III**

The diff touches `pages/api/v1/users/index.js` and `models/user.js` (a critical flow: user creation). Principle III mandates:

> "Mudanças em autenticação, sessão, autorização, ativação de conta, migrations e contratos de API MUST incluir testes de integração em `tests/integration/**`."
> "PRs que alteram `pages/api/v1/v1/**` … MUST executar `npm test` com sucesso."

No test files appear in the diff. Given that the response contract changed (point 1) and validation behavior changed (point 3), the existing integration suite for `POST /api/v1/users` will either fail (good — that means it's catching the breaking change) or has been silently allowed to drift. Either way, this PR cannot claim "Fluxos críticos alterados possuem teste de integração cobrindo sucesso e falha".

**Required fix:** revert the contract/validation regressions; then, for any _intended_ behavior change, add integration tests with happy-path + negation cases (e.g., duplicate-email rejection still works, response shape is stable).

---

## Checklist of Conformity status

- [ ] Não houve breaking change silenciosa na API `v1` — **FAIL** (Finding 1)
- [ ] Contratos de erro/resposta permaneceram compatíveis ou foram versionados — **FAIL** (Finding 1)
- [ ] Sessão/cookie e RBAC com `authorization.can` + filtragem de saída — **N/A here, but** Finding 2 violates session secrecy
- [ ] Fluxos críticos alterados possuem teste de integração cobrindo sucesso e falha — **FAIL** (Finding 4)
- [ ] Migration (quando aplicável) — **N/A**
- [ ] Logs e tratamento de erro não expõem segredos — **FAIL** (Finding 2)
- [ ] `npm test` passou para mudanças em áreas críticas — **Cannot verify; likely FAIL given Finding 1**
- [ ] Lint/format e revisão de código foram concluídos — **Cannot verify**

---

## Required actions before this PR can merge

1. Revert the response body changes in `pages/api/v1/users/index.js` — restore `id`, `username`, `created_at`, `updated_at`. Any new naming MUST be additive within `v1`, or shipped under a new API version.
2. Delete both `console.log` statements. Never log raw session cookies or plaintext passwords.
3. Remove the `admin@nutri.test` email-uniqueness bypass in `models/user.js`. If admin seeding is needed, do it via migrations/seeds.
4. Add/update integration tests under `tests/integration/**` for `POST /api/v1/users` covering at least: successful creation (asserting the stable response shape) and duplicate-email rejection. Run `npm test` and ensure it passes.
5. In the PR description, explicitly state the impact on API, security, and data (per "Diretrizes de DX e Qualidade").

Once 1–5 are addressed, this PR can be re-reviewed for compliance.
