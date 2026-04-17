# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repo shape

pnpm + Turborepo monorepo. Node >= 20 (see `.nvmrc`). Two apps and two shared packages:

- `apps/web` — Next.js 14 App Router. Public site, paid dashboard at `/app/*`, admin review console at `/admin/*`.
- `apps/worker` — Long-lived Node service. Runs the hourly ingestion scheduler **and** the grammY Telegram bot in one process.
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
pnpm --filter @tradevantage/worker run:once FRED      # or SC | SPDJI | YRD | RBC

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
3. `apps/worker/src/adapters/*.ts` — one file per source, each implementing `SourceAdapter` from `adapters/base.ts` and registered in `adapters/index.ts`. Returns `Candidate[]`; must **not** pre-summarise.
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

## Worker env contract

`apps/worker/src/lib/config.ts` is the **only** place `process.env` may be read in the worker. It validates at boot and exits on misconfig. The `emptyToUndef` preprocessor treats empty strings in `.env` as unset so a template `.env.example` can ship blank fields. If adding a new env var, extend `EnvSchema` there and list it in `turbo.json` `globalEnv`.

## Web state caveat

`apps/web/lib/state.tsx` (`AppStateProvider`) persists `tier`, `liabilitySigned`, operator name, and sidebar collapse state in `localStorage` — leftover from the mock prototype. Real tier comes from `profiles.tier` via `getProfile()`. Don't treat the localStorage tier as authoritative for gating; it exists for dev convenience on pages that haven't been converted yet.

## Gotchas

- Shared packages (`@tradevantage/shared`, `@tradevantage/db`) ship raw `.ts` from `src/`. `apps/web/next.config.js` lists them in `transpilePackages` and sets `experimental.outputFileTracingRoot` to the monorepo root — both are required for Vercel builds. Don't remove.
- Worker runs the Telegram bot via long-polling. If scaling to multiple replicas, switch to webhook mode (see `DEPLOY.md` §10) — do not run two long-pollers against one bot token.
- `vercel.json` at repo root and `apps/web/vercel.json` are both present as fallbacks for different Vercel "Root Directory" settings. Keep them in sync if you change the build command.
