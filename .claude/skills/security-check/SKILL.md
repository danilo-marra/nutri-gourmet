---
name: security-check
description: Audit the whole nutri-gourmet repo for security vulnerabilities, organized by the OWASP Top 10 (2021). Use when the user asks for a security check, security review, security audit, "revisão de segurança", "auditoria de segurança", "checar vulnerabilidades", before a release/deploy, after touching auth/session/RBAC/SQL, or whenever they mention OWASP, SQLi, IDOR, CSRF, XSS, secret leakage, or access control. Repo-wide audit (not diff-only) — run it periodically, not on every PR.
---

# Security check (OWASP Top 10)

Audit the **entire repo** against the OWASP Top 10 (2021), pruned to what actually has attack surface in this app. This is a static code review — it reads code, it does not run exploits or scan dependencies.

This app is **single-tenant, API-first (Next.js Pages Router), raw SQL via `pg`, cookie session + role-based RBAC**. That shape is why some OWASP categories are in-scope and others are `n/a` — keep the justifications so the report is honest about what was _not_ checked.

## How to run

1. **Detect frontend scope first.** Decide whether the conditional frontend block (below) is live or dormant. Treat the frontend as **present** only when there is real UI with attack surface — any of:

   - a non-API page under `pages/` that renders a form, calls `fetch`/the API, or uses React state/hooks. A static placeholder returning only literal JSX (e.g. a stub `pages/index.js` with `<h1>...</h1>`) does **not** count — no input, no data flow.
   - a `components/`, `src/components/`, or `app/` directory containing `.jsx`/`.tsx`
   - any `NEXT_PUBLIC_*` env var referenced in app code (ignore matches inside this skill's own files under `.claude/`)

   If none hold, mark every A0x-FE item as `n/a — sem front-end ainda` and skip those greps. State at the top of the report which mode you ran in, and name the evidence (e.g. "only page is a static stub").

2. **Sweep each category** using the greps/heuristics below. Prefer `Grep` over reading every file. Read a file only to confirm a hit is real (avoid false positives).

3. **Report.** Use the output shape at the bottom. Every finding gets a severity, a `file:line`, and a one-line fix. Don't pad — if a category is clean, say `OK` in one line and move on.

Severity guide: 🔴 Alta = exploitable now, real impact. 🟡 Média = weakness that needs a precondition or is defense-in-depth. 🟢 OK = checked, no issue. ⚪ n/a = no attack surface (justify).

---

## A01 — Broken Access Control 🔴

The core risk in an RBAC app. Permission logic must flow through `models/authorization.js` (`can` / `filterOutput`) and the `controller.canRequest("feature")` middleware — never inline.

- **Every handler in `pages/api/v1/**`is gated.** For each route file, confirm`router.use(controller.injectAnonymousOrUser)`and that each verb has a`controller.canRequest("...")`guard (or a deliberate, justified public route like`POST /sessions`, `POST /users`, activation/recovery). A verb with no guard and no justification is 🔴.
- **IDOR on `[id]` / `[username]` / `[token_id]` routes.** A user fetching/mutating a resource by id must be constrained to what their feature allows. Watch the self-vs-all split: `read:sale:self`/`delete:sale:self` vs `read:sale`/`delete:sale`, and `update:user` (self) vs `update:user:others`. A handler that takes an id from the URL and returns/mutates without checking ownership _or_ the broad feature is 🔴.
- **Output always filtered.** Anything returned from a handler that carries a DB row should pass through `authorization.filterOutput(user, feature, resource)`. Raw `response.json(rowFromDb)` is 🟡→🔴 (leaks columns like `password`, `email`, `token`).
- **Inline permission logic.** `if (user.role === "admin")` or `user.features.includes(...)` _inside a handler or model_ instead of calling `authorization.can(...)` — flag as 🟡 (drift from the single source of truth). **Carve-out:** role/feature logic _inside_ `models/authorization.js` (e.g. the `can`/`filterOutput` bodies) IS the source of truth — never flag it. Flag only when the check lives in a handler under `pages/api/**` or another model.
- **Privilege escalation via update.** A `PATCH`/`PUT` on a user that lets the caller set their own `role`/`features` from `request.body` without an `authorization.can(user, "update:user:others", resource)` check is 🔴.

Grep starters: `controller.canRequest`, `request.context.user`, `filterOutput`, `\.role ===`, `features.includes`.

## A02 — Cryptographic Failures 🟡

- **Password hashing** lives in `models/password.js` (bcryptjs). Confirm prod rounds stay high (currently 14) and `compare` is always used for verification — never `===` on hashes.
- **Token entropy.** Session/activation/reset tokens should come from `crypto.randomBytes(...)` (session uses 48 bytes ✓), not `Math.random()`, `Date.now()`, or sequential ids.
- **Cookie flags.** `infra/controller.js` `cookie.serialize("session_id", ...)` must keep `httpOnly: true` and `secure` in production. (`sameSite` → see A01-FE; harmless API-only, matters with a browser frontend.)
- **Transport.** `infra/database.js` SSL config — fine to be `false` in dev; ensure prod path enforces SSL (`POSTGRES_CA` or `ssl: true`).

Grep starters: `Math.random`, `randomBytes`, `bcrypt`, `httpOnly`, `secure:`, `ssl`.

## A03 — Injection 🔴

- **SQL injection** is the headline. All DB access goes through `infra/database.js` `database.query({ text, values })`. Every dynamic value MUST be a `$1`/`$2` placeholder in `values`, never interpolated into `text`.
  - 🔴 patterns: template literals with `${...}` _inside_ the SQL string, string concatenation building SQL, `client.query(\`...${userInput}...\`)`, building `WHERE`/`ORDER BY`/column names from request data.
  - **Trace the variable before flagging.** A `${...}` in SQL is only 🔴 when the value traces back to caller input (`request.body`/`request.query`/path params/any argument fed from a handler). Interpolating a **hardcoded constant** is safe and must NOT be flagged — e.g. `models/product.js` `const whereClause = activeOnly ? "WHERE active = true" : ""` is a boolean-driven literal, not user data.
  - Pay special attention to `models/report.js` (date ranges, optional filters) and any list endpoint that accepts sort/filter query params.
- **Other injection.** Command injection via `child_process` with user input; NoSQL n/a. XSS → see A03-FE.

Grep starters: `database.query`, `client.query`, `\$\{` (then check if the hit is inside a SQL string), `ORDER BY`, `child_process`, `exec(`.

## A04 — Insecure Design 🟡

Business-logic invariants that the type system won't catch. Cross-check against `raw/decisions/*.md`.

- **Balance never goes negative** in normal flow — a sale must block when `balance < total` (see `models/sale.js`, `models/credit.js`). A path that debits without the guard is 🔴.
- **Reversal is supervisor/admin only** — `delete:sale` (not `:self`) for reversing others' sales; confirm the feature gate matches the decision in `raw/decisions/venda.md`.
- **Account enumeration** on `POST /password/recovery` and login — the response/timing must not reveal whether an email exists. Different messages or status codes for "user found" vs "not found" is 🟡.
- **Negative-credit / package** operations restricted to supervisor/admin per `raw/decisions/credito-pacote.md`.

## A05 — Security Misconfiguration 🟡

- **Error leakage.** `infra/errors.js` `InternalServerError.toJSON()` deliberately omits `cause`. Flag any handler that returns `error.message`, `error.cause`, or a stack trace to the client, or builds an error response by hand instead of throwing a typed error (`controller.onError` handles serialization).
- **Verbose `console.error(error)`** of an unknown error is fine server-side; returning it is not.
- **Headers / CORS.** `next.config.js` — overly permissive CORS (`Access-Control-Allow-Origin: *` on authenticated routes) is 🔴. Missing security headers → A05-FE.

Grep starters: `error.cause`, `error.message`, `error.stack`, `res.*json(error`, `Access-Control-Allow-Origin`.

## A07 — Identification & Authentication Failures 🔴

- **Session validation** must check expiry: `models/session.js findOneValidByToken` filters `expires_at > NOW()` ✓. Any session lookup that skips the expiry check is 🔴.
- **No brute-force protection on login.** `POST /sessions` has no rate limiting / lockout (known gap). Flag as 🟡 (single-tenant lowers, but does not remove, the risk) and note it explicitly so it's a conscious decision.
- **Token single-use + expiry.** Activation (`models/activation.js`) and password reset (`models/passwordReset.js`) tokens must be single-use (`used_at` set on consume) and expire. A reusable or non-expiring token is 🔴.
- **Session fixation / logout.** Logout must invalidate the session server-side (`session.expireById`) and clear the cookie — confirm `DELETE /sessions` does both.
- **Password reset flow** must not leak validity (ties to A04 enumeration) and must invalidate the token after use.

Grep starters: `expires_at`, `used_at`, `findOneValidByToken`, `expireById`, `rateLimit`, `attempts`.

## Out of scope (justify, don't check)

- **A06 Vulnerable & Outdated Components** — delegated to `npm audit` / Dependabot; static review can't assess this. Mention as a pointer.
- **A08 Software & Data Integrity Failures** — no untrusted deserialization or plugin auto-update surface; CI/CD integrity is out of band.
- **A09 Logging & Monitoring Failures** — single-tenant; the relevant concern here is the _inverse_ (don't log secrets), covered by `npm run check-secrets` (Secretlint) + the no-secret-logging rule. Note whether any `console.*` logs a password, session/reset/activation token, `DATABASE_URL`, SMTP secret, or raw cookie (that IS in scope — flag 🔴).
- **A10 SSRF** — no user-controlled outbound requests; `nodemailer` targets a fixed SMTP host.

---

## Conditional frontend block (run only if frontend detected)

If step 1 found no frontend, output: `Front-end: ausente — A0x-FE marcados n/a, aguardando front-end.` and skip. Otherwise audit:

- **A03-FE / XSS** — `dangerouslySetInnerHTML`, `eval`, injecting unescaped user/DB content into JSX or the DOM. Grep: `dangerouslySetInnerHTML`, `innerHTML`, `eval(`.
- **A01-FE / CSRF** 🔴 — cookie session + state-changing `POST`/`PUT`/`PATCH`/`DELETE` from a browser with **no CSRF defense**. Today the cookie has no `sameSite` (`infra/controller.js`); once a browser frontend posts to the API, set `sameSite: "lax"`/`"strict"` (or add CSRF tokens). This is the highest-value item to re-check when the frontend lands.
- **A05-FE / Headers** — missing security headers in `next.config.js`: `Content-Security-Policy`, `X-Frame-Options` (clickjacking), `X-Content-Type-Options`, `Strict-Transport-Security`. Grep: `headers()`, `Content-Security-Policy`.
- **A02-FE / Client secret leak** — sensitive value exposed via `NEXT_PUBLIC_*` (anything in `NEXT_PUBLIC_` ships to the browser bundle). Grep: `NEXT_PUBLIC_`.
- **A01-FE / Client-only auth** — relying on hidden UI / client-side role checks as the _only_ access control; the server gate (A01) is the real boundary.

---

## Output shape

```
# Security check — nutri-gourmet
Modo: repo-wide | Front-end: ausente (A0x-FE n/a) | data: <date>

## A01 Broken Access Control — 🔴/🟡/🟢
- 🔴 pages/api/v1/<route>.js:NN — <problema> → <fix em 1 linha>
- 🟢 demais handlers gated via canRequest + filterOutput

## A02 Cryptographic Failures — ...
## A03 Injection — ...
## A04 Insecure Design — ...
## A05 Security Misconfiguration — ...
## A07 Identification & Auth Failures — ...

## Front-end (condicional)
- A01-FE CSRF: n/a — sem front-end ainda
- ...

## Fora de escopo
- A06: ver `npm audit`
- A08/A10: sem superfície
- A09: cobre só "não logar segredo" (ver achados acima)

## Resumo
🔴 Alta: N  | 🟡 Média: N  | 🟢 OK: N  | ⚪ n/a: N
Top risco: <uma linha>
```

Keep it terse — point at `file:line`, give the fix, move on. No essays.

## What this skill does NOT do

- It does **not** run code, send requests, or attempt exploits — it's a static read.
- It does **not** scan dependencies (`npm audit`) or git history for committed secrets (`npm run check-secrets`). Point the user at those tools instead of duplicating them.
- It is **repo-wide and slower** than `constitution-check` (diff-only). For per-PR gating use `constitution-check`; use this one before releases or after security-sensitive work.
