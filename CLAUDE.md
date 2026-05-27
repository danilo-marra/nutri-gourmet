# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

- Next.js 14 (Pages Router) on Node 24
- PostgreSQL 16, raw SQL via `pg` — **no ORM**, parameterized queries
- Migrations via `node-pg-migrate` in `infra/migrations/`
- Session auth (cookie `session_id`, DB-backed) + role-based RBAC (`users.role` derives features; manual feature overrides still supported)
- Email via `nodemailer`; Mailcatcher in dev
- Jest integration tests against a real DB and the running Next dev server

## Constitution authority

`.specify/memory/constitution.md` is normative for this repo. Before non-trivial changes — especially to `pages/api/v1/**`, `models/session.js`, `models/authorization.js`, `models/activation.js`, `infra/controller.js`, or any migration — re-read it and flag conflicts. The five principles in short:

1. **API v1 contract** — additive only; error shape `{ name, message, action, status_code }` is stable; breaking change ⇒ new version.
2. **Sessão + RBAC** — `httpOnly` cookie, `expires_at > NOW()` validation, `authorization.can(user, feature, resource?)` + `authorization.filterOutput` (never inline permission logic).
3. **Testes de integração como gate** — bug fixes in critical flows need a failing-then-passing test; PRs touching critical paths must run `npm test` green.
4. **Migrations seguras** — explicit `exports.down` or documented justification; idempotent; zero-downtime when possible; `timestamptz` UTC.
5. **Erros tipados + segredos** — domain errors from `infra/errors.js`; wrap unknown as `InternalServerError`; never log password/session token/SMTP secret/`DATABASE_URL`/raw cookie.

Spec Kit drives feature work: prefer `speckit.specify → clarify → plan → tasks → implement` for anything bigger than a small fix.

## Non-obvious commands

- `npm run dev` orchestrates `services:up` → `services:wait:database` → `migrations:up` → `next dev`. Don't start `next dev` directly during normal work.
- `npm test` brings Docker up, runs Jest with `NODE_ENV=test` against a live Next server (`concurrently`), then `posttest` stops services. Use `npm run test:watch` only when services are already up.
- `npm run migrations:create -- <name>` scaffolds a migration. `migrations:up:dry` previews; `migrations:status` lists pending.
- Migrations target `.env.development` explicitly (the `--envPath` flag). New env vars must be added to `.env.example` and `.env.development`.
- `npm run check-secrets` runs Secretlint against the tree; husky `pre-commit` runs `lint:prettier:fix` + `check-secrets`, `commit-msg` runs commitlint (Conventional Commits).
- Stop services with `npm run services:stop` (preserves volumes) or `services:down` (destroys).

## Repo layout (load-bearing)

- `pages/api/v1/**` — handlers built with `next-connect` + `controller.errorHandlers`. Always go through `infra/controller.js` middlewares.
- `models/*` — domain logic (`user`, `session`, `authentication`, `authorization`, `activation`, `password`, `migrator`, `student`, `product`, `credit`, `sale`).
- `infra/` — `database.js`, `controller.js`, `email.js`, `errors.js`, `webserver.js`, `compose.yaml`, `migrations/`, `scripts/wait-for-postgres.js`.
- `tests/integration/api/v1/**` mirrors `pages/api/v1/**` path-for-path. Additional subdirectories: `_use-cases/` (end-to-end flows), `infra/` (infra tests e.g. email), `unit/` (unit tests for models e.g. `authorization`).
- Shared setup lives in `tests/orchestrator.js` (use `waitForAllServices`, `clearDatabase`, `runPendingMigrations`, `createUser({ role? })`, `createSession`, `getLastEmail`, `extractUUID`, `activateUser`, `addFeaturesToUser`, `createStudent`, `createProduct`, `createCreditTransaction(studentId, operatorId, overrides?)`, `createSale(studentId, operatorId, overrides?)`).

## Git workflow

Before editing any file in this repo, check the current branch with `git branch --show-current`. If it is `main`, stop and create a feature branch (`git checkout -b <type>/<feature-name>`) before proceeding. Never commit directly to `main`.

## Conventions

- 2-space indent; Prettier 3 is the source of truth (don't hand-format).
- Conventional Commits enforced by commitlint. Use `npm run commit` (Commitizen) when in doubt.
- Branch names: kebab-case with a type prefix (`chore/...`, `feat/...`, `fix/...`).
- New API endpoints: handler in `pages/api/v1/<resource>/<verb>.js` pattern is implicit — file name is the route; HTTP verb is the handler method on `next-connect`. Always wire `controller.errorHandlers`.
- Tests: one `*.test.js` per HTTP verb, mirroring the API path. `beforeAll` does `waitForAllServices → clearDatabase → runPendingMigrations`.

## Domain decisions

Decisions live in `raw/decisions/` (one file per module). Read the relevant file before scaffolding schema or endpoints for that module. Summary:

| Module         | Key decisions                                                                                                                                                                                                    | File                              |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| Student        | `name` + `class` (text); `is_full_time` bool; `balance DECIMAL(10,2)`; no enrollment/guardian                                                                                                                    | `raw/decisions/aluno.md`          |
| Product        | `name`, `price`, `category` (enum: lanche/bebida/vitamina/refeicao/sobremesa), `active`; snapshot price on sale                                                                                                  | `raw/decisions/produto.md`        |
| Sale           | Multiple items via `sale_items`; `payment_method`: credit/cash/card per transaction; reversal by supervisor/admin only                                                                                           | `raw/decisions/venda.md`          |
| Credit/Package | Monetary R$; single pool; negative balance with operator confirmation but operator locked out when `balance < 0`; package: no expiry by default (`expires_at` optional), supervisor/admin only, multiple allowed | `raw/decisions/credito-pacote.md` |
| Operations     | Cash close: not blocking (`pending` status), generates basic summary, supervisor/admin can close on behalf of operator; account creation: admin → email invite via existing activation flow                      | `raw/decisions/operacoes.md`      |
| Reports        | 5 reports: sales by period, credits added, balance by student, cash closes, active packages; supervisor/admin only; table view; no export this phase                                                             | `raw/decisions/relatorios.md`     |
| Supervisor     | All operator permissions + reversal, packages, negative credit, reports, global records (students/products), manage operator accounts; account via email invite; cannot manage supervisor/admin accounts         | `raw/decisions/supervisor.md`     |

## Wiki (knowledge base)

`raw/` holds immutable source documents — never modify files there. `wiki/` holds markdown pages maintained by Claude. `wiki/index.md` is the table of contents; `wiki/log.md` is an append-only record of all operations.

### Ingest workflow

When a new source is added to `raw/` and you are asked to ingest it:

1. Read the full source document.
2. Discuss key takeaways with the user before writing anything.
3. Create a summary page in `wiki/` named after the source.
4. Create or update concept pages for each major idea or entity.
5. Add wiki-links (`[[page-name]]`) to connect related pages.
6. Update `wiki/index.md` with new pages and one-line descriptions.
7. Append an entry to `wiki/log.md` with the date, source name, and what changed.

A single source may touch 10–15 wiki pages. That is normal. Use subfolders `wiki/domain/` for entities and `wiki/rules/` for business rules.

### Page format

```markdown
# Page Title

**Summary**: One to two sentences describing this page.

**Sources**: List of raw source files this page draws from.

**Last updated**: Date of most recent update.

---

Main content goes here. Use clear headings and short paragraphs.
Link to related concepts using [[wiki-links]] throughout the text.

## Related pages

- [[related-concept-1]]
- [[related-concept-2]]
```

### Citation rules

- Every factual claim should reference its source file as `(source: filename.md)`.
- If two sources disagree, note the contradiction explicitly.
- If a claim has no source, mark it as `[needs verification]`.

### Question answering

When the user asks a question:

1. Read `wiki/index.md` first to find relevant pages.
2. Read those pages and synthesize an answer.
3. Cite specific wiki pages in the response.
4. If the answer is not in the wiki, say so clearly.
5. If the answer is valuable, offer to save it as a new wiki page.

### Lint

When asked to lint or audit the wiki:

- Check for contradictions between pages.
- Find orphan pages (no inbound links from other pages).
- Identify concepts mentioned without their own page.
- Flag claims that may be outdated based on newer sources.
- Check that all pages follow the page format above.
- Report findings as a numbered list with suggested fixes.

### Rules

- Never modify files in `raw/` directly — exception: `raw/decisions/` is writable (decision records from Q&A sessions).
- Always update `wiki/index.md` and `wiki/log.md` after changes.
- Keep page names lowercase with hyphens (e.g. `fechamento-de-caixa.md`).
- Write in clear, plain language.
- When uncertain about categorization, ask the user.
