---
name: roadmap-tick
description: Execute one iteration of TradeVantage roadmap work. Treat each invocation as a fresh session — read docs/ROADMAP.md, pick the next unchecked item by priority, implement it, verify (including the UI), commit, and report. Designed to be driven by /loop so the project advances one concrete step per tick with minimal context carryover.
---

# roadmap-tick

You are starting a fresh session. You have **no memory** of previous iterations. Your only source of truth is `docs/ROADMAP.md` and the git log.

## Goal of this iteration

Move the TradeVantage project forward by **at least one concrete, committed unit of work**, then stop and report.

## Self-learning across ticks

Since each tick is a fresh session with no memory, the skill persists learnings to a file so future ticks can stand on prior ticks' shoulders. This is the **only** way knowledge compounds across the loop.

**Location:** `.claude/skills/roadmap-tick/LEARNINGS.md` (create if missing). Not committed to git history of main deliverables — it's a private working memory for the loop. **Exception:** commit it anyway so it survives across machines and shows up in PR diffs when it materially changed.

**At the start of every tick** (right after step 1 orient), read `LEARNINGS.md` in full. Treat its entries as durable, non-negotiable constraints for this tick. If an entry conflicts with what you'd instinctively do, the entry wins — it represents a lesson already paid for.

**At the end of every tick** (right after step 6 improvements scan), append **zero or one** new learning if this tick produced something worth remembering. Do not pad. Categories worth logging:

- **Gotcha** — a command, path, config, or API that behaved unexpectedly and cost you time. Include the fix.
- **Convention** — a pattern you discovered the codebase uses that isn't obvious from `CLAUDE.md` / `ROADMAP.md`. Include a file pointer.
- **Failed approach** — something you tried that didn't work, so future ticks skip it. Include the reason.
- **Correction from user** — if the user pushed back on this tick's output between runs (via a message in the loop conversation), capture the correction so it isn't repeated.
- **Tooling quirk** — e.g. "`pnpm build` requires X env var set", "Supabase MCP not available, use CLI", "dev server takes ~8s not ~3s to respond".

**Format (append-only, newest at bottom):**
```
- [<YYYY-MM-DD> tick N] **<category>** — <one-sentence lesson>. _<optional: file:line or command>_
```

Example:
```
- [2026-04-18 tick 3] **Gotcha** — `pnpm typecheck` from repo root does not run worker typecheck; must use `pnpm --filter @tradevantage/worker typecheck` explicitly. _turbo.json line 12_
- [2026-04-18 tick 4] **Convention** — all Supabase queries return `null` on error, never throw. Handle at caller. _features/news/queries/news.ts:47_
- [2026-04-19 tick 7] **Failed approach** — splitting one tick's work into 7 per-feature commits fails typecheck on intermediate commits because pages import from 4+ features at once. Prefer one refactor commit.
```

**Rules:**
- **Deduplicate** — before appending, scan existing entries. If the same lesson is already there, don't re-add. If a new entry supersedes an old one, update the old in place and note `(updated tick N)`.
- **Delete entries that are no longer true.** E.g. a "Gotcha" about a bug that's now fixed can be removed with a one-line commit note.
- **Prune quarterly.** If the file exceeds ~100 lines, spend one tick consolidating/removing stale entries. This itself is a valid tick's work.
- The learnings file is part of the tick's commit (appended or updated together with ROADMAP checkbox flip).

**Sub-agent briefings must include the LEARNINGS.md contents verbatim.** When you spawn a sub-agent in step 3, read `LEARNINGS.md` and embed it in the sub-agent prompt under a `## Prior learnings (obey these)` section. The sub-agent has no other way to see it.

**Bootstrap:** on the very first tick where `LEARNINGS.md` does not exist, create it with a header and one seed entry:
```markdown
# roadmap-tick learnings

Durable lessons from prior ticks. Read at start of every tick. Append one at the end if this tick produced a worthwhile lesson.

- [<date> tick 1] **Convention** — project is feature-based under `apps/web/features/<name>/`. Feature-specific components/hooks/queries/mocks live inside the feature, not in `components/ui/` or `lib/`.
```

## Context hygiene (important — read first)

To keep the `/loop` driver's context small across ticks:

- **Delegate the heavy work to a sub-agent** using the `Agent` tool with `subagent_type: "general-purpose"`. The main loop session should only orchestrate and surface the sub-agent's final report, not perform the code reading/writing itself.
- Pass the sub-agent a **self-contained brief**: the item picked, the relevant file paths, and a pointer to `docs/ROADMAP.md` Section 0 for engineering principles. The sub-agent reads, edits, verifies, and commits.
- The main session should perform only these tool calls directly: the initial orient reads (ROADMAP + `git log` + `git status`), spawning the Agent, and writing the final report.
- If the tick is tiny (e.g. just flipping a checkbox for work already done in a prior tick, or adding a one-line fix), you may do it inline without a sub-agent. Anything touching more than ~3 files → sub-agent.

This way, each tick adds minimal bytes to the driving conversation. The sub-agent's context is naturally discarded when it finishes.

## Procedure

### 1. Orient (always do this first, inline)
- Read `.claude/skills/roadmap-tick/LEARNINGS.md` in full. Treat each entry as a binding constraint for this tick. If missing, bootstrap it per the Self-learning section above.
- Read `docs/ROADMAP.md` in full. It contains the current state, engineering principles (Section 0), production gaps checklist, feature backlog, the Timeline Chart feature plan, and the auto-discovered Improvement Backlog.
- Run `git log --oneline -15` to see what was already done. If an item is committed but not yet ticked in ROADMAP, flip the checkbox as this iteration's work.
- Run `git status` to confirm a clean working tree. If there are uncommitted changes from a prior aborted iteration, **stop and report** — do not clobber them.

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

### 3. Implement (delegate to sub-agent when work > ~3 files)

The sub-agent must follow **Section 0 — Engineering Principles** without exception:
- Feature-specific UI in `apps/web/features/<name>/components/`, never inline in `page.tsx`, never in `components/ui/`
- Truly generic primitives (used by 2+ features) in `apps/web/components/ui/`
- Hooks in `apps/web/features/<name>/hooks/` (feature-local) or `apps/web/lib/hooks/` (cross-feature)
- Queries in `apps/web/features/<name>/queries/<domain>.ts` with Zod validation — no `as Type` casts
- Worker adapters implement `SourceAdapter` from `apps/worker/src/adapters/base.ts`
- Enums update in three places: `packages/shared/src/constants/` → DB migration → JSON schema
- Before writing anything new, `grep` for existing components/hooks/queries that might already cover it. Extend, don't fork.

Keep the change small and self-contained. One iteration = one item. If the item is large (e.g. "Timeline Chart Phase A"), break it into visible sub-steps within the ROADMAP first, tick one, and leave the rest for the next iteration.

### 4. Verify (all three gates)

#### 4a. Static checks
From repo root:
```bash
pnpm typecheck
pnpm build
```
Both must pass. For worker-only changes additionally:
```bash
pnpm --filter @tradevantage/worker build
```

#### 4b. Interface check (for any change touching `apps/web/`)

UI bugs hide behind green typecheck and build logs — always do this gate when web files changed.

1. **Start the dev server in the background** (if not already up):
   ```bash
   pnpm dev:web
   ```
   Launch with `run_in_background: true` and capture the background task id. Wait ~8 seconds for the first compile.

2. **Identify the routes your change touches.** Examples:
   - Edited `apps/web/app/app/news/page.tsx` → `/app/news`
   - Edited `apps/web/components/ui/Button.tsx` → pick 2 pages that use it
   - New route `apps/web/app/chart/[symbol]/page.tsx` → `/chart/SPX`

3. **For each touched route, fetch it:**
   ```bash
   curl -sSI http://localhost:3000/<route>    # expect HTTP 200 or intended 3xx
   curl -s  http://localhost:3000/<route> | head -200
   ```
   Grep the HTML for these red flags:
   - `Application error` / `Server Error` / `500`
   - `Unhandled Runtime Error`
   - `Hydration failed`
   - A `<pre>` tag inside an Error boundary fallback
   - Missing expected text from the component you edited
   
   Also tail the dev server's stdout (`BashOutput` on the background task) and grep for `error`, `warn`, `Failed to compile`.

4. **Playwright (optional, preferred when installed).** If `@playwright/test` is present in `apps/web/package.json`, run a quick smoke script that visits each touched route and asserts no console errors. If not installed, the curl check is the floor — do not install Playwright in a tick unless the ROADMAP item is "set up Playwright."

5. **Stop the dev server** at the end of the tick: `KillShell` on the background task id so the next tick starts clean.

If the UI check fails, fix the cause inside this tick. If you cannot fix it, revert and report the blocker.

### 5. Commit (one or more atomic commits)

Prefer **multiple small commits over one giant commit** when the work has natural seams. Examples of good splits:

- `refactor(web): extract PriceChart from inline page code` → `feat(web): add /chart/[symbol] route` → `docs(roadmap): tick Timeline Phase A skeleton`
- `fix(web): add error boundary` → `chore(roadmap): tick error-boundary item`

Every commit must be green (typecheck + build pass at that commit). Use `git add -p` if needed to split staged changes.

**The final commit of the tick must flip the `[ ]` → `[x]` in `docs/ROADMAP.md`** for the item you completed. Any improvement backlog appends from step 6 also go in that final commit.

Commit message format (one or many):
```
<area>: <what changed in imperative mood>

<1–2 lines on why / which ROADMAP item this closes or progresses>

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

Do **not** push. The user controls pushes.

### 6. Scan for improvements (always do this, even if you skipped step 3)

After the last commit (or after deciding to skip the item), spend a **small, bounded** amount of effort looking for one concrete improvement opportunity the project didn't already know about. Do not rewrite anything here — you are only **logging findings** so a future tick can pick them up.

Rotate the focus each tick so coverage broadens over time. Pick the category based on `date +%s % 6`:

0. **Code quality** — duplicated logic, oversized files (>400 LOC), inline components that belong in `components/`, `any` types, missing error handling at an async boundary
1. **Performance** — N+1 queries, missing indexes, non-paginated `.select('*')`, large client bundles (check imports), synchronous work on the render path, missing `React.memo` on hot components, unbounded list renders
2. **Reusability** — near-duplicate components across pages, hooks reimplemented inline, Supabase calls outside `features/<name>/queries/`, feature-specific components living in `components/ui/`, enums duplicated outside `packages/shared/`
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

Include the backlog append (if any) in the final commit of the tick.

### 6b. Capture learning (append to LEARNINGS.md if applicable)

Per the Self-learning section, append **zero or one** entry to `.claude/skills/roadmap-tick/LEARNINGS.md` if this tick uncovered a durable lesson (gotcha, convention, failed approach, user correction, tooling quirk). If nothing worth remembering, write nothing. Deduplicate against existing entries. Include the append in the final commit alongside the ROADMAP checkbox flip and any improvement-backlog additions.

### 7. Report (under 120 words)

Format:
```
**Tick N — <item name>**
- Did: <one sentence>
- Commits: <list of short sha + subject>
- Files: <comma-separated paths>
- Verify: typecheck ✓ / build ✓ / ui-curl ✓ (routes: /x, /y) / ui-playwright ✗ (not installed)
- Improvement logged: <title or "none">
- Learning logged: <title or "none">
- Next up: <next unchecked item from ROADMAP>
- Blockers (if any): <list>
```

### 8. Stopping conditions

The loop should stop (do **not** schedule another wakeup) when any of these is true:

- All items under "Critical" and "High" in Section 2 are checked **and** Timeline Chart Phase A is fully checked
- You hit a blocker that requires user input (missing key, design decision, external account)
- Three consecutive iterations have been skipped because the next-available item requires external setup

When stopping, clearly say **"LOOP STOPPING"** in your report with the reason.

## Rules of thumb

- **Fresh session mindset**: never rely on memory. If you think "I already did X," verify with `git log` and ROADMAP.
- **Small commits beat big ones**: a five-line commit that ticks a box is a success. A sprawling commit that touches 30 files is a failure even if it "works."
- **Refactor as you touch**: if the file you're editing inlines something that belongs in `features/<name>/components/`, `features/<name>/hooks/`, or `components/ui/` (if truly generic), lift it in the same commit. But don't go hunting — only refactor what you're already touching.
- **If the ROADMAP is ambiguous**, update the ROADMAP first (with a commit), then stop and let the next iteration pick it up with the clarified wording.
- **Never** edit a committed migration. Always add a new numbered migration file under `packages/db/migrations/`.
- **Never** touch `.env` files or read secret values into chat.
- **Kill the dev server at the end of every tick** — background processes must not leak across ticks.
