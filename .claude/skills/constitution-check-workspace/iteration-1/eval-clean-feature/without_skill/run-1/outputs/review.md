# Constitution Review — `GET /api/v1/users/[username]` hardening

**Scope of diff**

- `pages/api/v1/users/[username]/index.js` — adds auth + RBAC gate + output filter on the `GET` handler.
- `tests/integration/api/v1/users/[username]/get.test.js` — adds a positive (200) and a negative (403) authorization test.

**Verdict: BLOCK / Request changes.** The intent is well aligned with Principles I, II, III, and V, but the implementation has a hard import error and introduces a silent breaking change to the public `v1` contract that is not addressed.

---

## Findings

### 1. (Blocker) Broken import — `authentication.injectAuthenticatedUser` does not exist

**Files:** `pages/api/v1/users/[username]/index.js` (line +2, line +6)

The diff adds:

```js
import authentication from "models/authentication.js";
...
router.get(authentication.injectAuthenticatedUser, getHandler);
```

But `models/authentication.js` only exports `getAuthenticatedUser` — there is no `injectAuthenticatedUser` on that module. The function with that name lives in `infra/controller.js` and is **not** exported on the `controller` default export either (only `controller.injectAnonymousOrUser` and `controller.canRequest` are public).

Effect at runtime: `authentication.injectAuthenticatedUser` is `undefined`, so `router.get(undefined, getHandler)` will either crash on route registration or skip the middleware entirely — in the latter case `request.context.user` would be `undefined` and the very next line (`const requesterUser = request.context.user;`) crashes with a TypeError inside `authorization.can`, surfaced to the client as `InternalServerError` (500).

This also means the new "Authorized user" integration test cannot have actually been run green against this diff. Per **Principle III** (`MUST executar npm test com sucesso` for changes to `pages/api/v1/v1/**`), this alone blocks the PR.

**Fix:** either

- use the existing middleware `controller.injectAnonymousOrUser` (consistent with `patchHandler` and the current `getHandler`) and rely on `authorization.can` to reject anonymous (anonymous user does not have `read:user`), **or**
- expose `injectAuthenticatedUser` on the `controller` default export and import from `infra/controller`.

### 2. (Blocker — Principle I) Silent breaking change of the `v1` contract

The current endpoint allows **anonymous** GETs and returns the public projection via `authorization.filterOutput(anonymousUser, "read:user", userFound)`. The diff:

- Forces authentication (replaces `injectAnonymousOrUser` with `injectAuthenticatedUser`-style middleware). Anonymous callers that used to receive `200` now get `401`.
- Adds an explicit `read:user` capability gate. Authenticated users without that feature now get `403` where they previously received `200`.

Principle I states: _"Remoção/renomeação de campo, mudança de semântica ou alteração de status HTTP em v1 MUST ser tratada como breaking change e exigir novo versionamento de API."_ This change alters HTTP status (200 → 401/403) and the semantics of an existing endpoint. The PR description / diff contains no versioning strategy, no deprecation note, and no justification.

**Fix:** Either keep the route readable to anonymous users (current behavior) by keeping `controller.injectAnonymousOrUser` and only adding `filterOutput` — which is already the existing behavior, making the diff partially redundant — or treat this as a breaking change and route it through a new versioned endpoint with explicit changelog/migration notes.

### 3. (Blocker — Principle V) Inline error object instead of typed `ForbiddenError`

**File:** `pages/api/v1/users/[username]/index.js` (lines +13 to +20)

```js
return response.status(403).json({
  name: "ForbiddenError",
  message: "Você não tem permissão para ler este recurso.",
  action: "...",
  status_code: 403,
});
```

Principle V requires: _"Erros de domínio e validação MUST usar classes tipadas em `infra/errors.js` e serialização JSON estável."_ The codebase already has `ForbiddenError` (see `infra/errors.js`) and uses it idiomatically in the sibling `patchHandler`:

```js
throw new ForbiddenError({ message: ..., action: ... });
```

Throwing the typed error also lets `controller.errorHandlers.onError` handle it consistently (logging, future hooks, etc.). The inline object bypasses that and creates two divergent error paths for the same resource.

**Fix:** `throw new ForbiddenError({ message, action })` instead of building the JSON by hand. Drop the explicit `return response.status(403).json(...)`.

### 4. (Concern — Principle III) Test gaps for the new behavior

The new tests cover (a) self-read authorized and (b) cross-user read denied. Given the behavior change in finding #2, the suite should also cover:

- **Anonymous → 401** on `GET /api/v1/users/[username]` — this is the bigger contract change and is uncovered. (The existing test file may already have this for the old behavior; if so, it must be **updated** to reflect the new contract, which the diff does not do.)
- **Authenticated user without `read:user` feature → 403** distinct from the "different user" case. The current 403 test uses a user without `read:user`; the test description ("reading another user's profile") suggests resource-level scoping, but the implementation actually denies because the feature itself is missing — the assertion would still pass even if `username` were the intruder's own. The test name and the gate's semantics are misaligned.
- The "Authorized user" test asserts `body.features: ["read:user"]`, which is correct only because `filterOutput` for `read:user` whitelists `features`. Good — but please confirm `email` is **not** present (use `expect(body).not.toHaveProperty("email")` or rely on the strict `toEqual` already in the diff — `toEqual` with the literal object is sufficient).

### 5. (Minor) `authorization.can("read:user", { username })` — resource shape is ignored

The current `authorization.can` only consumes `resource` when `feature === "update:user"` (compares `user.id === resource.id`). For `"read:user"` the `{ username }` argument is silently dropped — the gate is purely "does the user have the `read:user` feature". The test naming ("reading own profile" vs "reading another user's profile") implies resource-scoped authorization that the implementation does not provide.

If resource-scoped read is intended (e.g., self-only reads via `read:user:self`, broader reads via `read:user`), the diff should either:

- extend `authorization.can` to honor the resource for `"read:user"`, with corresponding tests, or
- use the already-declared `"read:user:self"` feature with the existing `filterOutput` branch (which exposes `email` only to self) — this looks like the more natural fit and is already supported by `models/authorization.js`.

### 6. (Minor — Diretrizes de DX) PR impact disclosure

"Diretrizes de DX e Qualidade" requires every PR to _"explicitar impacto em API, segurança e banco de dados"_. The diff itself contains no such note. Given findings #1 and #2, this disclosure is mandatory.

---

## Constitution Checklist (status)

- [ ] Não houve breaking change silenciosa na API v1. — **FAIL** (finding #2)
- [ ] Contratos de erro/resposta permaneceram compatíveis ou foram versionados corretamente. — **FAIL** (findings #2, #3)
- [x] Sessão/cookie e RBAC foram aplicados com `authorization.can` + filtragem de saída. — Intent met, but implementation broken (finding #1).
- [ ] Fluxos críticos alterados possuem teste de integração cobrindo sucesso e falha. — **PARTIAL** (finding #4; anonymous path uncovered, test naming misleading).
- [n/a] Migration — none in this diff.
- [x] Logs e tratamento de erro não expõem segredos. — OK.
- [ ] `npm test` passou para mudanças em áreas críticas. — **Cannot pass** as written (finding #1).
- [ ] Lint/format e revisão de código — pending.

## Recommended minimal patch to unblock

1. Replace the broken import with the existing middleware: `router.get(controller.injectAnonymousOrUser, getHandler);` (and import `controller` only).
2. Throw `ForbiddenError` instead of returning a hand-rolled JSON object.
3. Decide and document: keep anonymous read (then drop the `can` gate or use `read:user:self` for the email-exposing path) **or** version the endpoint and announce the breaking change.
4. Add the missing anonymous-path test and rename the cross-user test to reflect what it actually asserts.
5. Include an "Impact: API / Security" note in the PR description.
