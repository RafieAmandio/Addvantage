# TradeVantage

> AI-filtered market intelligence. Internal product surface: **ANTS / DOMAIN**.

Monorepo containing:

- **`apps/web`** — Next.js 14 (App Router) public site + paid dashboard + admin review console.
- **`apps/worker`** — Node service: hourly source polling, OpenAI rephrase pipeline, Supabase writes, Telegram admin bot.
- **`packages/shared`** — shared zod schemas, source registry, hashtag taxonomy.
- **`packages/db`** — SQL migrations + generated Supabase types.
- **`infra/`** — docker-compose, Caddy config, deploy docs.

## Quick start

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local
cp apps/worker/.env.example apps/worker/.env
# fill in keys — see infra/deploy/DEPLOY.md section 0

pnpm dev:web                                    # next dev @ :3000
pnpm --filter @tradevantage/worker dev          # worker in watch mode
pnpm --filter @tradevantage/worker run:once FRED # trigger a single source run
```

## Sources

| Code | Source | Adapter |
|---|---|---|
| `[FRED]` | FRED — Federal Reserve Economic Data | API |
| `[SC]` | SlickCharts — S&P 500 constituents | HTML scrape |
| `[SPDJI]` | S&P Dow Jones Indices | HTML scrape |
| `[YRD]` | Yardeni Research | HTML scrape |
| `[RBC]` | RBC Wealth Management — Insights | HTML scrape |

Adding a new source = one file in `apps/worker/src/adapters/` implementing `SourceAdapter` + a row in `public.sources` + a line in the registry.

## Flow

1. Hourly cron tick → each enabled adapter fetches candidates.
2. Candidates are hashed + deduped against `news_items.content_hash`.
3. Survivors are passed to OpenAI (structured output → rephrase, headline, analysis, impact, bias, affects, tags).
4. Rows written with `status='pending'`.
5. Telegram bot pings whitelisted admin chats with a deeplink to `/admin/review/[id]`.
6. Admin edits the rewrite side-by-side with the original, then approves or rejects.
7. Approved items appear on `/app/news` (RLS enforced — public reads are `status='approved'` only).
8. Rejected items move to `/admin/archive`.

## Deploy

See `infra/deploy/DEPLOY.md` for the full VPS walkthrough (docker-compose + Caddy + Supabase hosted).

## Scripts

```bash
pnpm dev          # turbo, everything in parallel
pnpm build        # turbo build
pnpm typecheck    # tsc --noEmit across workspaces
pnpm lint         # eslint
```
