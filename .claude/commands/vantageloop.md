# /vantageloop — TradeVantage production loop

Every tick: audit one page or component, screenshot it, polish it, verify it, commit.

## Rules

- **Do NOT limit to design-reference pages only.** Every page in the app is in scope.
- **Make code clean and simple.** Refactor what needs refactoring. No half-finished work.
- **Improve aggressively.** If something can be better, make it better.
- **Never break existing functionality.** TypeScript must pass. Lint must pass.
- **Commit after every page, not at the end.** Atomic commits.

## Pages in scope

Every route in `apps/web/app/`:

| Route | Area |
|-------|------|
| `/app` | Dashboard |
| `/app/news`, `/app/news/[id]` | News feed + detail |
| `/app/chart/[symbol]` | Trading chart |
| `/app/plan`, `/app/plan/[id]`, `/app/plan/archive`, `/app/plan/compare` | Plans |
| `/app/calendar`, `/app/calendar/[id]` | Calendar |
| `/app/education`, `/app/education/[id]` | Education |
| `/app/watchlist` | Watchlist |
| `/app/consult` | AI Consult |
| `/app/subscription` | Subscription |
| `/app/brief` | Brief |
| `/app/channel` | Channel |
| `/app/tags`, `/app/tags/[tag]` | Tags |
| `/admin`, `/admin/review`, `/admin/review/[id]` | Admin — review queue |
| `/admin/archive` | Admin — archive |
| `/admin/sources` | Admin — sources |
| `/admin/plans`, `/admin/plans/[id]`, `/admin/plans/new` | Admin — plans |
| `/login` | Login |
| `/signup`, `/signup/profile`, `/signup/liability` | Signup flow |

## What to check per page

### 1. Code quality
- Remove dead code, unused imports, console.logs
- Simplify complex logic — if it needs a comment to explain, simplify it
- No `any` types — use proper typing
- Server components where possible, client components only where needed
- Server actions for mutations

### 2. UI / UX
- Consistent color usage — base palette: orange `#FFD400`, black `#111111`, gray `#1F1F1F`, white `#EEEEEE`
- Consistent spacing and typography
- All interactive elements have hover/active/focus states
- Loading states (skeleton or spinner, no layout shift)
- Empty states (meaningful, not just "No data")
- Error states (graceful, actionable)
- Responsive — works on mobile (390px) and desktop (1280px)

### 3. Animations
- Use the existing animation system (CSS classes defined in globals.css)
- Page entrance animations (staggered fade/slide-up)
- Hover micro-interactions on cards, buttons, rows
- Loading/transition animations
- No janky animations — keep it smooth

### 4. Data layer
- No mock data in production pages (except where demo mode is explicitly used)
- Proper loading states from real data
- Real Supabase queries wired up correctly

## Tests

### Every tick must include tests

After fixing a page, write tests for it. Tests live in `apps/web/__tests__/`:

| Type | Location | Command |
|------|----------|---------|
| Unit tests | `__tests__/unit/*.test.ts` | `pnpm --filter @tradevantage/web test` |
| Integration tests | `__tests__/integration/*.spec.ts` | `pnpm --filter @tradevantage/web test:e2e` |

#### What to test per page

**Unit tests** — for hooks, utilities, pure functions:
- Custom hooks (useWatchlist, useSeenNews, useReadPrimers, etc.)
- Supabase query functions (in `features/*/queries/*.ts`)
- Server actions (in `features/*/actions.ts`)
- Utility functions (in `features/*/lib/*.ts`)
- Zod schemas (from `@tradevantage/shared`)

**Integration tests** — for UI flows and page behavior:
- Page loads without crashing
- Key interactions work (button clicks, form submissions)
- Responsive layout on mobile viewport
- Navigation between pages
- Loading + empty + error states

#### Test file naming
- Unit: `__tests__/unit/{feature}-{name}.test.ts` (e.g., `news-queries.test.ts`)
- Integration: add to `__tests__/integration/navigation.spec.ts`

#### Rules
- Tests must pass before committing
- If fixing a bug, write a test that would have caught it
- Mock Supabase clients — don't hit real DB in unit tests
- Use `NEXT_PUBLIC_MOCK_MODE=1` for integration tests — no real auth needed
- Add `data-testid` attributes to components as needed for test selectors

## Execution flow

### Each tick, do this:

1. **Read STATUS.md** — pick the next highest-priority undone task
2. **Start dev server** if not running: `pnpm dev:web` (skip if already running)
3. **Wait for server** — confirm `http://localhost:3000` responds
4. **Take baseline screenshot** — desktop + mobile, save to `.screenshots/{page}-before-{desktop,mobile}.png`
5. **Read the page code** — all related components, queries, actions
6. **Audit against checklist above** — list every issue found
7. **Fix issues** — apply all fixes, refactor as needed
8. **Write tests** — unit tests + integration tests for the page (see Test section above)
9. **Run checks** — `pnpm typecheck && pnpm lint && pnpm --filter @tradevantage/web test && pnpm --filter @tradevantage/web test:e2e`, fix any errors
10. **Take after screenshot** — desktop + mobile, save to `.screenshots/{page}-after-{desktop,mobile}.png`
11. **Compare** — visually assess the improvement
12. **Update STATUS.md** — mark task done, note what changed
13. **Commit** — atomic commit (see format below)

### If no STATUS.md tasks left:
- Create your own improvement tasks — pick a page, apply the full audit checklist above
- Prioritize: dashboard → news → chart → auth → admin → everything else

## Playwright config

- Config: `playwright.config.ts` at repo root
- Output: `.screenshots/` (gitignored)
- Desktop: `1280×900`
- Mobile: `390×844`
- Dev server: `http://localhost:3000`
- Use `NEXT_PUBLIC_MOCK_MODE=1` for pages that need data — set in `.env.local` before screenshots if needed, revert after

## Commit style

```
feat|fix|chore|refactor: short summary

- what changed and why
- code quality improvements
- UI/UX fixes applied
```

## Design reference colors (apply consistently)

| Token | Hex | Usage |
|-------|-----|-------|
| Orange | `#FFD400` | Brand accent, CTAs, highlights, active states |
| Black | `#111111` | Page backgrounds, dark surfaces |
| Gray | `#1F1F1F` | Elevated surfaces, cards, inputs |
| White | `#EEEEEE` | Primary text |
