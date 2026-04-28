# Restructure Progress

Tracking execution of `RESTRUCTURE_PLAN.md`. One phase per tick.

## Phases

- [x] **Phase 0** — Express boilerplate + core infrastructure
- [x] **Phase 1** — Prisma schema + client from db pull
- [ ] **Phase 2** — Features: health, source, tag, search
- [ ] **Phase 3** — Feature: news (full CRUD + admin review)
- [ ] **Phase 4** — Feature: plan (full CRUD + stats)
- [ ] **Phase 5** — Feature: consult (CRUD + SSE stream)
- [ ] **Phase 6** — Features: chart, calendar, timeline
- [ ] **Phase 7** — Features: user, auth
- [ ] **Phase 8** — Feature: education
- [ ] **Phase 9** — Integrations: payment (provider-agnostic) + email
- [ ] **Phase 10** — Frontend: wire all pages to Express API
- [ ] **Phase 11** — Cleanup: delete old code, archive
- [ ] **Phase 12** — Backend tests
- [ ] **Phase 13** — E2E tests
- [ ] **Phase 14** — (Optional) Worker → Prisma

## Log

### Phase 0 — 2026-04-28

**Created:**
- `apps/api/package.json` — Express + deps
- `apps/api/tsconfig.json`, `tsconfig.build.json`
- `apps/api/vitest.config.ts`
- `apps/api/.env.example`
- `src/server.ts` — HTTP server with graceful shutdown
- `src/app.ts` — Express setup (helmet, cors, json, request-id, error handler)
- `src/routes.ts` — Route mounting (health only for now)
- `src/config/env.ts` — Zod-validated env vars, fail-fast on boot
- `src/config/redis.ts` — Upstash singleton, null if env missing
- `src/config/logger.ts` — Pino with pino-pretty in dev
- `src/config/database.ts` — Placeholder for Phase 1 Prisma client
- `src/core/errors/` — AppError, NotFoundError, ConflictError, ForbiddenError, UnauthorizedError, ValidationError
- `src/core/middleware/auth.middleware.ts` — Supabase JWT verification (requireAuth + optionalAuth)
- `src/core/middleware/admin.middleware.ts` — profiles.is_admin check
- `src/core/middleware/rate-limit.middleware.ts` — 4 factories (ip, user, tier, admin)
- `src/core/middleware/validate.middleware.ts` — Zod schema validation on body/query/params
- `src/core/middleware/request-id.middleware.ts` — UUID generation + response header
- `src/core/middleware/error.middleware.ts` — Global error handler (AppError → JSON, unknown → 500)
- `src/core/utils/async-handler.ts` — Wraps async controllers to forward errors
- `src/core/utils/response.ts` — sendSuccess, sendPaginatedSuccess
- `src/core/utils/pagination.ts` — parsePagination
- `src/core/types/response.ts` — ApiResponse<T>, PaginatedResponse<T>
- `src/core/types/request.ts` — AuthRequest, AdminRequest, OptionalAuthRequest
- `src/features/health/health.routes.ts` + `health.controller.ts` — GET /health

**Monorepo wiring:**
- Added `dev:api` script to root package.json
- Added `API_PORT`, `DATABASE_URL`, `CORS_ORIGIN`, `PAYMENT_PROVIDER`, `NEXT_PUBLIC_API_URL` to turbo.json globalEnv

**Verified:**
- `pnpm typecheck` passes
- `curl localhost:3100/health` returns JSON with x-request-id header
- Helmet security headers applied
- CORS configured for localhost:3199

### Phase 1 — 2026-04-28

**Created:**
- `packages/db/prisma/schema.prisma` — 12 models, PascalCase with @@map, camelCase fields with @map, full relations and indexes
- `packages/db/src/prisma.ts` — Singleton PrismaClient with globalThis caching (dev hot-reload safe)
- `packages/db/.env` — Placeholder DATABASE_URL for prisma generate

**Modified:**
- `packages/db/package.json` — Added prisma@6.19.3, @prisma/client@6.19.3, @types/node, generate + postinstall scripts, ./prisma export
- `packages/db/src/index.ts` — Re-exports prisma client + PrismaClient type alongside old Supabase types
- `apps/api/src/config/database.ts` — Now imports real Prisma client from @tradevantage/db
- `apps/api/src/config/env.ts` — Added DATABASE_URL (optional) to Zod schema
- `apps/api/.env.example` — Updated DATABASE_URL from comment to placeholder

**Models (12):**
Profile, Source, NewsItem, TelegramAdmin, IngestionRun, InstrumentBar, TimelineEvent, TradingPlan, ConsultSession, ConsultMessage, EducationPrimer, EmailLog

**Deviations:**
- Schema written manually from types.ts + 25 migrations instead of `prisma db pull` (no DATABASE_URL available for introspection)
- Used Prisma 6.19.3 instead of 7.x (Prisma 7 removed `url` from datasource block, requires prisma.config.ts — unnecessary complexity)
- DATABASE_URL is optional in API env schema (Supabase client still used for auth middleware; Prisma connect happens on first query)
- Check constraints (status, impact, bias, tier, direction, outcome, kind, role, interval) stay as DB-level constraints — validation via Zod at service layer

**Verified:**
- `pnpm typecheck` passes (5/5 packages)
- Prisma client instantiates with all 12 models confirmed via tsx script
- Old Supabase type exports preserved for worker compatibility
