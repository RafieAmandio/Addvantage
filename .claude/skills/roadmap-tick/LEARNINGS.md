# roadmap-tick learnings

Durable lessons from prior ticks. Read at start of every tick. Append one at the end if this tick produced a worthwhile lesson.

Format: `- [<YYYY-MM-DD> tick N] **<category>** — <one-sentence lesson>. _<optional: file:line or command>_`

Categories: **Gotcha** · **Convention** · **Failed approach** · **Correction from user** · **Tooling quirk**

---

- [2026-04-17 tick 0] **Convention** — project is feature-based. Feature-specific components live in `apps/web/features/<name>/components/`, hooks in `features/<name>/hooks/`, queries in `features/<name>/queries/`, mocks at `features/<name>/mock.ts`. Only truly generic primitives belong in `apps/web/components/ui/`. _docs/ROADMAP.md Section 0_
- [2026-04-17 tick 0] **Failed approach** — splitting one restructure tick into N per-feature commits fails `pnpm typecheck` on intermediate commits because several pages import from 4+ features at once. Prefer one refactor commit when the feature graph is densely cross-linked.
- [2026-04-17 tick 0] **Tooling quirk** — `pnpm typecheck` and `pnpm build` must be run from the repo root (`/Users/dio/Addvantage`), not from `apps/web/`. Turbo orchestrates across the monorepo.
- [2026-04-17 tick 0] **Gotcha** — the Next.js path alias is `@/` → `apps/web/`. After moving files into `features/<name>/`, always update importers to `@/features/<name>/...` rather than deep relative paths.
- [2026-04-17 tick 0] **Convention** — commit messages use Conventional Commits prefixes (`feat`, `fix`, `refactor`, `docs`, `chore`) and end with `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`. Never push — user controls pushes.
