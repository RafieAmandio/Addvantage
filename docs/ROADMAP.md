# TradeVantage — Roadmap & Progress

Status snapshot as of 2026-04-17. Living document — update as work lands.

---

## 0. Engineering Principles (apply to every change)

### Reusability is non-negotiable
Every new component, hook, query, or adapter must be built for reuse from day one. Before writing anything new, check if something existing covers it.

**Project layout (feature-based):**
- `apps/web/app/` — thin route tree. Pages compose from features, no business logic.
- `apps/web/features/<name>/` — everything a feature owns:
  - `components/` — feature-specific UI
  - `hooks/` — feature-specific hooks (e.g. `useWatchlist`)
  - `queries/` — Supabase reads, Zod-validated, one file per domain
  - `mock.ts` — mock data while feature is not yet wired to real DB
  - `types.ts` — feature-local types
- `apps/web/components/ui/` — **true primitives only**, feature-agnostic (Button, Marker, Highlight, Breadcrumbs, Paywall, ConfirmDialog, PageSearchInput, Classification, BackToTop, Ticker)
- `apps/web/components/layout/` — app chrome that wraps every page (Sidebar, TopBar, Shortcuts, VisitTracker, DocumentTitle)
- `apps/web/lib/` — cross-cutting utilities only (supabase clients, auth helpers, cn, state, toast, visits, config)

**Rules:**
- Feature-specific UI → `features/<name>/components/`, never in `page.tsx` and never in `components/ui/`
- If a component is used by 2+ features, promote it to `components/ui/`
- No direct Supabase calls inside display components — pass data in or use a feature query
- Expose a `className` prop and use `cn()` so callers can restyle without forking
- If a component takes more than ~3 responsibilities, split it

**Hook rules:**
- Anything touching `localStorage`, `window`, realtime subscriptions, or polling → custom hook in `apps/web/features/<name>/hooks/` (feature-local) or `apps/web/lib/hooks/` only if truly cross-feature.
- Examples of hooks that should already exist and be reused: `useWatchlist` (`features/watchlist/hooks/`), `useSeenNews` (`features/news/hooks/`), `useReadPrimers` (`features/education/hooks/`). Do not reimplement localStorage logic inline.

**Query rules:**
- All Supabase reads go through `apps/web/features/<name>/queries/<domain>.ts` (e.g. `features/news/queries/news.ts`, future `features/chart/queries/bars.ts`, `features/timeline/queries/timeline.ts`).
- Validate shape with Zod at the query boundary — do not `as SomeType` cast.
- Queries return plain serializable objects, not Supabase response wrappers.

**Worker rules:**
- New ingestion sources implement `SourceAdapter` from `apps/worker/src/adapters/base.ts`. Never fork the pipeline for a "special" source.
- Shared helpers (HTTP fetch with retry, rephrase, persist, notify) live in `apps/worker/src/lib/` or `apps/worker/src/pipeline/` — adapters only fetch + map to `Candidate[]`.
- Tweets, news, macro events all funnel into the same `timeline_events` table via the same pipeline. No parallel universes.

**Schema rules:**
- Enums (impact, bias, hashtags, event kinds) live in `packages/shared/src/constants/`. Update there first, then the DB constraint, then the JSON schema. In that order.
- Types flow: DB → `supabase gen types` → `@tradevantage/db` → consumed by both apps.

### Before adding a new file, ask:
1. Does a component/hook/query already do this? (grep first)
2. Can I extend an existing one with a prop instead of forking?
3. Will someone else reuse this within 3 months? If yes, put it in a shared folder with a clear name.

### Refactor-as-you-go
When touching a page that inlines UI or duplicates logic from another page, lift the shared piece into `features/<name>/components/`, `features/<name>/hooks/`, or (if truly generic) `components/ui/` in the same PR. Don't leave breadcrumbs for later.

---

## 1. Current State

### Backend (apps/worker) — **Production-ready pipeline**
- Hourly cron scheduler (node-cron) polling 5 source adapters: FRED, SlickCharts, SPDJI, Yardeni, RBC
- Dedupe via content hash (`source_code + external_id + raw_text`)
- OpenAI rephrase with strict JSON schema → `{headline, rephrased, analysis, impact, bias, affects, tags}`
- Supabase persistence with `ingestion_runs` observability
- Telegram admin bot (grammY, long-poll): `/start`, `/whoami`, `/status`, pending-item notifications
- Centralized env validation in `apps/worker/src/lib/config.ts`

### Admin Console (apps/web/admin) — **Real, working**
- `/admin/review` — pending queue, fetched from Supabase
- `/admin/review/[id]` — edit/approve/reject with server actions
- `/admin/sources` — source registry display (read-only)

### User-Facing App (apps/web/app) — **UI complete, mostly mock data**
- 27 routes built with polished design
- Real data: `/app/news`, `/app/news/[id]` (Supabase-backed)
- Mock data: plans, calendar, education, consult, channel, watchlist, tags, subscription
- State: `AppStateProvider` (tier, operator name, liability) + localStorage persistence

### Shared Infrastructure
- `packages/shared` — Zod schemas, closed hashtag taxonomy (9 tags), source registry
- `packages/db` — 4 migrations, RLS policies, generated Supabase types
- Turbo + pnpm monorepo, Node 20

---

## 2. Production Readiness Gaps

### Critical (must fix before real users)
- [ ] **Rotate Supabase service role key** — currently visible in `apps/worker/.env`; verify git history is clean
- [x] **Add `.env` to `.gitignore` audit** — confirm no secrets ever committed
- [x] **Add `app/error.tsx` and `app/global-error.tsx`** — web app has no error boundaries
- [x] **Add web env validation** — mirror `apps/worker/src/lib/config.ts` pattern for `NEXT_PUBLIC_*` and server vars

### High priority
- [ ] **Error tracking** — Sentry on both apps (web + worker), DSN via env
- [x] **Structured logging on web** — currently only `console.error` in one place
- [ ] **Ship worker logs off-box** — pino → Axiom / Better Stack / Loki
- [x] **Health check endpoint (web)** — `/api/health` returns 200/503 with Supabase ping
- [x] **Heartbeat pings from worker** — provider-agnostic outbound POST every `HEARTBEAT_INTERVAL_MIN` minutes (default 5) to `HEARTBEAT_URL`; works with healthchecks.io, BetterStack, etc. Disabled when env unset.
- [ ] **Rate limiting** — admin endpoints, server actions, especially anything hitting OpenAI
- [x] **Fix `docker-compose.yml`** — remove `web` service (Vercel handles it), add `healthcheck`, add resource limits
- [x] **Fix `Dockerfile`** — remove `|| pnpm install` fallback on line 14
- [x] **GitHub Actions CI** — typecheck + lint + build on every PR

### Medium priority
- [ ] **Real auth** — wire Supabase auth into `/login` and `/signup` (currently UI only)
- [ ] **Replace mock data** — plans, calendar, education, consult should hit real tables
- [x] **Retry/backoff** on Supabase + OpenAI calls — generic helper at `apps/worker/src/lib/retry.ts`; wraps OpenAI rephrase + Supabase persist insert/loadExistingHashes
- [x] **Graceful Telegram bot shutdown** — call `bot.stop()` before `process.exit(0)`
- [x] **Zod validation at query boundaries** — replace `as NewsRow` casts with schema parses; admin/sources page lifted into `features/sources/queries/`
- [ ] **Deploy pipeline for worker** — GHCR image build + SSH deploy to VPS on main push

### Low priority
- [x] Admin routes: redirect instead of rendering "FORBIDDEN"
- [ ] Pin Node version in Vercel project settings
- [ ] Split `/app/consult/page.tsx` (was 1021 LOC; now 893 after C1)
  - [x] **C1.** Extract pure helpers — `sessionMatchesQuery`, `pickReply`+`CANNED_REPLIES`, `sessionToMarkdown`, types — into `features/consult/lib/{search,replies,export}.ts` and `features/consult/types.ts`
  - [ ] **C2.** Extract message/bubble components (`Bubble`, `TypingIndicator`) into `features/consult/components/`
  - [ ] **C3.** Extract `ScrollableConversation` and `ConsultLayout` into `features/consult/components/`
  - [ ] **C4.** `ConsultPageView` body becomes a thin composition; route file shrinks to <100 LOC
- [x] Migration rollback strategy (currently append-only) — documented in `packages/db/README.md` (forward-only convention, how to revert via new migration, pre-flight checks)
- [ ] Staging environment (separate Supabase + preview VPS/Fly app)

---

## 3. Feature Backlog (non-infrastructure)

### Payment integration
- [ ] Real subscription billing — Stripe or midtrans (IDR). Currently mock ledger
- [ ] Webhook handler for tier upgrades/downgrades → update `profiles.tier`
- [ ] Renewal + dunning emails

### Trading plan system
- [ ] Real plan authoring flow for admins (not mock)
- [ ] Setup outcome tracking (win/loss/R) tied to market close prices
- [ ] Plan → news cross-links (via `news_items.related_plan_ids` — column exists, unused)

### Consultation
- [ ] Real LLM-backed chat (replace canned keyword replies)
- [ ] Message persistence in Supabase (currently localStorage only)
- [ ] Rate limit per tier

### Calendar
- [ ] Real economic calendar source adapter (ForexFactory, Investing.com, or TradingEconomics API)
- [ ] Event → news correlation

---

## 4. New Feature: **Market Timeline Chart**

> *"TradingView-style price chart with overlay annotations pinned to timestamps — tweets, news headlines, econ releases — so users can see what actually drove the move."*

### Concept
A candlestick/line chart for a selected instrument (SPX, BTC, DXY, individual tickers) with draggable timeline markers showing:
- **News events** — existing `news_items` plotted by `published_at`, tagged to `affects[]`
- **Social signals** — e.g. Donald Trump tweets (via X API or Truth Social scraper), Elon Musk tweets
- **Macro events** — FOMC, CPI prints, earnings from calendar
- **Custom pins** — user-added annotations

Click a marker → popover with headline + analysis + bias tag. Click "jump to news" → routes to `/app/news/[id]`.

### Why this is the right feature
- Differentiator: TradingView doesn't do news/tweet overlays natively; Bloomberg does but costs $25k/yr
- Reuses existing infrastructure: news pipeline, hashtag taxonomy, `affects[]` column
- Monetizable: clear TIER 01 gate (power users)
- Defensible moat: the curation + editorial byline (`[FRED]`, `[SC]`) already creates a unique dataset

### Architecture plan

**Data layer (new tables in `packages/db/migrations/0007_timeline.sql` — current highest is 0006):**
```sql
-- OHLCV candles cached from market data provider
create table instrument_bars (
  symbol text not null,
  interval text not null,         -- '1m'|'5m'|'1h'|'1d'
  ts timestamptz not null,
  open numeric, high numeric, low numeric, close numeric, volume numeric,
  primary key (symbol, interval, ts)
);

-- Generic timeline events (superset of news, tweets, macro)
create table timeline_events (
  id uuid primary key default gen_random_uuid(),
  kind text not null,             -- 'news'|'tweet'|'macro'|'earnings'|'user_pin'
  source_code text,               -- '[FRED]', '[TRUMP]', '[USER]'
  occurred_at timestamptz not null,
  symbols text[] not null,        -- which instruments this affects
  title text not null,
  body text,
  url text,
  bias text,                      -- reuses existing enum
  impact text,                    -- reuses existing enum
  metadata jsonb,                 -- kind-specific payload
  news_item_id uuid references news_items(id),  -- backlink if kind='news'
  created_by uuid references profiles(id),      -- for user_pin
  created_at timestamptz default now()
);
create index on timeline_events using gin (symbols);
create index on timeline_events (occurred_at desc);
```

**New worker adapters:**
- [ ] **Trump tweet adapter** — Truth Social RSS or scraper; run every 5 min
- [ ] **Market data adapter** — Polygon.io, Alpaca, or Tiingo free tier → `instrument_bars`
- [ ] **Backfill job** — migrate existing `news_items` into `timeline_events` with `kind='news'`

**Web app:**
- [ ] `/app/chart` (or `/app/chart/[symbol]`) — new route, TIER 01 gated (page is thin, just composes reusable components)
- [ ] Library: **Lightweight Charts** by TradingView (open source, free, MIT)
- [ ] API route: `GET /api/bars?symbol=SPX&interval=1h&from=...&to=...`
- [ ] API route: `GET /api/events?symbols[]=SPX&from=...&to=...`
- [ ] Realtime: Supabase realtime channel on `timeline_events` for live pin drops

**Reusable components to produce (build these as standalone, reuse everywhere). New features `features/chart/` and `features/timeline/` will be created:**
- `features/chart/components/PriceChart.tsx` — dumb wrapper over Lightweight Charts. Props: `bars[]`, `interval`, `onCrosshairMove`. No data fetching.
- `features/timeline/components/TimelineMarkers.tsx` — renders event dots on a time axis. Props: `events[]`, `onHover`, `onClick`. Works standalone (useful on `/app/news` too as a mini-timeline).
- `features/timeline/components/EventDrawer.tsx` — side drawer showing event body + source. Reuse for news detail, tweet detail, macro detail.
- `features/chart/components/SymbolSearch.tsx` — combobox for instrument lookup. Reuse anywhere a user picks a symbol (watchlist add, plan authoring).
- `features/chart/components/IntervalPicker.tsx` — 1m/5m/1h/1d toggle. Small, but reused.
- `features/timeline/components/EventFeed.tsx` — vertical list of timeline events. Reuse on chart page, news page, and plan detail page.
- `features/timeline/components/EventCard.tsx` — single event row (icon by kind, title, time, bias pill). Reuse inside `EventFeed` and in the drawer.
- `features/chart/hooks/useBars.ts` — fetches + caches candles. SWR-style.
- `features/timeline/hooks/useTimelineEvents.ts` — fetches + subscribes to realtime events for given symbols + range.
- `features/chart/queries/bars.ts` + `features/timeline/queries/timeline.ts` — Supabase reads, Zod-validated.

**UX sketch:**
- Top: symbol search + interval picker (1m/5m/1h/1d)
- Main: candlestick chart, ~70% height
- Overlay: colored dots on the time axis by `kind` (blue=news, orange=tweet, red=macro, grey=user_pin)
- Hover dot → tooltip with title + time
- Click dot → side drawer with full event body, link to source
- Left rail: event feed for the visible time window (like TradingView's news panel)
- Bottom: "Add pin" button → modal for user annotations

### Rollout phases

**Phase A — Skeleton (2-3 days):**
- [x] **A1.** Migration 0007 — `instrument_bars` + `timeline_events` tables, RLS, indexes
- [x] **A2.** Wire existing `news_items` as `timeline_events` via a feature query (`features/timeline/queries/timeline.ts`) — join, no backfill yet
- [x] **A3.** Add `lightweight-charts` dep + `features/chart/components/PriceChart.tsx` dumb wrapper
- [x] **A4.** Stub `/app/chart/[symbol]` route — composes `PriceChart` with hardcoded SPX mock bars + the timeline query from A2

**Phase B — Real data (3-5 days):**
- Market data adapter in worker
- Bar backfill job (1 year 1h candles per symbol)
- `/api/bars` and `/api/events` routes
- Click-through to news detail

**Phase C — Tweet source (2-3 days):**
- Trump tweet adapter (Truth Social)
- Add to worker scheduler
- Dot rendering + drawer UI

**Phase D — Polish (ongoing):**
- Symbol search
- User pins (auth required)
- Realtime updates
- More macro sources (FOMC, CPI from calendar)
- Mobile layout

### Open questions
- Market data provider: Polygon ($29/mo, good), Alpaca (free, US only), Tiingo (free, limited)? Pick one early.
- Storage cost: 1h bars for 50 symbols × 5 years ≈ 2M rows, fine for Supabase
- Trump tweets: Truth Social has no official API; RSS exists but rate-limited. Plan B: scrape with rotating proxies, or use a paid aggregator
- Do we precompute "driver score" (which event likely moved price) or keep it purely visual? Suggest visual-only for v1

---

## 5. Immediate Next Steps (this week)

1. Rotate Supabase service role key → update env on VPS + Vercel
2. Add `error.tsx` / `global-error.tsx` to web app
3. Create `apps/web/lib/config.ts` for env validation
4. Fix `docker-compose.yml` + `Dockerfile`
5. Set up GitHub Actions CI workflow
6. Write migration 0007 + scaffold `/app/chart/[symbol]` route (apply via Supabase MCP `apply_migration`, regenerate types)
7. Pick market data provider and sign up

Once those land, Phase A of the timeline chart can start.

---

## 6. Improvement Backlog (auto-discovered)

- [ ] **[performance] Admin news queries select `*` and are unpaginated** — `listPendingNews` / `listRejectedNews` fetch every row of `news_items` with every column; as the queue grows, this gets slow and bloats the payload. Narrow the column list (match `listApprovedNews` at line 60) and add `.range()` pagination. _(found tick 1, apps/web/features/news/queries/news.ts:69-89)_
- [ ] **[observability] Search query silently swallows errors** — `catch { return []; }` discards the error, so a broken search looks like "no results" with no signal in logs. Replace with `logger.warn("search failed", { error: err })` (logger already exists at `lib/logger.ts`) before returning `[]`. _(found tick 5, apps/web/features/search/search.ts:97)_
- [ ] **[performance] timeline_events RLS policies use raw `auth.uid()`** — Supabase advisor `auth_rls_initplan` flags the `owner read user_pin` policy; `auth.uid()` is re-evaluated per row at scale. Wrap as `(select auth.uid())` in a follow-up migration. _(found tick 11, packages/db/migrations/0007_timeline.sql RLS section)_
- [ ] **[performance] timeline_events_created_by_fkey lacks a covering index** — Supabase advisor `unindexed_foreign_keys`. Add `create index timeline_events_created_by_idx on public.timeline_events (created_by) where created_by is not null;` in a follow-up migration. _(found tick 11)_
