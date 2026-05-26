---
name: integration-test
description: Scaffold or run integration tests using the tests/orchestrator.js pattern, mirroring pages/api/v1/** path-for-path. Use when adding tests for a new endpoint, writing a regression test for a bug fix, or running a focused subset of the suite.
---

# Integration tests

The integration suite lives in `tests/integration/**` and mirrors `pages/api/v1/**` one-for-one. One `*.test.js` per HTTP verb. Shared setup is in `tests/orchestrator.js`.

## Running

- **Full suite** (slow — boots Docker + Next + Jest): `npm test`. Stops services on completion via `posttest`.
- **Watch a single file** (services must already be up — use `/dev-up` first):
  `npm run test:watch -- tests/integration/api/v1/<path>.test.js`
- **Run by name pattern** while watching:
  `npm run test:watch -- -t "<pattern>"`
- **Single file, one-shot, no watch:**
  `npx jest --runInBand tests/integration/api/v1/<path>.test.js`

Tests hit `http://localhost:3000` directly — they need the Next dev server running.

## Scaffolding a new test

When asked to add a test for `<METHOD> /api/v1/<path>`:

1. Create `tests/integration/api/v1/<path>/<verb>.test.js` (lowercase verb: `get`, `post`, `patch`, `delete`). If the path has a dynamic segment, bracket it: `tests/integration/api/v1/users/[username]/get.test.js`.
2. Use this skeleton:

```js
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("<METHOD> /api/v1/<path>", () => {
  describe("<Actor — Anonymous user | Default user | Authorized user>", () => {
    test("<scenario>", async () => {
      const response = await fetch("http://localhost:3000/api/v1/<path>", {
        method: "<METHOD>",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          /* ... */
        }),
      });

      expect(response.status).toBe(/* expected status */);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        /* expected shape */
      });
    });
  });
});
```

3. **Required coverage** (per constitution Principle III): for critical flows, include at least one happy path and one denial/error scenario.
4. **Helpers from the orchestrator** (use these instead of hand-rolling):
   - `createUser({ username?, email?, password? })` — defaults via faker.
   - `createSession(userId)` — returns a session row; use its `token` in a `Cookie: session_id=...` header.
   - `activateUser(user)` — marks user active.
   - `addFeaturesToUser(user, features)` — grants RBAC features.
   - `getLastEmail()` / `deleteAllEmails()` — Mailcatcher integration.
   - `extractUUID(text)` — pulls a UUID out of email body.
5. **Error responses** assert against the stable shape: `{ name, message, action, status_code }`.

## After writing the test

Run the file in isolation first (`npx jest --runInBand <path>`) to confirm it fails for the right reason if it's a regression test, then verify it passes after the fix.

## Notes

- `--runInBand` is non-negotiable — the suite shares one DB and clears it in `beforeAll`. Parallel tests would clobber each other.
- If a test needs a clean DB mid-flow, call `orchestrator.clearDatabase()` + `runPendingMigrations()` explicitly. Don't rely on test ordering.
- Don't mock the database or the email server. Mailcatcher is real; Postgres is real. That's the whole point of this suite.
