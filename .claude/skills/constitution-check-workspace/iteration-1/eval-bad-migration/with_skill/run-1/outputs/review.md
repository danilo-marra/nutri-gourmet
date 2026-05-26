Principle I (API v1): n/a — diff does not touch `pages/api/v1/**`.
Principle II (Session): n/a — no changes to session/cookie/authorization.
Principle III (Tests): Violation — migration + new `models/user.js:findOneByPhone` (models/user.js:64-69) ship without any test in `tests/integration/**`; migrations are explicitly a critical path per Principle III.
Principle IV (Migrations):Violation — `infra/migrations/1764000000000_add-user-phone.js:1-24`:

- missing `exports.down` (no rollback, no documented justification);
- adds `notNull` column on existing `users` table with sentinel default `""` then backfills via blocking `UPDATE` (1764000000000_add-user-phone.js:10-16) — non zero-downtime, rewrites table;
- `pgm.createIndex("users", "phone")` (line 23) without `concurrently`, takes an `ACCESS EXCLUSIVE` lock — blocking;
- `alterColumn` at line 18-21 is a confused no-op (re-asserts `notNull: true` while setting `default: null`) — semantics unclear;
- backfill plants fake PII (`'+550000000000'`) on every existing user — data integrity hazard.
  Principle V (Erros): OK — `models/user.js:62-68` uses parameterized query; no new logs, no secret exposure.

PR checklist:

- [x] Não houve breaking change silenciosa na API `v1`.
- [x] Contratos de erro/resposta permaneceram compatíveis ou foram versionados corretamente.
- [x] Sessão/cookie e RBAC foram aplicados com `authorization.can` + filtragem de saída. (n/a — não tocado)
- [ ] Fluxos críticos alterados possuem teste de integração cobrindo sucesso e falha. (sem testes para migration nem `findOneByPhone`)
- [ ] Migration (quando aplicável) possui rollback/justificativa, risco documentado e estratégia de deploy segura. (sem `down`, sem `concurrently`, backfill bloqueante, sem nota de zero-downtime)
- [x] Logs e tratamento de erro não expõem segredos.
- [ ] `npm test` passou para mudanças em áreas críticas. (não há testes novos; status de execução não evidenciado)
- [ ] Lint/format e revisão de código foram concluídos. (não evidenciado; `alterColumn` inconsistente sugere revisão pendente)

PR-ready: no — migration sem `exports.down`, sem `CONCURRENTLY` no índice, backfill bloqueante com PII fake e sem testes de integração (Princípios IV e III).
