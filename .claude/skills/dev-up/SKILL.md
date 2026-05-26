---
name: dev-up
description: Bring up the full local stack — Docker services (Postgres + Mailcatcher), wait for the database, run pending migrations, and verify /api/v1/status. Use when starting work, after pulling main, or whenever the env feels off.
---

# Dev environment bring-up

Replaces the manual `services:up` → `wait` → `migrations:up` → curl status sequence with one orchestrated check.

## Steps

1. **Check Docker.** Run `docker ps` (just to confirm the daemon is reachable). If it fails, surface the error and stop.
2. **Start services.** `npm run services:up` (Postgres 16 + Mailcatcher via `infra/compose.yaml`). Run in the foreground — it returns once Compose has dispatched.
3. **Wait for Postgres.** `npm run services:wait:database` (runs `infra/scripts/wait-for-postgres.js` with async-retry).
4. **Migration status.** `npm run migrations:status` — show what's pending. If anything is pending, run `npm run migrations:up`. Don't ask first; this is the dev DB.
5. **Smoke-test status endpoint.** Start `next dev` only if the user is actually going to use the app. Otherwise stop here.
   - If they want the server: run `npm run dev` (it re-runs steps 2–4 itself, but that's idempotent) in the background and then `curl http://localhost:3000/api/v1/status` once it's listening. Report the response.
6. **Summary.** One-line report: `services up | migrations: <n applied / 0 pending> | status: <code>`.

## Notes

- Don't use `services:down` here — that destroys volumes. Use `services:stop` if you need to stop without losing data.
- If a port collision happens (3000, 5432, 1080, 1025), report it and stop — don't try to kill the conflicting process.
- The `dev` script in `package.json` already chains steps 2–4. This skill exists so we can run each step and report intermediate state when something's wrong.
