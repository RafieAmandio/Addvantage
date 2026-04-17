# TradeVantage — Roadmap & Progress

Status snapshot as of 2026-04-17. Living document — update as work lands.

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
- [ ] **Add `.env` to `.gitignore` audit** — confirm no secrets ever committed
- [ ] **Add `app/error.tsx` and `app/global-error.tsx`** — web app has no error boundaries
- [ ] **Add web env validation** — mirror `apps/worker/src/lib/config.ts` pattern for `NEXT_PUBLIC_*` and server vars

### High priority
- [ ] **Error tracking** — Sentry on both apps (web + worker), DSN via env
- [ ] **Structured logging on web** — currently only `console.error` in one place
- [ ] **Ship worker logs off-box** — pino → Axiom / Better Stack / Loki
- [ ] **Health check endpoints** — `/api/health` on web, heartbeat pings from worker
- [ ] **Rate limiting** — admin endpoints, server actions, especially anything hitting OpenAI
- [ ] **Fix `docker-compose.yml`** — remove `web` service (Vercel handles it), add `healthcheck`, add resource limits
- [ ] **Fix `Dockerfile`** — remove `|| pnpm install` fallback on line 14
- [ ] **GitHub Actions CI** — typecheck + lint + build on every PR

### Medium priority
- [ ] **Real auth** — wire Supabase auth into `/login` and `/signup` (currently UI only)
- [ ] **Replace mock data** — plans, calendar, education, consult should hit real tables
- [ ] **Retry/backoff** on Supabase + OpenAI calls (HTTP already has retries)
- [ ] **Graceful Telegram bot shutdown** — call `bot.stop()` before `process.exit(0)`
- [ ] **Zod validation at query boundaries** — replace `as NewsRow` casts with schema parses
- [ ] **Deploy pipeline for worker** — GHCR image build + SSH deploy to VPS on main push

### Low priority
- [ ] Admin routes: redirect instead of rendering "FORBIDDEN"
- [ ] Pin Node version in Vercel project settings
- [ ] Split `/app/consult/page.tsx` (1021 LOC single file)
- [ ] Migration rollback strategy (currently append-only)
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

**Data layer (new tables in `packages/db/migrations/0005_timeline.sql`):**
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
- [ ] `/app/chart` (or `/app/chart/[symbol]`) — new route, TIER 01 gated
- [ ] Library: **Lightweight Charts** by TradingView (open source, free, MIT) or **Recharts** for simpler case
- [ ] Component: `<TimelineChart symbol="SPX" interval="1h" />`
- [ ] API route: `GET /api/bars?symbol=SPX&interval=1h&from=...&to=...`
- [ ] API route: `GET /api/events?symbols[]=SPX&from=...&to=...`
- [ ] Realtime: Supabase realtime channel on `timeline_events` for live pin drops

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
- Migration 0005
- Stub `/app/chart/[symbol]` with hardcoded SPX + mock bars
- Wire existing `news_items` as timeline events (join query, no backfill yet)
- Lightweight Charts integration

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
6. Write migration 0005 + scaffold `/app/chart/[symbol]` route
7. Pick market data provider and sign up

Once those land, Phase A of the timeline chart can start.
