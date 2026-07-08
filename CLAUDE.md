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

Admin approves/edits/rejects under `apps/web/app/admin/review/[id]`. `/app/news` is served through the Express API, which filters to `status='approved'` in the news repository query — that query **is** the guarantee (do NOT remove it). `news_items` has RLS enabled with no policy (service-role backend only); the intended-but-never-applied `0003_rls.sql` "public read if approved" policy is not live, and the web app does not read the table directly, so RLS is not the news-visibility gate.

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

**Migrations use Prisma Migrate** (adopted 2026-07; `packages/db/prisma/schema.prisma` is
the source of truth). The old numbered SQL in `packages/db/migrations/` is **frozen /
historical — do not apply it**. **NEVER apply DDL via the Supabase SQL editor or the MCP
`apply_migration` tool** — out-of-band edits are exactly what caused a silent prod↔repo
drift (15 tables shipped with RLS disabled, incl. `payments`). Schema changes go through
one path only:

1. Edit `prisma/schema.prisma`.
2. `pnpm --filter @tradevantage/db exec prisma migrate dev --name <change> --create-only`
   → generates `prisma/migrations/<timestamp>_<change>/migration.sql`.
3. **Hand-append the RLS to that `migration.sql`.** Prisma cannot model RLS, policies,
   `SECURITY DEFINER` functions, grants, or storage — if the migration adds a table you
   MUST add its `ENABLE ROW LEVEL SECURITY` + policies in the same file, guarded so it also
   applies on a vanilla Postgres shadow DB (copy the role/`auth.uid()`/`check_function_bodies`/
   `storage` guards from `0_init/migration.sql`). **A table shipped without RLS is a
   CRITICAL bug — the CI `db-drift` gate is blind to RLS; only `db-rls-guard` + `get_advisors`
   catch it.**
4. Apply: `prisma migrate deploy` (CI runs this on deploy once the `PROD_DIRECT_DB_URL`
   secret is set — session-mode connection, port 5432, NOT the 6543 pooler). Then
   `prisma generate` to refresh the client.
5. After any change, run `get_advisors` (security) — treat any ERROR/WARN as a blocker.

- `public.is_admin()` (SECURITY DEFINER, `search_path`-pinned) is the canonical admin check
  inside policies — reuse it, don't inline `select is_admin from profiles`. It is **not**
  RPC-callable by anon/authenticated (execute revoked); only policies + the service-role
  backend use it.
- **Actual RLS posture:** backend-only tables (`profiles`, `news_items`, `payments`,
  `consult_*`, `trading_plans`, `education_primers`, …) have RLS **enabled with NO policy** —
  the Express API reaches them over the service-role Postgres connection (bypasses RLS) and
  the web app never queries them directly. A handful of reference/market tables
  (`*_snapshots`, `token_unlocks*`, `channel_threads`, `video_modules`, `timeline_events`)
  have explicit public-read policies. **Access control for `/app/*` is enforced by the API
  (JWT + subscription tier), NOT by table RLS.**
- CI guards: `db-drift` (PR) fails if `prisma/migrations` no longer reproduce
  `schema.prisma`; `db-rls-guard` (PR) fails if a migration adds a table with no RLS; a
  weekly `db-drift-scheduled` job diffs **live prod** vs the schema + runs the advisor to
  catch any out-of-band edits. **Prod project ref: `mlbcppehtoytqqbrkirn`.**

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

**Deploying (local build → GHCR → Dokploy pull, since 2026-07-06):**

Images are built locally and pushed to GHCR; the Dokploy apps use the
Docker-image source (`ghcr.io/rafieamandio/tradevantage-{web,api,worker}:latest`)
and only pull + swap containers — no builds on the 4GB VPS.

```bash
# Build linux/amd64 images, push :latest + :<sha>, trigger Dokploy redeploys
scripts/deploy-local.sh              # all three services
scripts/deploy-local.sh web          # one service
SKIP_DEPLOY=1 scripts/deploy-local.sh  # build+push only
```

One-time machine setup: `gh auth refresh -h github.com -s write:packages,read:packages`,
then `gh auth token | docker login ghcr.io -u RafieAmandio --password-stdin`.
The web image bakes `NEXT_PUBLIC_*` at build time — values live in the script.
Dokploy's registry pull credential is a GitHub token saved per-app
(application.saveDockerProvider); if GH auth is regenerated, update it there.

The Dokploy dashboard API (auth + `application.deploy`) can also be called
directly at `https://dashboard.tradevantage.gg` with the panel login
(`tradevantage.gg@gmail.com` / `Bitcoinmaxi88`). `application.deploy` on a
docker-source app pulls the image and redeploys. Do NOT manually
`docker build` or `docker service update` on the VPS — let Dokploy manage
the service lifecycle.

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
