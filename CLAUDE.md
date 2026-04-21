# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repo shape

pnpm + Turborepo monorepo. Node >= 20 (see `.nvmrc`). Two apps and two shared packages:

- `apps/web` — Next.js 14 App Router. Public site, paid dashboard at `/app/*` (news, consult, chart, plan, watchlist, calendar, education, brief, channel, subscription, tags), admin console at `/admin/*` (review, archive, plans, sources). API routes under `app/api/*` include `consult/stream` (SSE), `bars`, `events`, `health`, `webhooks/xendit`.
- `apps/worker` — Long-lived Node service. Runs the hourly ingestion scheduler, the grammY Telegram bot, the daily renewal-reminder cron (when email is configured), the heartbeat pinger, and the bars CLI — **all in one process**.
- `packages/shared` — zod schemas, hashtag taxonomy, source registry. Imported by both apps as raw `.ts` (no build step).
- `packages/db` — SQL migrations + generated Supabase `Database` type re-exported from `src/index.ts`.

Note: `apps/web/README.md` describes a pre-production mock-only prototype. That README is stale — the root README and commit `663be9a` ("Turn mock prototype into production monorepo with real ingestion") are authoritative. The web app is wired to real Supabase.

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

Web-only Vercel deploy uses `pnpm turbo run build --filter=@tradevantage/web...` (see `vercel.json`). The worker is **not** deployed to Vercel; it runs on a VPS under `infra/docker-compose.yml`. Full walkthrough: `infra/deploy/DEPLOY.md`.

## Ingestion pipeline (end-to-end)

This is the core flow and spans five files. Read them together when touching anything here.

1. `apps/worker/src/scheduler/index.ts` — `node-cron` fires at minute 3 every hour (and once at boot). Reads `public.sources.enabled` from Supabase; `ENABLED_SOURCES` env overrides the DB list. Iterates `ADAPTERS` and calls `runSource(code)`.
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
- After any schema change, regenerate types: `supabase gen types typescript --project-id qawrdgttfpslyelocfmx > packages/db/src/types.ts` (or the MCP equivalent). `@tradevantage/db` re-exports `Database` — both apps type-check against it.
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

## Gotchas

- Shared packages (`@tradevantage/shared`, `@tradevantage/db`) ship raw `.ts` from `src/`. `apps/web/next.config.js` lists them in `transpilePackages` and sets `experimental.outputFileTracingRoot` to the monorepo root — both are required for Vercel builds. Don't remove.
- Worker runs the Telegram bot via long-polling. If scaling to multiple replicas, switch to webhook mode (see `DEPLOY.md` §10) — do not run two long-pollers against one bot token.
- `vercel.json` at repo root and `apps/web/vercel.json` are both present as fallbacks for different Vercel "Root Directory" settings. Keep them in sync if you change the build command.
