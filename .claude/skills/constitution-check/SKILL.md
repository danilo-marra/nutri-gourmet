---
name: constitution-check
description: Review the current diff against the 5 principles in .specify/memory/constitution.md. Use when finishing a feature/fix, before opening a PR, or anytime touching pages/api/v1/**, models/{session,authorization,activation}.js, infra/controller.js, or infra/migrations/**.
---

# Constitution check

Verify the current branch's diff complies with `.specify/memory/constitution.md` (v1.0.0). Read the constitution fresh each run — it can be amended.

## Steps

1. **Read the constitution.** `Read` `.specify/memory/constitution.md` to confirm the principles haven't changed since this skill was written.
2. **Collect the diff.** `git diff main...HEAD --stat` then `git diff main...HEAD` (or compare against the appropriate base if not branched from `main`). If on `main`, use `git diff HEAD~1 HEAD`.
3. **Score each principle.** For each of the five, report one of: `OK` / `Concern` / `Violation` with a one-line justification anchored to file:line in the diff. Don't restate principles the diff doesn't touch — say `n/a`.

   - **I. API v1 contract** — any change to `pages/api/v1/**` payloads, error shapes, or status codes? Are new fields strictly additive? Is `{ name, message, action, status_code }` preserved?
   - **II. Sessão + RBAC** — any change to session creation/validation, cookie flags, or authorization? Is permission logic going through `authorization.can(...)` and `authorization.filterOutput`?
   - **III. Testes de integração** — if critical paths changed (auth, session, RBAC, activation, migrations, API v1), is there a corresponding test in `tests/integration/**`? For bug fixes, is there a test that would have failed before the fix?
   - **IV. Migrations** — any new file in `infra/migrations/`? Does it have `exports.down` or a documented justification? `timestamptz` UTC? Zero-downtime considerations noted for large/blocking ops?
   - **V. Erros + segredos** — new errors using `infra/errors.js` types? Any `console.log`/log line that could leak password, session token, SMTP secret, `DATABASE_URL`, or raw cookie?

4. **Run the PR checklist.** Print the checklist from the constitution and tick each item based on the diff.
5. **Summary line.** End with a single line: `PR-ready: yes` or `PR-ready: no — <top blocker>`.

## Output shape

```
Principle I (API v1):     OK | Concern | Violation — <reason or n/a>
Principle II (Session):   ...
Principle III (Tests):    ...
Principle IV (Migrations):...
Principle V (Erros):      ...

PR checklist:
- [x/ ] ...

PR-ready: yes | no — <top blocker>
```

Keep it terse. No paragraphs of explanation — point at the file:line and move on.

## What this skill does NOT catch

This skill stays inside the diff text. It deliberately doesn't open referenced files to verify they exist or match the diff's assumptions. That's a feature, not a bug — it keeps the review fast and focused.

As a result, it won't catch:

- **Broken references** — an import or call to a symbol that doesn't exist (e.g., `authentication.injectAuthenticatedUser` when only `getAuthenticatedUser` is exported).
- **Semantic v1 breaks via control-flow changes** — swapping `controller.injectAnonymousOrUser` for an auth-required middleware: the diff looks like an additive RBAC check, but anonymous callers now get 401 where they got 200 before. Same story for added gates that flip authorized-but-unfeatured callers from 200 to 403.
- **Inline error objects that should be typed** — building `response.status(403).json({ name: "ForbiddenError", ... })` by hand instead of `throw new ForbiddenError(...)`. The diff satisfies the error contract shape, but bypasses the typed-error pipeline in `infra/errors.js`.

These are caught by `npm test` (Principle III) and human review, which is the right division of labor — don't try to make this skill do their job.
