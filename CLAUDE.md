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
- `models/*` — domain logic (`user`, `session`, `authentication`, `authorization`, `activation`, `password`, `migrator`).
- `infra/` — `database.js`, `controller.js`, `email.js`, `errors.js`, `webserver.js`, `compose.yaml`, `migrations/`, `scripts/wait-for-postgres.js`.
- `tests/integration/api/v1/**` mirrors `pages/api/v1/**` path-for-path. Additional subdirectories: `_use-cases/` (end-to-end flows), `infra/` (infra tests e.g. email), `unit/` (unit tests for models e.g. `authorization`).
- Shared setup lives in `tests/orchestrator.js` (use `waitForAllServices`, `clearDatabase`, `runPendingMigrations`, `createUser({ role? })`, `createSession`, `getLastEmail`, `extractUUID`, `activateUser`, `addFeaturesToUser`).

## Conventions

- 2-space indent; Prettier 3 is the source of truth (don't hand-format).
- Conventional Commits enforced by commitlint. Use `npm run commit` (Commitizen) when in doubt.
- Branch names: kebab-case with a type prefix (`chore/...`, `feat/...`, `fix/...`).
- New API endpoints: handler in `pages/api/v1/<resource>/<verb>.js` pattern is implicit — file name is the route; HTTP verb is the handler method on `next-connect`. Always wire `controller.errorHandlers`.
- Tests: one `*.test.js` per HTTP verb, mirroring the API path. `beforeAll` does `waitForAllServices → clearDatabase → runPendingMigrations`.

## PRD open questions (resolve before implementing each module)

These are gaps identified before starting domain modules. Run a Q&A session with the user per module before scaffolding schema or endpoints.

### Domain model definitions (all modules blocked on these)

- **Student**: required fields? (name, class/grade, enrollment id, guardian link?)
- **Product**: category? active/inactive flag? price history needed?
- **Sale**: one product per sale or multiple line items per transaction? payment method per line (credit vs. cash)?
- **Credit/Package**: does a package credit a monetary amount (R$) or a fixed number of consumptions?

### Business rules (clarify per module)

- **Negative credit**: can a student buy with insufficient balance? Who can authorize overrides?
- **Price changes**: do product price changes affect historical sale records?
- **Reversal (estorno)**: can the operador reverse any of their own sales, or only same-day ones?
- **Cash close (fechamento de caixa)**: is it a required daily action? What happens if not closed on a given day?

### Missing flows

- **Password recovery**: not in PRD; decide if it's in scope for the current phase before any auth work.
- **Operador/Supervisor account creation**: how does admin create new accounts? Direct API call only, or email invitation flow?

### Reports (define before implementing)

- **Operational report**: filtering criteria, output format, date range granularity.
- **Financial report**: same — currently too vague to spec.
