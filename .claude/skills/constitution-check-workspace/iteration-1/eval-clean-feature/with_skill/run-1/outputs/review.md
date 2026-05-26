Principle I (API v1): OK — pages/api/v1/users/[username]/index.js:24-30 adds 403 error preserving `{ name, message, action, status_code }`; success response remains additive (filtered via whitelist), no field removal/rename or status change.
Principle II (Session): OK — index.js:15 wires `authentication.injectAuthenticatedUser`; permission check uses `authorization.can(...)` (index.js:24) and output goes through `authorization.filterOutput` (index.js:35-39); no inline RBAC logic, no cookie flag changes.
Principle III (Tests): OK — tests/integration/api/v1/users/[username]/get.test.js:51-72 covers authorized happy path; :75-90 covers 403 denial; both positive and negative RBAC scenarios present for the changed endpoint.
Principle IV (Migrations): n/a — no files under `infra/migrations/` in the diff.
Principle V (Erros): OK — 403 payload uses the typed contract shape (index.js:24-30); no logs introduced, no exposure of password/session token/SMTP/`DATABASE_URL`/raw cookie.

PR checklist:

- [x] Não houve breaking change silenciosa na API `v1`. (response shape additive; new 403 path is a new auth gate, not a contract break)
- [x] Contratos de erro/resposta permaneceram compatíveis ou foram versionados corretamente. (ForbiddenError follows `{ name, message, action, status_code }`)
- [x] Sessão/cookie e RBAC foram aplicados com `authorization.can` + filtragem de saída. (index.js:15, :24, :35-39)
- [x] Fluxos críticos alterados possuem teste de integração cobrindo sucesso e falha. (get.test.js authorized + unauthorized)
- [x] Migration (quando aplicável) possui rollback/justificativa, risco documentado e estratégia de deploy segura. (n/a — no migration)
- [x] Logs e tratamento de erro não expõem segredos. (no log/console statements added)
- [ ] `npm test` passou para mudanças em áreas críticas. (not verifiable from diff alone — run before merge)
- [ ] Lint/format e revisão de código foram concluídos. (not verifiable from diff alone — run before merge)

PR-ready: yes
