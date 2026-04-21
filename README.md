# TradeVantage

> AI-filtered market intelligence. Internal product surface: **ANTS / DOMAIN**.

Monorepo containing:

- **`apps/web`** — Next.js 14 (App Router): public site, paid dashboard (`/app/*` — news, consult, chart, plan, watchlist, calendar, education, brief, channel, subscription, tags), admin console (`/admin/*` — review, archive, plans, sources).
- **`apps/worker`** — Long-lived Node service: hourly source polling, OpenAI rephrase, bars pipeline, daily renewal-reminder cron, Telegram admin bot. All in one process.
- **`packages/shared`** — zod schemas, source registry, hashtag taxonomy.
- **`packages/db`** — append-only SQL migrations + generated Supabase types.
- **`infra/`** — docker-compose (dev + prod), Caddy config, deploy docs.

## Prerequisites

- Node ≥ 20 (see `.nvmrc`)
- pnpm 9.12+

## Setup

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local
cp apps/worker/.env.example apps/worker/.env
```

Then fill in env. The app is split into several subsystems — you only need the envs for the ones you actually exercise. Everything optional is graceful-noop when unset.

### Minimal envs to boot

**Web** (`apps/web/.env.local`):
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only; required by admin Server Actions)
- `NEXT_PUBLIC_SITE_URL` (defaults to `http://localhost:3000`)

**Worker** (`apps/worker/.env`) — required for the ingestion loop:
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY` (+ optional `OPENAI_MODEL`, default `gpt-4o-mini`)
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ADMIN_CHAT_IDS` (comma-separated numeric chat ids)
- `FRED_API_KEY` (only if the FRED adapter is enabled)

### Opt-in subsystems

Enable these only when you're working on that surface:

| Subsystem | Envs | Notes |
|---|---|---|
| Bars / charts (Phase B) | `MARKET_DATA_PROVIDER=twelvedata`, `MARKET_DATA_API_KEY` | Must be set together — schema enforces it. Used by `/app/chart` and `run:bars`. |
| Xendit payments | Worker: `XENDIT_SECRET_KEY`, `XENDIT_WEBHOOK_TOKEN`. Web: `XENDIT_WEBHOOK_TOKEN` | Webhook lives at `apps/web/app/api/webhooks/xendit`. |
| Brevo email (renewals + dunning) | Worker: `EMAIL_PROVIDER=brevo`, `BREVO_API_KEY`, `EMAIL_SENDER_EMAIL`, `EMAIL_SENDER_NAME`, `RENEWAL_TEMPLATE_ID`. Web: same plus `DUNNING_TEMPLATE_ID` | Worker registers a daily 09:00 cron only when `EMAIL_PROVIDER` is set. |
| Upstash Redis (rate-limit + single-flight) | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Used by web for consult rate-limiting, by worker for fetcher coalescing. |
| Sentry | `SENTRY_DSN` (server/worker), `NEXT_PUBLIC_SENTRY_DSN` (client), `SENTRY_ENVIRONMENT`, `SENTRY_TRACES_SAMPLE_RATE` | Unset = no init. |
| Better Stack / Logtail | `LOGTAIL_SOURCE_TOKEN`, optional `LOGTAIL_ENDPOINT` | Unset = stdout only. |
| Heartbeat | `HEARTBEAT_URL`, `HEARTBEAT_INTERVAL_MIN` | healthchecks.io / BetterStack heartbeat URL. |
| Source RSS overrides | `TRUTH_SOCIAL_RSS_URL`, `FOREXFACTORY_RSS_URL` | Mirror rotation escape hatch. |
| Selective scheduler | `ENABLED_SOURCES=FRED,SC` | Overrides `sources.enabled` in the DB. |

Worker env is validated at boot by `apps/worker/src/lib/config.ts` (the **only** place `process.env` is read in the worker). Web has a mirror at `apps/web/lib/config/server.ts`. Any new env must also be added to the `globalEnv` list in `turbo.json`.

## Run

```bash
pnpm dev                                            # everything in parallel
pnpm dev:web                                        # next dev @ :3000
pnpm --filter @tradevantage/worker dev              # worker + Telegram bot (long-poll)
pnpm --filter @tradevantage/worker run:once FRED    # one adapter end-to-end
pnpm --filter @tradevantage/worker run:bars         # bars pipeline (Phase B)
```

## Sources

| Code | Source | Adapter |
|---|---|---|
| `[FRED]` | FRED — Federal Reserve Economic Data | API |
| `[SC]` | SlickCharts — S&P 500 constituents | HTML scrape |
| `[SPDJI]` | S&P Dow Jones Indices | HTML scrape |
| `[YRD]` | Yardeni Research | HTML scrape |
| `[RBC]` | RBC Wealth Management — Insights | HTML scrape |
| `[TRUMP]` | Truth Social (trumpstruth.org mirror) | RSS |
| `[FF]` | ForexFactory weekly economic calendar | RSS |

Adding a source = new `SourceAdapter` in `apps/worker/src/adapters/`, a line in `adapters/index.ts`, a row in `packages/shared/src/constants/sources.ts`, and a migration inserting into `public.sources`.

## Flow

1. Hourly cron tick (minute 3) → each enabled adapter fetches candidates.
2. Candidates are hashed + deduped against `news_items.content_hash`.
3. Survivors go through OpenAI (structured output → rephrase, headline, analysis, impact, bias, affects, tags).
4. Rows written with `status='pending'`.
5. Telegram bot pings whitelisted admin chats with a deeplink to `/admin/review/[id]`.
6. Admin edits the rewrite side-by-side with the original, then approves or rejects.
7. Approved items appear on `/app/news` (RLS enforced — public reads are `status='approved'` only).
8. Rejected items move to `/admin/archive`.

In parallel, the worker runs: Telegram bot (`/start`, `/whoami`, `/status`), optional daily 09:00 renewal-reminder email cron, outbound heartbeat ping.

## Deploy

- **Web** → Vercel, via `pnpm turbo run build --filter=@tradevantage/web...` (see `vercel.json`).
- **Worker** → VPS under `infra/docker-compose.yml` (or `infra/docker-compose.prod.yml`). Full walkthrough in `infra/deploy/DEPLOY.md`.

The worker is **not** deployed to Vercel; long-poll Telegram + cron need a persistent process.

## Scripts

```bash
pnpm dev          # turbo, everything in parallel
pnpm build        # turbo build
pnpm typecheck    # tsc --noEmit across workspaces
pnpm lint         # eslint
```
