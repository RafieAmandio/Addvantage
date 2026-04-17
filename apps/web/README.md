# @tradevantage/web

Next.js 14 App Router frontend for TradeVantage. Public site, paid dashboard at `/app/*`, admin review console at `/admin/*`. Wired to a real Supabase project — see the root [README](../../README.md) and [CLAUDE.md](../../CLAUDE.md) for the canonical architecture.

## Run

From the **monorepo root**, not from this directory:

```bash
pnpm install
pnpm dev:web        # next dev @ :3000
```

`pnpm dev` runs the worker too. See `apps/worker` for the ingestion pipeline + Telegram bot.

## Layout

Feature-based. Per `docs/ROADMAP.md` Section 0:

```
app/                       thin route tree, no business logic
features/<name>/
  components/              feature-specific UI
  hooks/                   feature-specific hooks
  queries/<domain>.ts      Supabase reads, Zod-validated
  mock.ts                  mock data (until wired to real DB)
  types.ts                 feature-local types
components/ui/             true primitives shared across 2+ features
components/layout/         app chrome (Sidebar, TopBar, Shortcuts)
lib/                       cross-cutting utilities (supabase clients, auth, cn, logger, config)
```

Path alias `@/` resolves to `apps/web/`.

## Supabase clients

Three — pick the right one (`lib/supabase/`):

- `server.ts` — Server Components, Server Actions, Route Handlers (reads session cookie)
- `client.ts` — Client Components needing live/realtime data
- `admin.ts` — service-role; bypasses RLS; **server-only**, never import from a client bundle

## Build / check

```bash
pnpm typecheck
pnpm build
pnpm lint
```

All run from the repo root via Turbo.

## Deploy

Vercel, root-directory aware. Build command is `pnpm turbo run build --filter=@tradevantage/web...` (see `vercel.json`). The worker is **not** deployed to Vercel — it lives on a VPS under `infra/docker-compose.yml`.
