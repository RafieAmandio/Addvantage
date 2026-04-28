# Restructure Progress

Tracking execution of `RESTRUCTURE_PLAN.md`. One phase per tick.

## Phases

- [x] **Phase 0** — Express boilerplate + core infrastructure
- [x] **Phase 1** — Prisma schema + client from db pull
- [x] **Phase 2** — Features: health, source, tag, search
- [x] **Phase 3** — Feature: news (full CRUD + admin review)
- [x] **Phase 4** — Feature: plan (full CRUD + stats)
- [x] **Phase 5** — Feature: consult (CRUD + SSE stream)
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

### Phase 2 — 2026-04-28

**Created:**
- `src/features/source/source.repository.ts` — `findAll()` via Prisma
- `src/features/source/source.controller.ts` — GET / list all sources
- `src/features/source/source.routes.ts` — `GET /sources`
- `src/features/tag/tag.repository.ts` — approved news tags, published primer tags, news by tag
- `src/features/tag/tag.service.ts` — tag count aggregation (news + primers against HASHTAGS constant)
- `src/features/tag/tag.controller.ts` — GET /counts, GET /:tag/news
- `src/features/tag/tag.routes.ts` — `GET /tags/counts`, `GET /tags/:tag/news`
- `src/features/search/search.repository.ts` — full-text search on headline/analysis/author
- `src/features/search/search.controller.ts` — validate query, return results
- `src/features/search/search.validation.ts` — Zod schema for q + limit params
- `src/features/search/search.routes.ts` — `GET /search` with IP rate limit (30/60s)

**Modified:**
- `src/features/health/health.controller.ts` — Switched from Supabase to Prisma `$queryRaw`
- `src/routes.ts` — Mounted source, tag, search routes

**Migrates from:**
- `apps/web/app/api/health/route.ts` → health controller (Prisma check)
- `apps/web/features/sources/queries/sources.ts` → source repository
- `apps/web/features/tags/queries.ts` → tag repository + service
- `apps/web/app/api/tags/counts/route.ts` → tag controller (counts)
- `apps/web/app/api/search/route.ts` → search controller + repository

**Verified:**
- `pnpm typecheck` passes (5/5 packages)

### Phase 3 — 2026-04-28

**Created:**
- `src/features/news/news.repository.ts` — findApproved, findApprovedById, findPending, findRejected, findById, create, updateDraft, approve, reject + count queries
- `src/features/news/news.service.ts` — business logic: content hash, status lifecycle (pending → approved/rejected), NotFoundError/ForbiddenError guards
- `src/features/news/news.controller.ts` — 8 endpoints: list/get public + admin pending/rejected/detail + create/draft/approve/reject
- `src/features/news/news.validation.ts` — Zod schemas for create + edit (reuses IMPACT_LEVELS, BIAS_LEVELS, HASHTAGS, SOURCE_CODES from shared)
- `src/features/news/news.routes.ts` — all routes with auth/admin/rate-limit middleware

**Endpoints:**
- `GET /news` — public approved list, paginated
- `GET /news/:id` — public approved detail
- `GET /news/admin/pending` — admin queue (oldest first)
- `GET /news/admin/rejected` — admin rejected (newest first)
- `GET /news/admin/:id` — admin detail with AI audit trail
- `POST /news` — admin create (content hash computed from sourceCode + "manual" + headline)
- `PUT /news/:id/draft` — admin save draft edits
- `PUT /news/:id/approve` — sets status=approved, reviewed_by, reviewed_at, published_at
- `PUT /news/:id/reject` — sets status=rejected, reviewed_by, reviewed_at, published_at=null

**Modified:**
- `src/routes.ts` — Mounted news routes

**Migrates from:**
- `apps/web/features/news/queries/news.ts` → news repository (all 5 query functions)
- `apps/web/app/admin/review/new/actions.ts` → news service create
- `apps/web/app/admin/review/[id]/actions.ts` → news service draft/approve/reject

**Verified:**
- `pnpm typecheck` passes (5/5 packages)

### Phase 4 — 2026-04-28

**Created:**
- `src/features/plan/plan.repository.ts` — findPublished (symbol filter), countPublished, findById, findAllForAdmin, countAll, findMyDrafts, countMyDrafts, findClosedWithR, getNewsForPlan (cross-table on relatedPlanIds), create, update, remove
- `src/features/plan/plan.service.ts` — computeRealizedR (long/short), stats aggregation (win rate, avg R by direction), status lifecycle (draft→published→closed)
- `src/features/plan/plan.validation.ts` — planCreateSchema, planUpdateSchema (partial), planCloseSchema with nullableNumber transform
- `src/features/plan/plan.controller.ts` — 11 endpoints: list/get public + stats + news-for-plan + admin CRUD + publish/close/remove
- `src/features/plan/plan.routes.ts` — public + admin routes with auth/admin/rate-limit middleware

**Endpoints:**
- `GET /plans` — public published list (paginated, optional symbol filter)
- `GET /plans/stats` — win rate, avg R, breakdown by direction (5min cache)
- `GET /plans/:id` — public published detail
- `GET /plans/:id/news` — approved news linked to plan
- `GET /plans/admin/all` — admin list all plans
- `GET /plans/admin/drafts` — admin's own drafts + closed
- `GET /plans/admin/:id` — admin detail
- `POST /plans` — admin create (draft status)
- `PUT /plans/:id` — admin update
- `PUT /plans/:id/publish` — draft → published
- `PUT /plans/:id/close` — published → closed (computes realizedR)
- `DELETE /plans/:id` — admin remove

**Modified:**
- `src/routes.ts` — Mounted plan routes
- `packages/db/src/prisma.ts` — Re-exports `Prisma` namespace from @prisma/client
- `packages/db/src/index.ts` — Re-exports `Prisma` for downstream use

**Migrates from:**
- `apps/web/features/plans/queries/plans.ts` → plan repository
- `apps/web/app/admin/plans/[id]/actions.ts` → plan service create/update/publish/close/delete
- `apps/web/app/api/plans/stats/route.ts` → plan controller getStats

**Verified:**
- `pnpm typecheck` passes (5/5 packages)

### Phase 5 — 2026-04-28

**Created:**
- `src/config/openai.ts` — OpenAI client singleton (lazy init, null if OPENAI_API_KEY unset)
- `src/features/consult/consult.lib.ts` — System prompt, 8 canned replies with keyword matching, FREE_DAILY_TOKEN_CAP
- `src/features/consult/consult.repository.ts` — Prisma queries: sessions CRUD, messages CRUD, daily token usage (raw SQL), profile tier lookup
- `src/features/consult/consult.service.ts` — Session ownership checks, tier resolution, daily token cap enforcement, SSE streaming with OpenAI + canned reply fallback
- `src/features/consult/consult.validation.ts` — Zod schemas: createSession, renameSession, appendMessage, streamBody
- `src/features/consult/consult.controller.ts` — 7 endpoints including SSE stream handler
- `src/features/consult/consult.routes.ts` — All routes with auth + rate limiting (user-based for CRUD, tier-based for stream)

**Endpoints:**
- `GET /consult/sessions` — list user's sessions
- `POST /consult/sessions` — create session
- `PUT /consult/sessions/:id` — rename session
- `DELETE /consult/sessions/:id` — delete session
- `GET /consult/sessions/:id/messages` — list messages (chronological)
- `POST /consult/sessions/:id/messages` — append message
- `POST /consult/stream` — SSE streaming (OpenAI gpt-4o-mini, canned reply fallback, daily token cap for free tier)

**Modified:**
- `src/routes.ts` — Mounted consult routes

**Migrates from:**
- `apps/web/features/consult/queries/messages.ts` → consult repository (listSessions, listMessages)
- `apps/web/features/consult/queries/usage.ts` → consult repository (getDailyTokensUsed)
- `apps/web/features/consult/actions.ts` → consult service (create/rename/delete/append)
- `apps/web/features/consult/lib/send-message.ts` → consult service (streamResponse)
- `apps/web/app/api/consult/stream/route.ts` → consult controller (stream)
- `apps/web/features/consult/lib/replies.ts` → consult.lib (pickReply)
- `apps/web/features/consult/lib/prompt.ts` → consult.lib (DESK_SYSTEM_PROMPT)

**Verified:**
- `pnpm typecheck` passes (5/5 packages)
