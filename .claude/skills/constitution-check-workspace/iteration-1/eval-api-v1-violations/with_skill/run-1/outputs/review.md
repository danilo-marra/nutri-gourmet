Principle I (API v1): Violation — `pages/api/v1/users/index.js:14-19` renames `id`→`user_id`, `username`→`user_name`, switches `created_at`→`createdAt` (camelCase), and removes `updated_at`. Breaking changes to v1 success payload (non-additive, field removal/rename).
Principle II (Session): Violation — `pages/api/v1/users/index.js:9` logs raw `session_id` cookie value; also `models/user.js:32-34` adds inline permission/whitelist logic for `admin@nutri.test` bypassing `authorization.can` and unique-email validation.
Principle III (Tests): Violation — diff changes a critical API v1 contract and user-creation flow with no accompanying test in `tests/integration/**` (no test files in diff).
Principle IV (Migrations):n/a — no files under `infra/migrations/` touched.
Principle V (Erros): Violation — `pages/api/v1/users/index.js:9` logs raw session cookie; `models/user.js:35` logs plaintext `password`. Direct violation of secret-protection rule.

PR checklist:

- [ ] Não houve breaking change silenciosa na API `v1`. (rename/remove of `id`, `username`, `updated_at`, `created_at`)
- [ ] Contratos de erro/resposta permaneceram compatíveis ou foram versionados corretamente. (success payload broken)
- [ ] Sessão/cookie e RBAC foram aplicados com `authorization.can` + filtragem de saída. (hardcoded `admin@nutri.test` bypass in `models/user.js`)
- [ ] Fluxos críticos alterados possuem teste de integração cobrindo sucesso e falha. (no tests in diff)
- [x] Migration (quando aplicável) possui rollback/justificativa, risco documentado e estratégia de deploy segura. (n/a — no migrations)
- [ ] Logs e tratamento de erro não expõem segredos. (logs `session_id` and `password`)
- [ ] `npm test` passou para mudanças em áreas críticas. (not evidenced; contract change would break existing tests)
- [ ] Lint/format e revisão de código foram concluídos. (não evidenciado)

PR-ready: no — logs leak password and session cookie, plus breaking rename/removal of v1 user payload fields.
