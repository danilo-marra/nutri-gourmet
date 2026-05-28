---
name: pre-merge-docs
description: >
  Run before merging a feature branch into main. Reads the diff, audits and updates
  all project documentation to reflect what was implemented: wiki pages (domain/ and rules/),
  wiki/log.md, and CLAUDE.md (models list, orchestrator helpers, line count).
  Trigger when: user says "update docs", "sync docs", "pre-merge docs", "atualizar documentação",
  "atualizar wiki", "lint da wiki", "lint wiki", or is about to open/merge a PR.
  Also trigger proactively when finishing a feature implementation session in this repo.
---

# pre-merge-docs

Keeps `wiki/` and `CLAUDE.md` accurate after a feature is implemented and before merging to main.
Run this on the feature branch, with a clean working tree (all changes committed).

## Step 1 — Understand the changeset

Run these commands to understand what the branch adds:

```bash
git log main..HEAD --oneline
git diff main...HEAD --stat
git diff main...HEAD -- models/ pages/api/v1/ tests/orchestrator.js infra/migrations/ raw/decisions/
```

From the diff, identify:

- **New model files** in `models/` (e.g., `report.js`, `cash_close.js`)
- **New API endpoints** under `pages/api/v1/` (path = route; method = handler)
- **New RBAC features** added to `SUPERVISOR_FEATURES` / `ADMIN_FEATURES` in `models/authorization.js`
- **New orchestrator helpers** added to `tests/orchestrator.js` (exported functions)
- **New migration files** in `infra/migrations/`
- **New decision files** added to `raw/decisions/`

## Step 2 — Audit CLAUDE.md

Read `CLAUDE.md` and check:

1. **models list** — every file in `models/` should appear in the `models/*` bullet. Add any missing ones.
2. **orchestrator helpers** — every exported helper in `tests/orchestrator.js` must appear in the `Shared setup lives in tests/orchestrator.js` bullet. Add any missing ones.
3. **line count** — CLAUDE.md must stay between 150 and 200 lines. If it has grown beyond that, trim prose without removing substance.

Apply fixes directly to `CLAUDE.md`.

## Step 3 — Lint the wiki

Read `wiki/index.md` to get the full list of pages. Then read each page and check:

### Format check (every page must have)

```
# Title
**Summary**: …
**Sources**: …
**Last updated**: YYYY-MM-DD
---
(content)
## Related pages
- [[page-name]]
```

### Content checks

- **Orphan pages**: no other wiki page links to this one via `[[page-name]]`
- **Stale `[needs verification]`**: if the diff implements the thing in question, resolve it now
- **Stale implementation notes**: if a page says "not yet implemented" or has a warning aviso that the diff resolves, remove or update it
- **Missing "Implementação" section**: if a domain page (e.g., `domain/venda.md`) covers a module that now has live endpoints, add an "Implementação" section documenting the endpoints, required/optional params, and response shape
- **Permission split**: if new RBAC features were added, check `wiki/rules/seguranca.md` — update the permissions table if the new features aren't reflected there

### Index check

- Every page listed in `wiki/index.md` exists on disk
- Every page created by the diff is listed in `wiki/index.md`
- New decision files in `raw/decisions/` appear in the "Decisões" section of `wiki/index.md`

Apply all fixes in place. Update `**Last updated**` on every page you touch.

## Step 4 — Append to wiki/log.md

Append a new section at the top of the log (after the `---` separator line, before the previous most-recent entry). Format:

```markdown
## YYYY-MM-DD — <short description of the PR/feature>

**CLAUDE.md atualizado:** (list each change, or "Sem alterações necessárias.")

**Páginas wiki atualizadas:**

- `wiki/path/to/page.md` — one-line description of what changed

**Páginas wiki criadas:** (if any)

- `wiki/path/to/new-page.md` — what it covers

**Não alterado (justificado):** (if anything was considered but left unchanged, say why)

---
```

If CLAUDE.md had no changes, say so explicitly. If no wiki pages were touched, say so. Never leave a section blank without explanation.

## Step 5 — Report (docs pass)

Output a short summary of the docs update:

- How many wiki pages were updated/created
- What was changed in CLAUDE.md
- One sentence on what the log entry records

Keep it to 4 lines max.

## Step 6 — Codex pre-merge gate

**Run this step only when the user is about to merge the PR into main.**
Do NOT run it during the initial docs pass — Codex needs time to analyze the commits after the PR is opened.

```bash
# Check if a PR exists
gh pr view --json number,url,title 2>/dev/null || echo "no PR"
```

If a PR exists, fetch Codex inline comments:

```bash
PR=$(gh pr view --json number --jq .number)
REPO=$(gh repo view --json nameWithOwner --jq .nameWithOwner)
gh api "repos/$REPO/pulls/$PR/comments" \
  --jq '.[] | select(.user.login | ascii_downcase | test("copilot|codex|github-advanced-security")) | "[\(.path):\(.line // .original_line)] \(.body)"'
```

Note: omit the leading `/` from the endpoint — on Windows, a leading slash is rewritten as a filesystem path by the shell, causing `invalid API endpoint` errors.

For each comment returned:

1. Read the referenced file at the cited line for context
2. Decide if the concern is valid (apply your own judgment — Codex can be wrong)
3. If valid: fix the file, commit, and push before merging
4. If not valid: note why it was skipped in the final report

If no PR exists, or there are no Codex comments, proceed with the merge.

## Step 7 — Final report (pre-merge)

After completing Step 6, output:

- Codex comments: how many found, how many applied, how many skipped (with reason)
- Whether it is safe to merge

Keep it to 3 lines max.

---

## What NOT to do

- Don't modify files in `raw/` (except `raw/decisions/` which is writable)
- Don't rewrite wiki pages from scratch — add or update sections, preserve existing content
- Don't touch pages unrelated to the current diff
- Don't add speculative content about things not yet implemented
- Don't commit anything — this skill only edits files; committing is the user's job
