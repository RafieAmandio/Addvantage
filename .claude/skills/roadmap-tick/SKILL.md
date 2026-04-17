---
name: roadmap-tick
description: Execute one iteration of TradeVantage roadmap work. Treat each invocation as a fresh session — read docs/ROADMAP.md, pick the next unchecked item by priority, implement it, verify, commit, and report. Designed to be driven by /loop so the project advances one concrete step per tick.
---

# roadmap-tick

You are starting a fresh session. You have **no memory** of previous iterations. Your only source of truth is `docs/ROADMAP.md` and the git log.

## Goal of this iteration

Move the TradeVantage project forward by **exactly one concrete, committed unit of work**, then stop and report.

## Procedure

### 1. Orient (always do this first)
- Read `docs/ROADMAP.md` in full. It contains the current state, engineering principles (Section 0), production gaps checklist, feature backlog, and the Timeline Chart feature plan.
- Run `git log --oneline -15` to see what was already done in prior iterations. If an item is committed but not yet checked off in ROADMAP, check it off as part of this iteration's commit.
- Run `git status` to ensure a clean working tree. If there are uncommitted changes from a prior aborted iteration, stop and report — do not clobber them.

### 2. Pick the next item (strict priority)

Walk the ROADMAP checkboxes in this order and take the **first unchecked item** you can actually do:

1. **Section 2 — Production Readiness Gaps**, in order: Critical → High → Medium → Low
2. **Section 4 — Timeline Chart**, phases in order: A (Skeleton) → B (Real data) → C (Tweet source) → D (Polish)
3. **Section 6 — Improvement Backlog (auto-discovered)**, oldest first
4. **Section 3 — Feature Backlog** last

**Skip and list for the user (do not attempt) any item requiring:**
- Rotating keys / credential changes
- Creating external accounts (Stripe, Polygon, Sentry, Axiom, GHCR, etc.)
- SSH access to the VPS
- Installing MCP servers or CLIs on the user's machine
- Making product/design decisions with more than one reasonable answer
- Destructive git operations (force push, history rewrite)

If an item needs a choice (e.g. "pick market data provider"), stop and ask the user — do not guess.

### 3. Implement

Follow **Section 0 — Engineering Principles** without exception:
- Reusable components in `apps/web/components/<domain>/`, never inline in `page.tsx`
- Hooks in `apps/web/lib/hooks/`
- Queries in `apps/web/lib/queries/<domain>.ts` with Zod validation — no `as Type` casts
- Worker adapters implement `SourceAdapter` from `apps/worker/src/adapters/base.ts`
- Enums update in three places: `packages/shared/src/constants/` → DB migration → JSON schema
- Before writing anything new, `grep` for existing components/hooks/queries that might already cover it. Extend, don't fork.

Keep the change small and self-contained. One iteration = one item. If the item is large (e.g. "Timeline Chart Phase A"), break it into visible sub-steps within the ROADMAP first, tick one, and leave the rest for the next iteration.

### 4. Verify

From repo root, run:
```bash
pnpm typecheck
pnpm build
```

If either fails, fix it before committing. Do not commit broken code. If you cannot fix it within this iteration, revert your changes and report the blocker.

For worker-only changes you may additionally run:
```bash
pnpm --filter @tradevantage/worker build
```

UI changes: state explicitly in your report that you did **not** visually verify in a browser (this skill doesn't run a dev server).

### 5. Commit and tick the box

In the same commit:
- The implementation changes
- The `[ ]` → `[x]` flip in `docs/ROADMAP.md` for the item you just completed

Commit message format:
```
<area>: <what changed in imperative mood>

<1–2 lines on why / which ROADMAP item this closes>

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

Do **not** push. The user controls pushes.

### 6. Scan for improvements (always do this, even if you skipped step 3)

After the implementation commit (or after deciding to skip), spend a **small, bounded** amount of effort looking for one concrete improvement opportunity the project didn't already know about. Do not rewrite anything here — you are only **logging findings** so a future tick can pick them up.

Rotate the focus each tick so coverage broadens over time. Pick the category based on `date +%s % 6`:

0. **Code quality** — duplicated logic, oversized files (>400 LOC), inline components that belong in `components/`, `any` types, missing error handling at an async boundary
1. **Performance** — N+1 queries, missing indexes, non-paginated `.select('*')`, large client bundles (check imports), synchronous work on the render path, missing `React.memo` on hot components, unbounded list renders
2. **Reusability** — near-duplicate components across pages, hooks reimplemented inline, Supabase calls outside `lib/queries/`, enums duplicated outside `packages/shared/`
3. **Security** — missing `requireAdmin()` on server actions, `supabaseAdmin()` imported from client-reachable code, unvalidated user input reaching DB, secrets in code, CORS/CSRF gaps
4. **Observability** — silent `catch` blocks that return `[]` or `null`, missing logger calls on errors, no request IDs, console.log instead of structured logs
5. **DX / build** — slow turbo tasks, missing `turbo.json` outputs, stale generated types, redundant deps, `transpilePackages` drift, failing lint rules being ignored

**How to scan (fast, no rabbit holes):**
- Pick 2–4 files related to today's category and read them critically
- Or grep for the category's tell-tale pattern (e.g. `as \w+Row`, `.select\("\*"\)`, `catch.*return \[\]`, `console\.(log|error)`)
- Cap this step at ~5 tool calls

**Log the finding** by appending a single item to `docs/ROADMAP.md` under a section named `## 6. Improvement Backlog (auto-discovered)`. Create that section if it doesn't exist. Format:

```
- [ ] **[<category>] <short title>** — <what's wrong, 1 sentence> _(found tick <N>, <file:line>)_
```

Rules:
- **Deduplicate** — read the existing Improvement Backlog first; if the same issue is already listed, do not re-add it
- If you find nothing worth logging, write nothing. Empty ticks are fine
- Improvement items become eligible for future ticks after all Critical + High items are done, but **before** Feature Backlog

Include the backlog append (if any) in the same commit as step 5.

### 7. Report (under 100 words)

Format:
```
**Tick N — <item name>**
- Did: <one sentence>
- Files: <comma-separated paths>
- Verify: typecheck ✓ / build ✓ / ui-visual ✗ (not tested)
- Improvement logged: <title or "none">
- Next up: <next unchecked item from ROADMAP>
- Blockers (if any): <list>
```

### 7. Stopping conditions

The loop should stop (do **not** schedule another wakeup) when any of these is true:

- All items under "Critical" and "High" in Section 2 are checked **and** Timeline Chart Phase A is fully checked
- You hit a blocker that requires user input (missing key, design decision, external account)
- Three consecutive iterations have been skipped because the next-available item requires external setup

When stopping, clearly say **"LOOP STOPPING"** in your report with the reason.

## Rules of thumb

- **Fresh session mindset**: never rely on memory. If you think "I already did X," verify with `git log` and ROADMAP.
- **Small commits beat big ones**: a five-line commit that ticks a box is a success. A sprawling commit that touches 30 files is a failure even if it "works."
- **Refactor as you touch**: if the file you're editing inlines something that belongs in `components/` or `lib/hooks/`, lift it in the same commit. But don't go hunting — only refactor what you're already touching.
- **If the ROADMAP is ambiguous**, update the ROADMAP first (with a commit), then stop and let the next iteration pick it up with the clarified wording.
- **Never** edit a committed migration. Always add a new numbered migration file under `packages/db/migrations/`.
- **Never** touch `.env` files or read secret values into chat.
