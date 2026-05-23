# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repo shape

pnpm + Turborepo monorepo. Node >= 20 (see `.nvmrc`). Three apps and two shared packages:

- `apps/web` — Next.js 14 App Router. Public site, paid dashboard at `/app/*` (news, consult, chart, plan, watchlist, calendar, education, brief, channel, subscription, tags), admin console at `/admin/*` (review, archive, plans, sources). API routes under `app/api/*` include `consult/stream` (SSE), `bars`, `events`, `health`, `webhooks/xendit`.
- `apps/api` — Express.js backend on `:3100`. Feature-based architecture (`src/features/*/`), Prisma ORM, JWT auth, Zod validation. Handles plans, news, users, channels, RSI, subscriptions, payments, consult.
- `apps/worker` — Long-lived Node service. Runs the hourly ingestion scheduler, the grammY Telegram bot, the daily renewal-reminder cron (when email is configured), the heartbeat pinger, and the bars CLI — **all in one process**.
- `packages/shared` — zod schemas, hashtag taxonomy, source registry. Imported by both apps as raw `.ts` (no build step).
- `packages/db` — Prisma schema + migrations. `@tradevantage/db` re-exports the Prisma client and `Database` type.

## Commands

```bash
pnpm install

# Dev
pnpm dev                                              # everything in parallel (turbo)
pnpm dev:web                                          # next dev @ :3000
pnpm --filter @tradevantage/worker dev                # worker in tsx watch mode

# Trigger a single adapter end-to-end (fetch → dedupe → OpenAI → insert → Telegram ping)
pnpm --filter @tradevantage/worker run:once FRED      # or SC | SPDJI | YRD | RBC | TRUMP | FF

# Bars pipeline (Phase B) — requires MARKET_DATA_PROVIDER + MARKET_DATA_API_KEY
pnpm --filter @tradevantage/worker run:bars

# Build / check
pnpm build
pnpm typecheck
pnpm lint
```

No test framework is configured. Don't invent one — if the user asks for a test, ask which runner they want first.

## Ingestion pipeline (end-to-end)

This is the core flow and spans five files. Read them together when touching anything here.

1. `apps/worker/src/scheduler/index.ts` — `setInterval(30s)` poll loop fires adapters on schedule (and once at boot). Reads `public.sources.enabled` from Supabase; `ENABLED_SOURCES` env overrides the DB list. Iterates `ADAPTERS` and calls `runSource(code)`.
2. `apps/worker/src/pipeline/runSource.ts` — opens an `ingestion_runs` row, calls the adapter, persists, pings Telegram, closes the run row with counters and updates `sources.last_*`.
3. `apps/worker/src/adapters/*.ts` — one file per source, each implementing `SourceAdapter` from `adapters/base.ts` and registered in `adapters/index.ts`. Currently: FRED, SC, SPDJI, YRD, RBC, TRUMP (Truth Social RSS), FF (ForexFactory RSS + indicators variant). Returns `Candidate[]`; must **not** pre-summarise. Side-adapter families with their own registries live in `adapters/bars/`, `adapters/payment/`, and `adapters/email/` — same self-register pattern.
4. `apps/worker/src/pipeline/persist.ts` — `contentHash([sourceCode, externalId, rawText])` is the dedupe key, stored in `news_items.content_hash` with unique `(source_code, content_hash)`. Existing hashes are pre-loaded per run to avoid per-row round-trips.
5. `apps/worker/src/pipeline/rephrase.ts` — calls OpenAI with `response_format: json_schema` (strict), validates with `RephraseOutputSchema`, returns `{ headline, rephrased, analysis, impact, bias, affects, tags }`. Rows are inserted `status='pending'`.
6. `apps/worker/src/telegram/notify.ts` — DMs every whitelisted admin (env `TELEGRAM_ADMIN_CHAT_IDS` ∪ `public.telegram_admins` where `active=true`) a deeplink to `/admin/review/[id]`. `apps/worker/src/telegram/bot.ts` also serves `/start`, `/whoami`, `/status` commands.

Admin approves/edits/rejects under `apps/web/app/admin/review/[id]`. Public reads on `/app/news` are gated by RLS to `status='approved'` only — there is no `.eq("status","approved")` safety net you can remove; the policy in `packages/db/migrations/0003_rls.sql` is the guarantee.

**Adding a source.** Three edits, in this order:
1. `packages/shared/src/constants/sources.ts` — add the row (new `code`).
2. `apps/worker/src/adapters/<name>.ts` — implement `SourceAdapter`, register in `adapters/index.ts`.
3. New migration in `packages/db/migrations/` inserting into `public.sources`.

## Editorial rule (do not violate)

The rephrase system prompt (`apps/worker/src/pipeline/rephrase.ts`) forbids crediting the wire source in output text. Byline is always the source code (`[FRED]`, `[SC]`, `[SPDJI]`, `[YRD]`, `[RBC]`). Changing this breaks the product's positioning — don't soften the prompt without being asked. The same file also enforces the tactical/terse tone; keep it.

## Closed taxonomy — enums live in three places

Hashtags, impact, and bias are a **closed set**. When adding a value, update all three or the pipeline will throw or the DB will reject the row:

1. `packages/shared/src/constants/hashtags.ts` — source of truth (`HASHTAGS`, `IMPACT_LEVELS`, `BIAS_LEVELS`).
2. The `json_schema` enum in `apps/worker/src/pipeline/rephrase.ts` (built from the constants above — usually picks up automatically, but verify).
3. The `check (impact in ...)` / `check (bias in ...)` constraints in `packages/db/migrations/0002_sources.sql` — add a new migration to `ALTER` the constraint, don't edit the committed file.

## Database & RLS

- Migrations in `packages/db/migrations/` are **append-only and numbered**. Never edit a committed migration — add a new file. See `packages/db/README.md`.
- Every new table must ship RLS in the same migration. `public.is_admin()` (SQL helper) is the canonical admin check; reuse it instead of inlining `select is_admin from profiles`.
- After any schema change, run `pnpm --filter @tradevantage/db generate` (or `npx prisma generate` inside `packages/db`) to regenerate the Prisma client.
- RLS summary: `profiles` self-read + admin override, `news_items` public read only if `status='approved'`, `ingestion_runs` admin-read, `telegram_admins` admin-only.

## Supabase clients (web)

Three distinct clients — pick the right one:

- `lib/supabase/server.ts` — `supabaseServer()` for Server Components, Server Actions, Route Handlers. Reads the session cookie.
- `lib/supabase/client.ts` — `supabaseBrowser()` for Client Components that need live/realtime data.
- `lib/supabase/admin.ts` — `supabaseAdmin()` bypasses RLS via the service-role key. Server-only. Only use when a specific admin bulk op genuinely needs to bypass policy. Never import from a `"use client"` file or anywhere that ends up in a client bundle — the key must stay out of `NEXT_PUBLIC_*`.
- `lib/supabase/middleware.ts` + root `middleware.ts` — refreshes the session cookie on every request; keep the matcher exclusions in sync if adding new static asset extensions.

Auth helpers: `lib/auth/session.ts` exposes `getSession`, `getProfile`, `requireAdmin`. Server-only.

## Env contract (both apps)

Two validated schemas, same pattern: parse at boot, exit/throw on misconfig, `emptyToUndef` so blank `.env` fields count as unset.

- `apps/worker/src/lib/config.ts` — the **only** place `process.env` may be read in the worker. Covers Supabase, OpenAI, Telegram, FRED, source RSS overrides, `ENABLED_SOURCES`, heartbeat, market data (with a `refine()` coupling `MARKET_DATA_PROVIDER` ↔ `MARKET_DATA_API_KEY`), Upstash, Xendit, Brevo + `RENEWAL_TEMPLATE_ID`, Logtail, Sentry.
- `apps/web/lib/config/server.ts` — server-only mirror. Runtime-guards against client imports (throws if `typeof window !== "undefined"`). Covers service-role key, Xendit webhook token, Brevo + `DUNNING_TEMPLATE_ID`, Sentry DSN.

Graceful-noop is the house rule for optional integrations (Upstash, Brevo, Xendit, Sentry, Logtail, Heartbeat): when an env is unset, the adapter doesn't self-register and callers either skip the work or return a 503 — the app never crashes on missing optional config.

When adding a new env: extend the relevant schema, add it to `turbo.json` `globalEnv`, update `.env.example` files (root `infra/.env.example` if it's shared between web + worker deploy).

## Subsystems beyond news ingestion

Don't assume the worker is only the news pipeline. Other things it runs:

- **Bars pipeline** — `apps/worker/src/adapters/bars/` (currently `twelvedata.ts`). Fed via `run:bars` CLI; consumed by `/app/chart` and `app/api/bars`.
- **Payment webhooks** — Xendit adapter in `apps/worker/src/adapters/payment/xendit.ts`; web-side webhook at `apps/web/app/api/webhooks/xendit/route.ts` verifies via `XENDIT_WEBHOOK_TOKEN`. Both sides must see the same token.
- **Email** — Brevo adapter in `apps/worker/src/adapters/email/brevo.ts` plus `apps/web/lib/email/brevo.ts`. Worker registers a daily 09:00 renewal-reminder cron (`scheduler/renewal-reminder.ts`) only when `EMAIL_PROVIDER=brevo`. Web uses Brevo for dunning with `DUNNING_TEMPLATE_ID`.
- **Consult** — `/app/consult` hits `app/api/consult/stream` (SSE, OpenAI). Rate-limited via Upstash when configured; degrades to unbounded when not.
- **Single-flight coalescing** — Upstash Redis. When unset, the singleflight wrapper becomes a direct fetcher call (still correct, just not coalesced across instances).

## Web state caveat

`apps/web/lib/state.tsx` (`AppStateProvider`) persists `tier`, `liabilitySigned`, operator name, and sidebar collapse state in `localStorage` — leftover from the mock prototype. Real tier comes from `profiles.tier` via `getProfile()`. Don't treat the localStorage tier as authoritative for gating; it exists for dev convenience on pages that haven't been converted yet.

## Deployment (Dokploy on VPS)

All services deploy to a Hostinger VPS (4GB RAM, Ubuntu 24.04) via Dokploy (Docker Swarm + Traefik). DNS through Cloudflare (Full strict TLS).

| Service | URL | Dokploy App ID | Docker App Name |
|---------|-----|----------------|-----------------|
| Web | https://tradevantage.gg | `g-kctMkTjn_hr_n9I_GAD` | `tradevantage-web-vrcahi` |
| API | https://api.tradevantage.gg | `llgO8uAqXsHJYILDxDorp` | `tradevantage-api-wa9jn3` |
| Worker | (no public URL) | `5Az6Gqlcv7l2yH6PfAvAB` | `tradevantage-worker-cc8pw2` |
| Hermes | https://hermes.tradevantage.gg | `B1Tw_Mkr6YRc9yMQ9api2` | `app-copy-redundant-application-796153` |
| Dokploy | https://dashboard.tradevantage.gg | — | — |

**SSH:** `ssh tradevantage` (key: `~/.ssh/id_ed25519_tradevantage`, IP: `76.13.198.76`).

**Deploying via Dokploy API (preferred):**

```bash
# 1. Push to main
git push origin main

# 2. Authenticate with Dokploy
ssh tradevantage "curl -s -X POST 'http://localhost:3000/api/auth/sign-in/email' \
  -H 'Content-Type: application/json' \
  -c /tmp/dk \
  -d '{\"email\":\"tradevantage.gg@gmail.com\",\"password\":\"Bitcoinmaxi88\"}'"

# 3. Trigger deploy (replace APP_ID with the Dokploy App ID from the table above)
ssh tradevantage "curl -s -X POST 'http://localhost:3000/api/trpc/application.deploy' \
  -H 'Content-Type: application/json' \
  -b /tmp/dk \
  -d '{\"json\":{\"applicationId\":\"APP_ID\"}}'"
```

Dokploy handles git pull, docker build (with env/build-args), and service update automatically. Do NOT manually `docker build` or `docker service update` — let Dokploy manage the full lifecycle.

**Key production env vars** (set in Dokploy, NOT in .env files):
- Web: `HOSTNAME=0.0.0.0` (critical — Swarm overrides HOSTNAME), `NEXT_PUBLIC_API_URL=https://api.tradevantage.gg`, `JWT_SECRET`
- API: `DATABASE_URL` (Supabase pooler), `JWT_SECRET` (same as web), `CORS_ORIGIN=https://tradevantage.gg,https://www.tradevantage.gg`, `LLM_*` (Moonshot kimi-k2.6)
- Worker: `DATABASE_URL`, `LLM_*`, `FRED_API_KEY`, `SITE_URL=https://tradevantage.gg`
- Full env reference: `DEPLOYMENT.md`

**Dockerfiles:** `apps/web/Dockerfile`, `apps/api/Dockerfile`, `apps/worker/Dockerfile`. All copy `packages/db/prisma` before install for Prisma codegen. Web uses `output: "standalone"`. API + Worker use `tsx` at runtime (ESM compat).

## Server action rules

`"use server"` files can **only export async functions**. Exporting constants, objects, or variables (e.g., Zod schemas) breaks server action registration and causes 500s in production. Keep non-function values as `const` (not `export const`) or move them to a separate file.

## Gotchas

- Shared packages (`@tradevantage/shared`, `@tradevantage/db`) ship raw `.ts` from `src/`. `apps/web/next.config.js` lists them in `transpilePackages` and sets `experimental.outputFileTracingRoot` to the monorepo root — both are required for builds. Don't remove.
- Worker runs the Telegram bot via long-polling. If scaling to multiple replicas, switch to webhook mode — do not run two long-pollers against one bot token.
- After deploying web, users must hard-refresh (Cmd+Shift+R) to pick up new server action IDs. Cloudflare may cache stale JS bundles.
- Express async middleware (`requireAuth`, `requireAdmin`, `adminRateLimit`) must be wrapped in `asyncHandler` — Express 4 doesn't catch thrown errors from async middleware, causing process crashes.
