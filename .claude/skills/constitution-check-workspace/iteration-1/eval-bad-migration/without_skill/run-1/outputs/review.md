# Constitution Compliance Review

**Diff:** `infra/migrations/1764000000000_add-user-phone.js` (new) + `models/user.js` (adds `findOneByPhone`)
**Constitution version reviewed against:** 1.0.0 (Ratified 2026-05-20)
**Verdict:** **PR is NOT ready to merge.** Multiple MUST-level violations across Principles III and IV, plus governance/checklist gaps.

---

## Summary

The change adds a `phone` column to `users`, backfills it, drops the default, and indexes it, then exposes a `findOneByPhone` model method. The migration violates several normative rules in Principle IV (Padrões de Dados e Migrations Seguras), and the model surface is added without the integration coverage required by Principle III. There is also an internal inconsistency in the migration itself that suggests it has not been exercised.

---

## Findings

### 1. Principle IV — Missing `exports.down` (MUST violation)

> "Toda migration nova MUST conter estratégia explícita de rollback (`exports.down`) ou justificativa documentada quando tecnicamente impossível."

The new migration file `infra/migrations/1764000000000_add-user-phone.js` declares only `exports.up`. There is:

- no `exports.down`,
- no `exports.down = false` with a documented justification (which is the pattern used elsewhere in the repo, e.g. `1740051316822_create-users.js`),
- no comment explaining why rollback would be technically impossible.

Reverting the column/index is trivially expressible (`dropIndex` + `dropColumn`), so the "tecnicamente impossível" escape hatch does not apply. A `down` MUST be provided.

**Severity:** Blocker.

---

### 2. Principle IV — Blocking / non-zero-downtime pattern on `users` (MUST violation)

> "Mudanças potencialmente bloqueantes (reescrita de tabela, backfill grande, constraints pesadas) MUST seguir abordagem de zero-downtime quando possível."
> "Migrations MUST ser idempotentes na operação pretendida e seguras para reexecução controlada em ambientes de deploy."

The migration combines, in a single transaction against the live `users` table:

1. `ADD COLUMN phone varchar(20) NOT NULL DEFAULT ''` — fine on its own in recent Postgres, but locks `users` (ACCESS EXCLUSIVE) for the duration.
2. `UPDATE users SET phone = '+550000000000'` — full-table rewrite-class backfill while holding the lock from step 1.
3. `ALTER COLUMN phone … default: null` — second metadata rewrite under the same lock.
4. `CREATE INDEX users(phone)` — non-`CONCURRENTLY`, so this also blocks writes on `users` until it completes.

For an authentication-critical table like `users`, this is exactly the blocking pattern the principle warns against. The zero-downtime shape would be: add nullable column → backfill in batches outside the migration (or in a separate migration step) → add constraint/index `CONCURRENTLY` in a follow-up migration → drop default later. None of that is done here.

**Severity:** Blocker.

---

### 3. Principle IV — Migration has an internal bug (likely never ran)

The migration adds the column with `notNull: true, default: ""`, then calls `pgm.alterColumn("users", "phone", { notNull: true, default: null })`. Setting `default: null` in `node-pg-migrate` does **not** drop the default — it has no effect (the proper path is `pgm.alterColumn` with explicit handling, or `pgm.sql('ALTER TABLE users ALTER COLUMN phone DROP DEFAULT')`). The intent is unclear, and the fact that the `notNull: true` is repeated (it was already `true` at column creation) suggests this block is dead/cargo-culted.

This is independent evidence the migration was not exercised end-to-end, which is itself at odds with the Diretrizes de DX e Qualidade ("Lint/format e revisão de código foram concluídos").

**Severity:** High. Even if Principle IV did not exist, this would be wrong on its own.

---

### 4. Principle IV — Seed value is semantically misleading

`UPDATE users SET phone = '+550000000000'` backfills every existing user with the same fake-looking phone number, and then a `NOT NULL` constraint locks that value in. Combined with finding #2, this means production rows would silently carry an invented number. The principle's emphasis on "preservar disponibilidade e auditabilidade" is undermined: there is no provenance for these values, and they pass a future "phone is set" check trivially.

If `phone` is genuinely required, it should be nullable until real values are collected; if it is optional, `NOT NULL` should not be enforced.

**Severity:** High (data-integrity).

---

### 5. Principle III — New surface `findOneByPhone` ships with zero tests (MUST violation)

> "Mudanças em autenticação, sessão, autorização, ativação de conta, migrations e contratos de API MUST incluir testes de integração em `tests/integration/**`."
> "PRs que alteram … `models/session.js`, `models/authorization.js`, `models/activation.js` ou `infra/controller.js` MUST executar `npm test` com sucesso."

The diff adds `findOneByPhone` to `models/user.js` and exports it from the `user` module surface. Although `models/user.js` is not in the literal enumeration of files that gate `npm test`, this PR clearly touches "migrations" (which is enumerated) and adds a new lookup that is plausibly going to be used by auth-adjacent flows (phone-based account lookup). Per the principle, the migration change alone already triggers the integration-test requirement, and there is no integration test added for either the schema change or the new lookup.

There is also no negative-path test (e.g. phone not found returns `undefined`, phone parameter sanitization, etc.), which the principle requires ("pelo menos 1 cenário feliz e 1 cenário de negação/erro").

**Severity:** Blocker.

---

### 6. Diretrizes de DX e Qualidade — PR-level checklist gaps

> "Toda PR MUST explicitar impacto em API, segurança e banco de dados."

The diff itself does not carry any documentation/PR-body content, but on the basis of what was changed the following checklist items in "Checklist de Conformidade para PR" cannot currently be checked:

- [ ] Migration possui rollback/justificativa, risco documentado e estratégia de deploy segura. (#1, #2)
- [ ] Fluxos críticos alterados possuem teste de integração cobrindo sucesso e falha. (#5)
- [ ] `npm test` passou para mudanças em áreas críticas. (#5)

---

## Principles not violated (for completeness)

- **Principle I (API v1 contract):** no `pages/api/v1/**` change in this diff. No contract impact yet — but note that exposing `findOneByPhone` via any v1 endpoint in a follow-up PR will need to preserve the `{ name, message, action, status_code }` error contract and the additive-field rule.
- **Principle II (Sessão e RBAC):** not directly touched. If phone lookup becomes part of a login or recovery flow, `authorization.can` + `filterOutput` (phone is PII) will be required at that point.
- **Principle V (Erros tipados e segredos):** the SQL in `findOneByPhone` is parameterized, no secret/log exposure introduced. Fine as-is, but if phone is later logged in auth flows, it should be treated as PII and excluded from raw logs.

---

## Required changes before this PR can merge

1. Add `exports.down` (or `exports.down = false` with a written justification — the rest of the repo uses the latter for create-table-style migrations, but for an additive column rollback is trivial, so an actual `down` is preferred).
2. Restructure the migration to be non-blocking on `users`:
   - column added as nullable, or with `default ''` and **without** `NOT NULL`;
   - backfill in a separate step / batched script;
   - `CREATE INDEX … CONCURRENTLY` (which means the index step must be in its own migration, since `node-pg-migrate` runs each migration in a transaction by default — disable the transaction for the index migration).
3. Fix the dead `alterColumn(..., { notNull: true, default: null })` block — either drop the default with explicit SQL or remove the block.
4. Reconsider the synthetic `+550000000000` backfill; if `phone` is mandatory, collect real values before enforcing `NOT NULL`.
5. Add integration tests in `tests/integration/**` covering:
   - happy path for `findOneByPhone` (returns the matching user),
   - negative path (unknown phone returns `undefined`, and/or invalid input does not error unexpectedly),
   - any auth/RBAC implication if `findOneByPhone` will be exposed via API.
6. Update the PR body to explicitly call out API, security, and DB impact per the DX guideline.

---

## Final verdict

**PR-ready: no.** Two MUST-level violations of Principle IV (no `exports.down`, blocking migration shape) and one MUST-level violation of Principle III (no integration coverage for the migration / new model method), plus a latent bug inside the migration itself. Must be revised before merge.
