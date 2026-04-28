# Restructure Progress

Tracking execution of `RESTRUCTURE_PLAN.md`. One phase per tick.

## Phases

- [x] **Phase 0** — Express boilerplate + core infrastructure
- [x] **Phase 1** — Prisma schema + client from db pull
- [x] **Phase 2** — Features: health, source, tag, search
- [x] **Phase 3** — Feature: news (full CRUD + admin review)
- [x] **Phase 4** — Feature: plan (full CRUD + stats)
- [x] **Phase 5** — Feature: consult (CRUD + SSE stream)
- [x] **Phase 6** — Features: chart, calendar, timeline
- [x] **Phase 7** — Features: user, auth
- [x] **Phase 8** — Feature: education
- [x] **Phase 9** — Integrations: payment (provider-agnostic) + email
- [x] **Phase 10** — Frontend: wire all pages to Express API
- [x] **Phase 11** — Cleanup: delete old code, archive
- [x] **Phase 12** — Backend tests
- [x] **Phase 13** — E2E tests
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

### Phase 6 — 2026-04-28

**Created:**

*Chart feature:*
- `src/features/chart/chart.repository.ts` — listBars (Prisma, Decimal→number conversion in service)
- `src/features/chart/chart.service.ts` — default 30-day window, Decimal-to-number mapping, 5000 bar limit
- `src/features/chart/chart.validation.ts` — symbol, interval (1m/5m/1h/1d), from/to dates, limit
- `src/features/chart/chart.controller.ts` — GET with 60s cache header
- `src/features/chart/chart.routes.ts` — optionalAuth + tier rate limit (api:bars)

*Calendar feature:*
- `src/features/calendar/calendar.repository.ts` — listEvents (hasSome for symbols), findEventById, listCorrelatedNews (±2h window)
- `src/features/calendar/calendar.service.ts` — events listing + news correlation logic
- `src/features/calendar/calendar.validation.ts` — comma-separated symbols parsing, from/to/limit
- `src/features/calendar/calendar.controller.ts` — listEvents (private cache) + getCorrelation
- `src/features/calendar/calendar.routes.ts` — optionalAuth + tier rate limit (api:events), auth for correlation

*Timeline feature:*
- `src/features/timeline/timeline.repository.ts` — list (hasSome, kind in, date range), findById, createPin (user_pin + USER source)
- `src/features/timeline/timeline.service.ts` — list, getById, createPin with symbol uppercasing
- `src/features/timeline/timeline.validation.ts` — timelineQuery (symbols, kinds, from/to, limit), createPin (title, body, symbol, occurredAt)
- `src/features/timeline/timeline.controller.ts` — list, getById, createPin
- `src/features/timeline/timeline.routes.ts` — public GET + auth+rate-limit for pin creation

**Endpoints:**
- `GET /bars` — OHLCV bars (tier-gated, 60s cache)
- `GET /events` — timeline events by symbols (tier-gated, private cache)
- `GET /events/:id/correlation` — news correlated with event (±2h window)
- `GET /timeline` — public timeline events (filterable by symbols, kinds, dates)
- `GET /timeline/:id` — single timeline event
- `POST /timeline/pin` — create user pin (auth + rate limit 10/60s)

**Modified:**
- `src/routes.ts` — Mounted chart, calendar, timeline routes

**Migrates from:**
- `apps/web/app/api/bars/route.ts` + `features/chart/queries/bars.ts` → chart feature
- `apps/web/app/api/events/route.ts` → calendar controller
- `apps/web/features/calendar/queries/correlation.ts` → calendar service + repository
- `apps/web/features/timeline/queries/timeline.ts` → timeline repository + service
- `apps/web/features/timeline/actions.ts` → timeline service (createPin)

**Verified:**
- `pnpm typecheck` passes (5/5 packages)

### Phase 7 — 2026-04-28

**Created:**

*User feature:*
- `src/features/user/user.repository.ts` — findById (full profile), findMe (summary), updateProfile
- `src/features/user/user.service.ts` — getMe, updateProfile with existence check
- `src/features/user/user.validation.ts` — updateProfileSchema (handle, tradingLength, longestProfitable, markets, yearlyGoal, faultAttribution)
- `src/features/user/user.controller.ts` — GET /me, PUT /profile
- `src/features/user/user.routes.ts` — auth required, rate limit on profile save (5/60s)

*Auth feature:*
- `src/features/auth/auth.controller.ts` — logout via Supabase admin.signOut(userId)
- `src/features/auth/auth.routes.ts` — POST /logout (auth required)

**Endpoints:**
- `GET /users/me` — authenticated user's profile summary
- `PUT /users/profile` — update trader profile fields (rate limited)
- `POST /auth/logout` — server-side Supabase sign out

**Modified:**
- `src/routes.ts` — Mounted user and auth routes

**Migrates from:**
- `apps/web/lib/auth/session.ts:getProfile()` → user repository + service (getMe)
- `apps/web/features/auth/actions.ts:saveTraderProfile()` → user service (updateProfile)
- `apps/web/features/auth/actions.ts:logoutAction()` → auth controller (logout)

**Notes:**
- Login/signup OTP stays client-side (supabase.auth.signInWithOtp from browser)
- /auth/callback route stays in Next.js (cookie exchange)

**Verified:**
- `pnpm typecheck` passes (5/5 packages)

### Phase 8 — 2026-04-28

**Created:**
- `src/features/education/education.repository.ts` — listPublished (sorted by sortOrder, createdAt), findBySlug, findById
- `src/features/education/education.service.ts` — listPublished (default 100), getByIdOrSlug (UUID detection, published guard)
- `src/features/education/education.controller.ts` — list + getByIdOrSlug
- `src/features/education/education.routes.ts` — public GET / and GET /:id

**Endpoints:**
- `GET /education` — list published primers (sorted, body excluded for list)
- `GET /education/:id` — primer detail by UUID or slug (includes body)

**Modified:**
- `src/routes.ts` — Mounted education routes

**Migrates from:**
- `apps/web/features/education/queries/primers.ts:listPublishedPrimers()` → education repository + service

**Verified:**
- `pnpm typecheck` passes (5/5 packages)

### Phase 9 — 2026-04-28

**Created:**

*Payment integration (provider-agnostic):*
- `src/integrations/payment/types.ts` — PaymentEvent, PaymentProvider interface, VerifyResult
- `src/integrations/payment/index.ts` — getPaymentProvider() factory (reads PAYMENT_PROVIDER env)
- `src/integrations/payment/providers/xendit/types.ts` — InvoiceCallbackSchema (Zod)
- `src/integrations/payment/providers/xendit/provider.ts` — XenditProvider: x-callback-token verification, status mapping

*Email integration (provider-agnostic):*
- `src/integrations/email/types.ts` — EmailProvider interface, SendTemplateOpts, SendResult
- `src/integrations/email/index.ts` — getEmailProvider() factory (reads EMAIL_PROVIDER env)
- `src/integrations/email/providers/brevo/provider.ts` — BrevoProvider: Brevo v3 SMTP API

*Subscription feature:*
- `src/features/subscription/subscription.repository.ts` — updateTier, findProfile, insertEmailLog
- `src/features/subscription/subscription.service.ts` — handleWebhook: verify → tier update or dunning email
- `src/features/subscription/subscription.controller.ts` — POST handler
- `src/features/subscription/subscription.routes.ts` — POST /webhooks/payment with IP rate limit

**Endpoints:**
- `POST /webhooks/payment` — provider-agnostic webhook (currently Xendit, extensible to Stripe)

**Modified:**
- `src/config/env.ts` — Added DUNNING_TEMPLATE_ID
- `src/routes.ts` — Mounted subscription webhook routes

**Migrates from:**
- `apps/web/app/api/webhooks/xendit/route.ts` → subscription controller + service
- `apps/web/lib/payment/verify-xendit.ts` → integrations/payment/providers/xendit/provider.ts
- `apps/web/lib/email/brevo.ts` → integrations/email/providers/brevo/provider.ts

**Verified:**
- `pnpm typecheck` passes (5/5 packages)

### Phase 10 — 2026-04-28

**Created:**
- `apps/web/lib/api/client-server.ts` — Server-side API client (reads Supabase token from cookies, apiGet/apiPost/apiPut/apiDelete/apiStream)
- `apps/web/lib/api/client.ts` — Browser-side API client (reads token from supabaseBrowser session, apiGet/apiPost/apiPut/apiDelete/apiStreamFetch)

**Modified (query files → Express API):**
- `features/news/queries/news.ts` — 5 functions → /news, /news/:id, /news/admin/pending, /news/admin/rejected, /news/admin/:id
- `features/plan/queries/plans.ts` — 4 functions → /plans, /plans/:id, /plans/admin/all, /plans/admin/drafts
- `features/plan/queries/stats.ts` — getClosedPlanStats → /plans/stats
- `features/plan/queries/news.ts` — getNewsForPlan → /plans/:id/news
- `features/education/queries/primers.ts` — listPublishedPrimers → /education
- `features/timeline/queries/timeline.ts` — 2 functions → /timeline, /timeline/:id
- `features/chart/queries/bars.ts` — listBars → /bars
- `features/calendar/queries/correlation.ts` — listNewsForEvent → /events/:id/correlation
- `features/consult/queries/messages.ts` — 2 functions → /consult/sessions, /consult/sessions/:id/messages
- `features/consult/queries/usage.ts` — Simplified to stub (enforcement moved server-side)
- `features/tags/queries.ts` — listNewsByTag → /tags/:tag/news, getTagCounts → /tags/counts
- `features/sources/queries/sources.ts` — listSources → /sources

**Modified (action files → Express API):**
- `features/consult/actions.ts` — 5 actions → /consult/sessions CRUD + /consult/stream
- `features/plan/actions.ts` — 5 actions → /plans CRUD + publish/close
- `features/timeline/actions.ts` — createUserPin → /timeline/pin
- `features/auth/actions.ts` — saveTraderProfile → /users/profile, logoutAction → /auth/logout (OTP stays on Supabase)
- `app/admin/review/[id]/actions.ts` — saveDraft/approve/reject → /news/:id/draft, approve, reject
- `app/admin/review/new/actions.ts` — createNewsItem → POST /news

**Modified (auth/session):**
- `lib/auth/session.ts` — getProfile() → GET /users/me (getSession stays Supabase for cookie-based auth)

**Modified (client-side wiring):**
- `features/consult/hooks/useConsultActions.ts` — Stream → apiStreamFetch (Express /consult/stream)
- `lib/api/client.ts` — apiStreamFetch returns raw Response (caller handles errors)

**Not migrated (by design):**
- `app/admin/logs/page.tsx` — reads ingestion_runs directly from Supabase (no Express endpoint)
- `app/auth/callback/route.ts` — Supabase auth cookie exchange
- `features/timeline/hooks/useTimelineEvents.ts` — Supabase Realtime subscription
- `features/auth/actions.ts` — OTP login/signup stays Supabase Auth
- `app/api/consult/stream/route.ts` — Legacy Next.js SSE route (removed in Phase 11)

**Verified:**
- `pnpm typecheck` passes (5/5 packages)

### Phase 11 — 2026-04-28

**Deleted from `apps/web/`:**

*API routes (7 directories):*
- `app/api/bars/` — superseded by Express GET /bars
- `app/api/consult/` — superseded by Express POST /consult/stream
- `app/api/events/` — superseded by Express GET /events
- `app/api/health/` — superseded by Express GET /health
- `app/api/search/` — superseded by Express GET /search
- `app/api/tags/` — superseded by Express GET /tags/counts
- `app/api/webhooks/` — superseded by Express POST /webhooks/payment

*Lib files (cascade-orphaned after API route deletion):*
- `lib/openai.ts` — OpenAI client (now in Express config/openai.ts)
- `lib/redis.ts` — Redis client (inlined into ratelimit.ts for OTP)
- `lib/cache.ts` — Cache wrapper (unused)
- `lib/ratelimit-tier.ts` — Tier rate limiting (now in Express middleware)
- `lib/ip-ratelimit.ts` — IP rate limiting (now in Express middleware)
- `lib/user-ratelimit.ts` — User rate limiting (now in Express middleware)
- `lib/admin-ratelimit.ts` — Admin rate limiting (now in Express middleware)
- `lib/config/server.ts` — Server env config (now in Express config/env.ts)
- `lib/supabase/admin.ts` — Service-role Supabase client (now in Express)
- `lib/payment/` — Xendit verification (now in Express integrations/payment/)
- `lib/email/` — Brevo integration (now in Express integrations/email/)

*Feature internals:*
- `features/consult/lib/send-message.ts` — Replaced by Express consult.service
- `features/consult/lib/prompt.ts` — Moved to Express consult.lib
- `features/consult/lib/replies.ts` — Moved to Express consult.lib
- `features/consult/queries/usage.ts` — Token cap enforced server-side

**Modified:**
- `lib/ratelimit.ts` — Inlined Redis client (was importing deleted redis.ts)
- `app/app/tags/page.tsx` — Client-side fetch redirected from /api/tags/counts to Express /tags/counts
- `package.json` — Removed `openai` dependency

**Archived to `archive/web-legacy/`:**
- `api/` — All 7 old API route handlers
- `lib-server/` — openai, redis, cache, ratelimit-tier, ip-ratelimit, user-ratelimit, admin-ratelimit, config-server, supabase-admin, payment/, email/
- `consult-lib/` — send-message, prompt, replies, usage

**Retained (by design):**
- `lib/supabase/server.ts` — Auth session cookies, middleware, admin logs, auth callback
- `lib/supabase/client.ts` — Browser Supabase for realtime + API client token
- `lib/ratelimit.ts` — Still needed for OTP rate limiting in auth/actions.ts
- `app/admin/logs/page.tsx` — Reads ingestion_runs from Supabase (no Express endpoint)
- `app/auth/callback/route.ts` — Supabase auth cookie exchange

**Verified:**
- `pnpm typecheck` passes (5/5 packages)
- No stale imports to deleted files
- `pnpm install` succeeds with updated lockfile

### Phase 12 — 2026-04-28

**Infrastructure:**
- `apps/api/vitest.config.ts` — Added `setupFiles: ["src/test/setup.ts"]`
- `apps/api/src/test/setup.ts` — Global mocks: env vars (DATABASE_URL, JWT_SECRET, etc.), logger (silent noop)
- `apps/api/src/test/helpers.ts` — Test utilities: TEST_USER, TEST_ADMIN, mockAuthMiddleware, mockAdminMiddleware

**Test files created (7 files, 56 tests):**

*Core:*
- `src/core/utils/response.test.ts` — 3 tests: sendSuccess format, custom status/message, sendPaginatedSuccess flat paginated shape
- `src/core/middleware/error.middleware.test.ts` — 4 tests (Supertest): NotFoundError→404, ForbiddenError→403, ValidationError→400 with errors array, unknown→500

*Features:*
- `src/features/health/health.test.ts` — 2 tests (Supertest): 200 with ok/app fields, includes uptime_s and ts
- `src/features/news/news.service.test.ts` — 10 tests: getApproved (found/not found), approve (pending/non-pending/missing), reject (pending/already-approved), create (content hash generation/determinism), listApproved (paginated)
- `src/features/plan/plan.service.test.ts` — 15 tests: publish (draft/non-draft/missing), close (long R, negative R, short R, null R entry=stop, null R close=null, non-published rejection), getPublished (published/non-published), getStats (empty/computed with byDirection), remove (exists/missing)
- `src/features/consult/consult.service.test.ts` — 17 tests: listMessages ownership (owner/non-owner/missing), appendMessage ownership (owner/non-owner), renameSession (success/0 rows), deleteSession (success/0 rows), getUserTier (vip/unknown/null), checkDailyTokenCap (under/at/over), streamResponse fallback (canned reply/non-owner)
- `src/features/consult/consult.lib.test.ts` — 5 tests: pickReply (non-empty, keyword matching, fallback round-robin, all indices), FREE_DAILY_TOKEN_CAP value

**Bug fix:**
- `src/core/utils/response.ts` — Fixed response format from `{ message, content }` to `{ success: true, data, message }` matching frontend ApiResponse expectations. Also fixed sendPaginatedSuccess to output flat `{ success, data, total, page, limit, message }`.

**Verified:**
- `pnpm typecheck` passes (5/5 packages)
- `pnpm --filter @tradevantage/api test` — 56 tests pass across 7 files (280ms)

### Phase 13 — 2026-04-28

**Infrastructure:**
- `playwright.config.ts` — Updated: testDir → `./e2e`, added retries for CI, screenshot on failure, expect timeout
- `package.json` — Added `test:e2e` and `test:e2e:ui` scripts at monorepo root

**Test specs created (6 files):**

- `e2e/auth.spec.ts` — 5 tests: login form renders, email input, signup link, auth redirect, dashboard loads in mock mode
- `e2e/news-browse.spec.ts` — 7 tests: news heading, list renders mock items, impact/bias badges, search filtering (null transmission state), filter buttons, click to detail navigation, detail page content
- `e2e/admin-review.spec.ts` — 7 tests: review page loads, heading visible, pending count or empty state, new item page, admin plans/sources/logs pages load
- `e2e/consult.spec.ts` — 3 tests: page loads, session list or empty state, interactive elements present
- `e2e/plan-lifecycle.spec.ts` — 6 tests: plan page loads, latest plan or empty state, stats badges, archive page, admin plan creation page + form fields
- `e2e/navigation.spec.ts` — 14 tests: homepage, sidebar links + navigation, tier badge, all dashboard routes accessible, responsive (mobile viewport for dashboard/news/sidebar/admin)

**Modified:**
- `apps/web/lib/auth/session.ts` — MOCK_PROFILE.is_admin set to `true` so admin pages render in mock mode for E2E testing

**Notes:**
- Tests run in mock mode (NEXT_PUBLIC_MOCK_MODE=1) — auth bypassed, fixture data for news/plans/timeline
- Features requiring Express API (consult sessions, admin CRUD actions) have lighter tests (page load + UI presence)
- Features with mock data (news browse, plan view) have deeper journey tests (filtering, navigation, detail pages)
- Existing `__tests__/integration/navigation.spec.ts` kept as-is (Vitest unit/integration tests, separate from Playwright E2E)

**Verified:**
- `pnpm typecheck` passes (5/5 packages)
- `pnpm --filter @tradevantage/api test` — 56 backend tests still pass
