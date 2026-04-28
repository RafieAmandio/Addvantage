# TradeVantage Restructure Plan

## Context

The current codebase mixes API routes, server actions, and pages all inside Next.js — making it hard to understand what's backend vs frontend. The goal: **Express for all backend logic** (feature-based architecture following Revalue patterns), **Next.js for pages + UI only**, and **Prisma instead of raw Supabase queries**.

The current UI/interface is good — it gets **migrated** as-is, not rewritten. Only the data-fetching layer changes (Supabase queries → Express API calls). All components, pages, hooks, and styling stay intact.

Architecture style: feature modules with `routes/controller/service/repository/validation/types`, typed error classes, global error middleware, Zod validation, repository pattern for Prisma isolation.

---

## Target Monorepo Structure

```
apps/
  web/          # Next.js 14 — pages + UI only, fetches from Express API
  api/          # NEW — Express server on :3100, feature-based
  worker/       # unchanged initially (Phase 13 migrates to Prisma)
packages/
  db/           # Prisma schema + client (replaces Supabase types)
  shared/       # Zod schemas, constants, shared response types
archive/
  web-legacy/   # Snapshot of old apps/web API routes + server actions (git-tagged)
```

---

## Archive Strategy

Before starting migration, preserve the old architecture:

1. **Git tag** the current state: `git tag v0-pre-restructure`
2. After Phase 10 cleanup, move deleted files to `archive/web-legacy/` with this structure:
   ```
   archive/web-legacy/
     api/                    # All 7 old API route handlers
     actions/                # All 6 server action files
     queries/                # All 11 query files
     lib-server/             # server.ts, admin.ts, redis.ts, openai.ts, ratelimit*.ts, payment/, email/
     README.md               # "Archived from pre-restructure. See git tag v0-pre-restructure"
   ```
3. The archive exists for reference only — never imported by live code.

---

## Express Backend (`apps/api/src/`)

### Full Layout

```
apps/api/
  package.json
  tsconfig.json
  vitest.config.ts
  .env.example
  src/
    server.ts                           # Entry point: create HTTP server, listen on API_PORT
    app.ts                              # Express setup: helmet, cors, json, mount middleware + routes
    routes.ts                           # Single file mounting all feature routers

    config/
      env.ts                            # Zod-validated env vars (fail-fast on boot)
      database.ts                       # Re-export Prisma client from @tradevantage/db
      redis.ts                          # Upstash Redis singleton (null if env missing)
      logger.ts                         # Pino structured logger with request-id context

    core/
      middleware/
        auth.middleware.ts              # Supabase JWT verification → req.user (optional for public routes)
        admin.middleware.ts             # requireAdmin: queries profiles.is_admin via repository
        rate-limit.middleware.ts        # Factories: ipRateLimit(), userRateLimit(), tierRateLimit(), adminRateLimit()
        validate.middleware.ts          # validate(schema) — runs Zod on req.body/query/params
        request-id.middleware.ts        # Generates/propagates x-request-id, attaches to req + logger
        error.middleware.ts             # Global error handler: AppError → status+json, unknown → 500
      errors/
        app-error.ts                    # Base class: AppError(message, statusCode, errors[])
        not-found.ts                    # 404
        conflict.ts                     # 409
        forbidden.ts                    # 403
        unauthorized.ts                 # 401
        validation.ts                   # 400
      utils/
        response.ts                     # sendSuccess(res, data), sendPaginatedSuccess(res, {data, meta})
        pagination.ts                   # parsePagination(query) → {page, limit, skip}
        async-handler.ts                # Wraps controller fn to catch async errors → next(err)
      types/
        response.ts                     # ApiResponse<T> = { message: string, content: T, errors?: [] }
        request.ts                      # AuthRequest (req.user), AdminRequest, PaginationQuery

    features/
      auth/
      user/
      news/
      plan/
      consult/
      chart/
      calendar/
      timeline/
      education/
      tag/
      search/
      source/
      health/

    integrations/
      openai/                           # OpenAI client + types
      payment/                          # Provider-agnostic payment (Xendit, Stripe, etc.)
        types.ts                        # PaymentProvider interface + PaymentEvent
        index.ts                        # Factory: getPaymentProvider()
        providers/xendit/               # Xendit implementation
        providers/stripe/               # Future
      email/                            # Provider-agnostic email (Brevo, Resend, etc.)
        types.ts                        # EmailProvider interface
        index.ts                        # Factory: getEmailProvider()
        providers/brevo/                # Brevo implementation
```

### Feature Module Template

Every feature follows this exact structure:

```
features/[name]/
  [name].routes.ts              # Router definition, middleware wiring
  [name].controller.ts          # Parse input → call service → send response
  [name].service.ts             # Business logic, throws typed errors
  [name].repository.ts          # Prisma queries ONLY (no business logic)
  [name].validation.ts          # Zod schemas for request body/params/query
  [name].types.ts               # DTOs, response shapes
  __tests__/
    [name].service.test.ts      # Unit: mock repository, test logic
    [name].integration.test.ts  # Integration: supertest against real app
```

---

## Detailed Phase Breakdown

---

### Phase 0: Express Boilerplate + Core Infrastructure

**Goal:** Express server running on :3100 with health check, all core middleware, typed errors, and response utilities. No features yet — just the skeleton.

**Files to create:**

| File | What it does | Source / reference |
|------|-------------|-------------------|
| `apps/api/package.json` | Package with express, cors, helmet, zod, pino, @supabase/supabase-js, @upstash/ratelimit, @upstash/redis, vitest, supertest | New |
| `apps/api/tsconfig.json` | TypeScript config extending root, paths for @tradevantage/* | Copy pattern from `apps/worker/tsconfig.json` |
| `apps/api/vitest.config.ts` | Vitest config for unit + integration tests | New |
| `apps/api/.env.example` | All required/optional env vars documented | New |
| `src/server.ts` | `http.createServer(app).listen(API_PORT)`, graceful shutdown | Pattern from `apps/worker/src/index.ts` lines 1-40 |
| `src/app.ts` | `helmet()`, `cors({origin: CORS_ORIGIN})`, `express.json()`, mount middleware stack, mount routes, mount error handler | New |
| `src/routes.ts` | `mountRoutes(app)` — starts with just health | New |
| `src/config/env.ts` | Zod schema validating all env vars at boot | Pattern from `apps/worker/src/lib/config.ts` |
| `src/config/database.ts` | Re-export `prisma` from `@tradevantage/db` | New (depends on Phase 1) |
| `src/config/redis.ts` | Upstash Redis singleton, null if env missing | Migrate from `apps/web/lib/redis.ts` |
| `src/config/logger.ts` | Pino logger with request-id context | New |
| `src/core/middleware/auth.middleware.ts` | Extract Bearer token, verify via `supabase.auth.getUser()`, set `req.user` | Migrate auth logic from `apps/web/lib/auth/session.ts` |
| `src/core/middleware/admin.middleware.ts` | Check `profiles.is_admin` for req.user | Migrate from `apps/web/lib/auth/session.ts:requireAdmin()` |
| `src/core/middleware/rate-limit.middleware.ts` | 4 factory functions: ip, user, tier, admin | Migrate from `apps/web/lib/ratelimit.ts`, `ratelimit-tier.ts`, `ip-ratelimit.ts`, `user-ratelimit.ts`, `admin-ratelimit.ts` |
| `src/core/middleware/validate.middleware.ts` | `validate(schema)` middleware that runs Zod on body/query/params | New |
| `src/core/middleware/request-id.middleware.ts` | Generate UUID, set `req.id`, add to response header | New |
| `src/core/middleware/error.middleware.ts` | Catch `AppError` subclasses → structured JSON, unknown → 500 + log | New |
| `src/core/errors/*.ts` | `AppError`, `NotFoundError`, `ConflictError`, `ForbiddenError`, `UnauthorizedError`, `ValidationError` | New |
| `src/core/utils/response.ts` | `sendSuccess(res, data)`, `sendPaginatedSuccess(res, {data, page, limit, total})` | New |
| `src/core/utils/pagination.ts` | `parsePagination(query)` → `{page, limit, skip}` | New |
| `src/core/utils/async-handler.ts` | Wraps `async (req, res) => ...` to forward errors to `next()` | New |
| `src/core/types/response.ts` | `ApiResponse<T>` type | New |
| `src/core/types/request.ts` | `AuthRequest`, `AdminRequest` extending Express Request | New |
| `src/features/health/health.routes.ts` | `GET /health` → check Prisma connection | Migrate from `apps/web/app/api/health/route.ts` |
| `src/features/health/health.controller.ts` | Return `{ status: "ok", uptime }` | Migrate from same |

**Monorepo wiring:**
- Add `"dev:api": "pnpm --filter @tradevantage/api dev"` to root `package.json`
- Add `apps/api` tasks to `turbo.json` (build, dev, typecheck, test)
- Add `API_PORT`, `DATABASE_URL`, `CORS_ORIGIN` to `turbo.json` `globalEnv`

**Verify:** `pnpm dev:api` starts, `curl localhost:3100/health` returns 200.

**Est: 1-2 days**

---

### Phase 1: Prisma Schema + Client

**Goal:** `packages/db` exports a working Prisma client alongside the existing Supabase types (worker still needs them).

**Steps:**

1. **Get connection string:** Supabase Dashboard → Settings → Database → Connection string (Transaction mode for Prisma)
2. **Install Prisma:** `pnpm --filter @tradevantage/db add prisma @prisma/client`
3. **Introspect:** `cd packages/db && npx prisma db pull` → generates `prisma/schema.prisma`
4. **Clean up schema:**
   - Rename models to PascalCase: `profiles` → `Profile @@map("profiles")`
   - Add proper relations (Profile ↔ ConsultSession, Source ↔ NewsItem, etc.)
   - Map column names: `source_code` → `sourceCode @map("source_code")`
   - Add enums where DB uses check constraints (news status, plan direction, plan outcome, impact, bias, tier, timeline event kind, bar interval)
5. **Baseline migration:** `npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/0000_baseline/migration.sql`
6. **Mark as applied:** `npx prisma migrate resolve --applied 0000_baseline`
7. **Generate client:** `npx prisma generate`
8. **Export singleton:**
   ```ts
   // packages/db/src/prisma.ts
   import { PrismaClient } from "@prisma/client";
   const g = globalThis as unknown as { prisma: PrismaClient };
   export const prisma = g.prisma || new PrismaClient();
   if (process.env.NODE_ENV !== "production") g.prisma = prisma;
   export * from "@prisma/client";
   ```
9. **Keep old exports:** `src/index.ts` still exports `Database` type for worker compat
10. **Update `package.json`:** Add `"generate": "prisma generate"` script, `"postinstall": "prisma generate"`

**Tables to map (13):**

| Prisma Model | DB Table | Primary Key | Key Relations |
|---|---|---|---|
| `Profile` | `profiles` | `id (uuid)` | → ConsultSession[], TradingPlan[], EmailLog[], TimelineEvent[] |
| `Source` | `sources` | `code (string)` | → NewsItem[], IngestionRun[] |
| `NewsItem` | `news_items` | `id (uuid)` | → Source, unique(sourceCode, contentHash) |
| `IngestionRun` | `ingestion_runs` | `id (uuid)` | → Source |
| `TelegramAdmin` | `telegram_admins` | `tgUserId (bigint)` | → Profile |
| `InstrumentBar` | `instrument_bars` | composite(symbol, interval, ts) | — |
| `TimelineEvent` | `timeline_events` | `id (uuid)` | → NewsItem?, → Profile? |
| `TradingPlan` | `trading_plans` | `id (uuid)` | → Profile (author) |
| `ConsultSession` | `consult_sessions` | `id (uuid)` | → Profile, → ConsultMessage[] |
| `ConsultMessage` | `consult_messages` | `id (uuid)` | → ConsultSession |
| `EducationPrimer` | `education_primers` | `id (uuid)` | — |
| `EmailLog` | `email_log` | `id (uuid)` | → Profile |

**Verify:** `npx prisma studio` opens and shows all tables with data. Import `prisma` in `apps/api` and query `prisma.source.findMany()` in health check.

**Est: 1-2 days**

---

### Phase 2: Simple Read-Only Features (health, source, tag, search)

**Goal:** Validate the full feature pattern with 4 simple read-only features. Each one exercises: routes → controller → service → repository → Prisma.

#### Feature: `source`

| File | Migrates from |
|------|--------------|
| `source.routes.ts` | — (new route, was query-only) |
| `source.controller.ts` | — |
| `source.service.ts` | — |
| `source.repository.ts` | `apps/web/features/sources/queries/sources.ts:listSources()` |
| `source.types.ts` | — |

**Endpoints:**
- `GET /sources` → public, returns all sources with health status

**Repository migration:**
```
OLD: supabase.from("sources").select("code,name,url,enabled,poll_minutes,last_polled_at,last_success_at,last_error").order("code")
NEW: prisma.source.findMany({ orderBy: { code: "asc" }, select: { code, name, url, enabled, pollMinutes, lastPolledAt, lastSuccessAt, lastError } })
```

#### Feature: `tag`

| File | Migrates from |
|------|--------------|
| `tag.routes.ts` | `apps/web/app/api/tags/counts/route.ts` |
| `tag.controller.ts` | Same route handler logic |
| `tag.service.ts` | `apps/web/features/tags/queries.ts:getTagCounts()` |
| `tag.repository.ts` | Same file: raw queries for tag aggregation |
| `tag.types.ts` | — |

**Endpoints:**
- `GET /tags/counts` → public, returns `[{tag, newsCount, primerCount, total}]`
- `GET /tags/:tag/news` → public, returns news items with that tag

**Repository migration:**
```
OLD: supabase.from("news_items").select("tags").eq("status","approved") + in-memory aggregation
NEW: prisma.newsItem.findMany({ where: { status: "approved" }, select: { tags: true } }) + same aggregation
```

#### Feature: `search`

| File | Migrates from |
|------|--------------|
| `search.routes.ts` | `apps/web/app/api/search/route.ts` |
| `search.controller.ts` | Same route handler |
| `search.service.ts` | — |
| `search.repository.ts` | Inline Supabase query from the route handler |
| `search.validation.ts` | Query param validation (q, limit) |
| `search.types.ts` | — |

**Endpoints:**
- `GET /search?q=term&limit=20` → public, IP rate-limited (30/60s)

**Repository migration:**
```
OLD: supabase.from("news_items").select(...).eq("status","approved").or(`headline.ilike.%${q}%,analysis.ilike.%${q}%,author.ilike.%${q}%`)
NEW: prisma.newsItem.findMany({ where: { status: "approved", OR: [{ headline: { contains: q, mode: "insensitive" } }, ...] } })
```

**Middleware wiring for search:**
```ts
router.get("/", ipRateLimit({ limit: 30, windowSec: 60 }), validate(searchQuerySchema), searchController.search);
```

**Verify per feature:** Write one integration test with supertest. `pnpm test --filter @tradevantage/api`.

**Est: 1-2 days**

---

### Phase 3: Feature — News

**Goal:** Full news feature: public reads, admin review workflow.

| File | Migrates from |
|------|--------------|
| `news.routes.ts` | — |
| `news.controller.ts` | — |
| `news.service.ts` | Business logic from route handlers + actions |
| `news.repository.ts` | `apps/web/features/news/queries/news.ts` (5 query functions) |
| `news.validation.ts` | Schemas from `apps/web/app/admin/review/[id]/actions.ts` + `review/new/actions.ts` |
| `news.types.ts` | `apps/web/features/news/types.ts` |

**Endpoints:**

| Method | Path | Auth | Migrates from |
|--------|------|------|---------------|
| `GET` | `/news` | Public | `listApprovedNews()` — 200 limit, ordered by published_at |
| `GET` | `/news/:id` | Public | `getApprovedNewsById(id)` — only if status=approved |
| `GET` | `/news/admin/pending` | Admin | `listPendingNews()` — ordered by fetched_at ASC |
| `GET` | `/news/admin/rejected` | Admin | `listRejectedNews()` — ordered by reviewed_at DESC |
| `GET` | `/news/admin/:id` | Admin | `getNewsItemById(id)` — full detail with AI audit columns |
| `POST` | `/news` | Admin | `createNewsItem(formData)` from `review/new/actions.ts` |
| `PUT` | `/news/:id/draft` | Admin | `saveDraft(id, formData)` from `review/[id]/actions.ts` |
| `PUT` | `/news/:id/approve` | Admin | `approveItem(id)` |
| `PUT` | `/news/:id/reject` | Admin | `rejectItem(id)` |

**Repository functions:**
```ts
newsRepository = {
  findApproved(opts: PaginationOpts)         // → listApprovedNews
  findApprovedById(id: string)               // → getApprovedNewsById  
  findPending(opts: PaginationOpts)          // → listPendingNews
  findRejected(opts: PaginationOpts)         // → listRejectedNews
  findById(id: string)                       // → getNewsItemById (admin, all columns)
  create(data: NewsItemCreate)               // → createNewsItem
  update(id: string, data: NewsItemUpdate)   // → saveDraft
  approve(id: string, reviewerId: string)    // → approveItem
  reject(id: string, reviewerId: string)     // → rejectItem
}
```

**Key business logic to preserve:**
- `content_hash` computation on create: `contentHash([sourceCode, externalId, rawText])` — import from `@tradevantage/shared` or `packages/shared`
- Approve sets `status='approved'`, `reviewed_by`, `reviewed_at`, `published_at`
- Reject sets `status='rejected'`, `reviewed_by`, `reviewed_at`, `published_at=null`
- Admin rate limiting on all write endpoints (30/60s)

**Tests:**
- `news.service.test.ts`: Mock repository, test approve/reject state transitions, test content hash
- `news.integration.test.ts`: GET /news returns only approved, admin endpoints require auth, full approve lifecycle

**Est: 2 days**

---

### Phase 4: Feature — Plan

**Goal:** Full CRUD for trading plans + stats + news correlation.

| File | Migrates from |
|------|--------------|
| `plan.repository.ts` | `features/plan/queries/plans.ts` (4 fns) + `queries/stats.ts` + `queries/news.ts` |
| `plan.service.ts` | `features/plan/actions.ts` (5 mutations) |
| `plan.validation.ts` | Validation from actions (direction, entry/stop/target, setups JSON, outcome) |

**Endpoints:**

| Method | Path | Auth | Migrates from |
|--------|------|------|---------------|
| `GET` | `/plans` | Public | `listPublishedPlans({limit, symbol})` |
| `GET` | `/plans/:id` | Public | `getPlanById(id)` — published only for non-admin |
| `GET` | `/plans/:id/news` | Public | `getNewsForPlan(planId)` |
| `GET` | `/plans/stats` | Public | `getClosedPlanStats()` |
| `GET` | `/plans/admin` | Admin | `listAllPlansForAdmin()` |
| `GET` | `/plans/admin/drafts` | Admin | `listMyDraftPlans()` |
| `POST` | `/plans` | Admin | `createPlan(formData)` |
| `PUT` | `/plans/:id` | Admin | `updatePlan(id, formData)` |
| `PUT` | `/plans/:id/publish` | Admin | `publishPlan(id)` |
| `PUT` | `/plans/:id/close` | Admin | `closePlan(id, formData)` |
| `DELETE` | `/plans/:id` | Admin | `deletePlan(id)` |

**Key business logic:**
- `realized_r` computed server-side on close: `(closePrice - entry) / (entry - stop)` adjusted for direction
- `setups` is JSONB: `[{label, active}]`
- Status transitions: `draft → published → closed`

**Est: 2 days**

---

### Phase 5: Feature — Consult

**Goal:** Sessions CRUD + messages + SSE streaming. Most complex feature.

| File | Migrates from |
|------|--------------|
| `consult.repository.ts` | `features/consult/queries/messages.ts` (2 fns) + `queries/usage.ts` (1 fn) |
| `consult.service.ts` | `features/consult/actions.ts` (5 fns) + `features/consult/lib/send-message.ts` |
| `consult.controller.ts` | `app/api/consult/stream/route.ts` (SSE streaming) |

**Endpoints:**

| Method | Path | Auth | Migrates from |
|--------|------|------|---------------|
| `GET` | `/consult/sessions` | User | `listConsultSessions(limit)` |
| `POST` | `/consult/sessions` | User | `createConsultSession(title)` |
| `PUT` | `/consult/sessions/:id` | User | `renameConsultSession(id, title)` |
| `DELETE` | `/consult/sessions/:id` | User | `deleteConsultSession(id)` |
| `GET` | `/consult/sessions/:id/messages` | User | `listConsultMessages(sessionId)` |
| `POST` | `/consult/sessions/:id/messages` | User | `appendConsultMessage(...)` |
| `POST` | `/consult/stream` | User | `app/api/consult/stream/route.ts` — SSE |

**SSE streaming in Express:**
```ts
// consult.controller.ts
export const stream = asyncHandler(async (req: AuthRequest, res: Response) => {
  // ... validate, rate limit, check token cap ...
  
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const completion = await openai.chat.completions.create({ stream: true, ... });
  let fullText = "";
  for await (const chunk of completion) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) {
      fullText += delta;
      res.write(delta);
    }
  }
  // Persist after stream completes
  await consultRepository.createMessage({ sessionId, role: "assistant", content: fullText, metadata });
  res.end();
});
```

**Key business logic:**
- Session ownership: `user_id = req.user.id` enforced in repository WHERE clauses
- Tier-based rate limiting: free (5/60s), vip (30/60s)
- Daily token cap: free tier limited to 10k tokens/day via RPC `get_consult_daily_tokens_used`
- Canned reply fallback: if OpenAI unavailable, return random canned reply from `consult/lib/replies.ts`

**Integration dependency:** `integrations/openai/` (Phase 0 creates stub, this phase wires it)

**Est: 2 days**

---

### Phase 6: Features — Chart + Calendar + Timeline

**Goal:** Three related features dealing with market data and events.

#### Feature: `chart`

| Method | Path | Auth | Migrates from |
|--------|------|------|---------------|
| `GET` | `/bars` | User (tier-gated) | `app/api/bars/route.ts` + `features/chart/queries/bars.ts` |

**Rate limiting:** Free (30/60s), VIP (120/60s), IP fallback (30/60s)
**Caching:** Redis 60s TTL on bars responses

#### Feature: `calendar`

| Method | Path | Auth | Migrates from |
|--------|------|------|---------------|
| `GET` | `/events` | User (tier-gated) | `app/api/events/route.ts` |
| `GET` | `/events/:id/correlation` | User | `features/calendar/queries/correlation.ts:listNewsForEvent()` |

**Rate limiting:** Free (60/60s), VIP (240/60s)

#### Feature: `timeline`

| Method | Path | Auth | Migrates from |
|--------|------|------|---------------|
| `GET` | `/timeline` | Public | `features/timeline/queries/timeline.ts:listTimelineEvents()` |
| `GET` | `/timeline/:id` | Public | `getTimelineEventById()` |
| `POST` | `/timeline/pin` | User | `features/timeline/actions.ts:createUserPin()` |

**Est: 2 days**

---

### Phase 7: Features — User + Auth

**Goal:** User profile management + auth helper endpoints.

#### Feature: `user`

| Method | Path | Auth | Migrates from |
|--------|------|------|---------------|
| `GET` | `/users/me` | User | `lib/auth/session.ts:getProfile()` |
| `PUT` | `/users/profile` | User | `features/auth/actions.ts:saveTraderProfile()` |

#### Feature: `auth`

| Method | Path | Auth | Migrates from |
|--------|------|------|---------------|
| `POST` | `/auth/logout` | User | `features/auth/actions.ts:logoutAction()` |

**Note:** Login/signup OTP stays client-side (`supabase.auth.signInWithOtp()` from browser). The `/auth/callback` route stays in Next.js (cookie exchange).

**Est: 1 day**

---

### Phase 8: Feature — Education

| Method | Path | Auth | Migrates from |
|--------|------|------|---------------|
| `GET` | `/education` | Public | `features/education/queries/primers.ts:listPublishedPrimers()` |
| `GET` | `/education/:id` | Public | Same file, by id/slug |

**Est: 0.5 day**

---

### Phase 9: Integrations — Payment (Provider-Agnostic) + Email

**Goal:** Move payment and email to Express behind **provider-agnostic interfaces**. Today it's Xendit + Brevo — tomorrow it could be Stripe + Resend. The feature code never knows which provider is active.

#### Payment abstraction

```
integrations/payment/
  types.ts                      # PaymentEvent, PaymentProvider interface
  index.ts                      # getPaymentProvider() → reads PAYMENT_PROVIDER env
  providers/
    xendit/
      provider.ts               # implements PaymentProvider
      verify.ts                 # x-callback-token verification
      types.ts                  # Xendit-specific webhook shapes
    stripe/                     # future — same interface
      provider.ts
      verify.ts
      types.ts
```

**`types.ts` — the contract:**
```ts
export type PaymentEventKind = "checkout_completed" | "payment_failed" | "subscription_cancelled" | "subscription_renewed";

export interface PaymentEvent {
  kind: PaymentEventKind;
  profileId: string;
  tier: string;
  externalId: string;
  raw: unknown;
}

export interface PaymentProvider {
  name: string;
  verifyWebhook(req: Request): Promise<{ valid: true; event: PaymentEvent } | { valid: false; reason: string }>;
}
```

**`index.ts` — factory:**
```ts
import { XenditProvider } from "./providers/xendit/provider";
// import { StripeProvider } from "./providers/stripe/provider"; // future

export function getPaymentProvider(): PaymentProvider {
  const name = env.PAYMENT_PROVIDER; // "xendit" | "stripe"
  switch (name) {
    case "xendit": return new XenditProvider();
    // case "stripe": return new StripeProvider();
    default: throw new Error(`Unknown payment provider: ${name}`);
  }
}
```

**Feature code uses the abstraction:**
```ts
// features/subscription/subscription.service.ts
const provider = getPaymentProvider();
const result = await provider.verifyWebhook(req);
if (!result.valid) throw new UnauthorizedError(result.reason);
await subscriptionRepository.updateTier(result.event.profileId, result.event.tier);
```

**Webhook route:**

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| `POST` | `/webhooks/payment` | Provider token | Provider-agnostic route, delegates to active provider |

**Migrates from:** `apps/web/app/api/webhooks/xendit/route.ts` + `apps/web/lib/payment/verify-xendit.ts`

**New feature: `subscription`** — the tier-update logic deserves its own feature module:
```
features/subscription/
  subscription.routes.ts        # POST /webhooks/payment
  subscription.controller.ts
  subscription.service.ts       # Verify webhook → update tier → send emails
  subscription.repository.ts    # Profile tier updates, email_log inserts
  subscription.types.ts
  __tests__/
```

#### Email abstraction

Same pattern:
```
integrations/email/
  types.ts                      # EmailProvider interface, SendTemplateOpts
  index.ts                      # getEmailProvider() → reads EMAIL_PROVIDER env
  providers/
    brevo/
      provider.ts               # implements EmailProvider
      client.ts                 # Brevo API HTTP calls
      types.ts
    resend/                     # future
      provider.ts
      client.ts
```

**`types.ts`:**
```ts
export interface SendTemplateOpts {
  to: string;
  templateId: string;
  params?: Record<string, string>;
  subject?: string;
}

export interface EmailProvider {
  name: string;
  sendTemplate(opts: SendTemplateOpts): Promise<{ messageId: string } | null>;
}
```

**Migrates from:** `apps/web/lib/email/brevo.ts`

**New env vars:**
- `PAYMENT_PROVIDER=xendit` (or `stripe` in the future)
- `EMAIL_PROVIDER=brevo` (already exists in worker config)

**After this phase:** Update Xendit webhook URL in dashboard to point to `https://api.tradevantage.io/webhooks/payment`

**Est: 1.5 days**

---

### Phase 10: Frontend Migration — Wire Web to Express API

**Goal:** Replace all Supabase queries and server actions in Next.js with Express API calls. **All UI components stay exactly as they are.**

#### Step 1: Create API client layer

```
apps/web/lib/api/
  client.ts                 # Browser-side: Axios + Bearer token from Supabase session
  client-server.ts          # Server-side: reads token from cookies() for SSR
```

**`client.ts`:**
```ts
import axios from "axios";
import { supabaseBrowser } from "@/lib/supabase/client";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(async (config) => {
  const { data } = await supabaseBrowser().auth.getSession();
  if (data.session?.access_token) {
    config.headers.Authorization = `Bearer ${data.session.access_token}`;
  }
  return config;
});

export { api };
```

#### Step 2: Create per-feature service modules

```
apps/web/services/
  news/
    api.ts                  # getApprovedNews(), getNewsById(), adminApprove(), etc.
    types.ts                # Response types
  plans/
    api.ts
    types.ts
  consult/
    api.ts
    types.ts
  chart/
    api.ts
  calendar/
    api.ts
  timeline/
    api.ts
  education/
    api.ts
  tags/
    api.ts
  search/
    api.ts
  sources/
    api.ts
  user/
    api.ts
```

Each service wraps `api.get()`/`api.post()` calls. Example:
```ts
// services/news/api.ts
import { api } from "@/lib/api/client";
import type { NewsListItem } from "./types";

export const newsApi = {
  listApproved: () => api.get<ApiResponse<NewsListItem[]>>("/news").then(r => r.data.content),
  getById: (id: string) => api.get<ApiResponse<NewsListItem>>(`/news/${id}`).then(r => r.data.content),
  adminApprove: (id: string) => api.put(`/news/${id}/approve`),
  adminReject: (id: string) => api.put(`/news/${id}/reject`),
  // ...
};
```

#### Step 3: Update pages (SSR pages use server client, client pages use browser client)

**SSR pages** — replace `await listApprovedNews()` with `await apiServerFetch("/news")`:
- `app/app/page.tsx` (dashboard) — 3 parallel queries
- `app/app/news/page.tsx` — news list
- `app/app/news/[id]/page.tsx` — news detail
- `app/app/plan/page.tsx` — plan list
- `app/app/plan/[id]/page.tsx` — plan detail
- `app/app/education/page.tsx` — primers
- `app/app/education/[id]/page.tsx` — primer detail
- `app/app/chart/[symbol]/page.tsx` — initial bars
- `app/app/brief/page.tsx` — daily brief
- All `app/admin/*` pages

**Client pages** — replace `useFormState(serverAction)` with `useMutation` or direct fetch:
- `app/app/consult/` — use `consultApi.*`
- `app/app/tags/` — use `tagsApi.getCounts()`
- `app/app/calendar/` — use `calendarApi.*`
- `app/app/watchlist/` — use `timelineApi.*`
- `app/app/subscription/` — stays as-is (Xendit redirect)
- Admin review pages — replace `approveItem`/`rejectItem` actions with `newsApi.adminApprove()`/`newsApi.adminReject()`
- Admin plan pages — replace plan actions with `planApi.*`

#### Step 4: Update `lib/auth/session.ts`

Simplify to:
- `getSession()` → still uses Supabase client for middleware auth checks
- `getProfile()` → calls Express `GET /users/me` instead of querying profiles directly
- `requireAdmin()` → calls `getProfile()` and checks `is_admin`
- Mock mode logic stays as-is

**Est: 3-4 days**

---

### Phase 11: Cleanup + Archive

**Goal:** Remove all dead backend code from web, archive for reference.

**Delete from `apps/web`:**
- `app/api/bars/`, `app/api/consult/`, `app/api/events/`, `app/api/health/`, `app/api/search/`, `app/api/tags/`, `app/api/webhooks/` (keep `app/auth/callback/`)
- `features/auth/actions.ts`, `features/consult/actions.ts`, `features/plan/actions.ts`, `features/timeline/actions.ts`
- `app/admin/review/[id]/actions.ts`, `app/admin/review/new/actions.ts`
- All `features/*/queries/*.ts` files (11 files)
- `lib/supabase/server.ts`, `lib/supabase/admin.ts`
- `lib/openai.ts`, `lib/redis.ts`
- `lib/ratelimit.ts`, `lib/ratelimit-tier.ts`, `lib/ip-ratelimit.ts`, `lib/user-ratelimit.ts`, `lib/admin-ratelimit.ts`
- `lib/payment/`, `lib/email/`

**Remove from `apps/web/package.json`:**
- `openai`, `@upstash/ratelimit`, `@upstash/redis` (if not used elsewhere)

**Simplify `lib/config/server.ts`:**
- Only needs `SENTRY_DSN` (everything else moved to Express)

**Archive:**
- Copy deleted files to `archive/web-legacy/` (organized by category)
- Add `archive/web-legacy/README.md` noting the git tag

**Verify:**
- `pnpm typecheck` passes across entire monorepo
- `pnpm build` succeeds for web
- No imports reference deleted files

**Est: 1 day**

---

### Phase 12: Backend Tests

**Goal:** Unit + integration test coverage for critical business logic.

**Framework setup:**
- `apps/api/vitest.config.ts` — test runner config
- `apps/api/src/test/setup.ts` — test database setup, seed data, cleanup
- `apps/api/src/test/helpers.ts` — `createTestUser()`, `createAdminUser()`, `authHeader(token)` utilities

**Unit tests (mock repository):**

| Test file | What it tests |
|-----------|--------------|
| `news.service.test.ts` | Approve/reject state transitions, content hash computation, only approved visible to public |
| `plan.service.test.ts` | R-multiple calculation, status transitions (draft→published→closed), direction validation |
| `consult.service.test.ts` | Session ownership enforcement, daily token cap, canned reply fallback |
| `user.service.test.ts` | Profile update validation, handle uniqueness |

**Integration tests (supertest + real DB):**

| Test file | What it tests |
|-----------|--------------|
| `auth.integration.test.ts` | Auth middleware rejects invalid tokens, passes valid ones, admin middleware works |
| `news.integration.test.ts` | `GET /news` returns only approved, admin can see pending, full approve lifecycle |
| `plan.integration.test.ts` | Create draft → update → publish → close with realized_r calculation |
| `consult.integration.test.ts` | Create session → add messages → verify ownership isolation |
| `xendit.integration.test.ts` | Valid webhook → tier update, invalid token → 401, missing metadata → 400 |

**Est: 2-3 days**

---

### Phase 13: E2E Tests

**Goal:** Playwright tests covering main user journeys against the full stack.

**Setup:**
- `apps/web/playwright.config.ts` (already exists)
- Test against `localhost:3199` (web) + `localhost:3100` (api)
- Mock mode for auth bypass in test environment

**Test specs:**

| Spec | Journey |
|------|---------|
| `auth.spec.ts` | Visit /login → enter email → (mock mode) redirect to /app → see dashboard |
| `news-browse.spec.ts` | /app/news → see list → click item → detail page with tags/impact/bias |
| `admin-review.spec.ts` | /admin/review → see pending queue → click item → approve → verify appears in /app/news |
| `consult.spec.ts` | /app/consult → create session → send message → see response stream |
| `plan-lifecycle.spec.ts` | /admin/plans/new → create plan → publish → /app/plan shows it → close with outcome |
| `navigation.spec.ts` | Sidebar links work, mobile responsive, keyboard shortcuts |

**Est: 2 days**

---

### Phase 14: Worker Migration to Prisma (Optional / Later)

**Goal:** Replace Supabase client in worker with Prisma for consistency.

**Files to update:**
- `apps/worker/src/pipeline/persist.ts` — insert/upsert news_items via Prisma
- `apps/worker/src/pipeline/runSource.ts` — ingestion_runs CRUD via Prisma
- `apps/worker/src/scheduler/index.ts` — read sources via Prisma
- `apps/worker/src/telegram/notify.ts` — read telegram_admins via Prisma
- `apps/worker/src/adapters/bars/twelvedata.ts` — upsert instrument_bars via Prisma
- `apps/worker/src/adapters/email/brevo.ts` — insert email_log via Prisma
- `apps/worker/src/adapters/payment/xendit.ts` — update profiles via Prisma

**Benefit:** No more RLS bypass via service role key — Prisma has no RLS. Simpler queries, consistent types across all 3 apps.

**Est: 2-3 days**

---

## Scaling & Future Considerations

### Immediate (built into restructure)

| Concern | How it's addressed |
|---------|-------------------|
| **Express horizontal scaling** | Stateless — can run N replicas behind a load balancer (nginx/Caddy) |
| **Connection pooling** | Prisma uses PgBouncer-compatible connection pooling via Supabase's transaction pooler URL |
| **Rate limiting across instances** | Upstash Redis is shared — rate limits are globally consistent |
| **Request tracing** | `x-request-id` middleware enables cross-service log correlation |
| **Error categorization** | Typed errors → dashboards can group by error class, not status code |

### Near-term (after restructure)

| Concern | Recommendation |
|---------|---------------|
| **Worker scheduler duplication** | Add Redis-based distributed lock (`SETNX` with TTL) before each tick. If lock acquired → run; else skip. Enables safe multi-instance workers. |
| **Telegram bot scaling** | Migrate from long-polling to webhook mode. Mount webhook handler in Express (`POST /webhooks/telegram`). Allows multiple worker replicas. |
| **OpenAI concurrency** | Add a request queue with configurable concurrency limit in `integrations/openai/`. Prevents API rate limit violations under load. |
| **Supabase Realtime limits** | Free tier caps at 100 concurrent connections. Upgrade to Pro, or replace with Express SSE channels for timeline events. |
| **Caching layer** | Add Redis caching in Express for frequently-read endpoints (news list, plans, education). 30-60s TTL. Dramatically reduces DB load. |

### Long-term (future milestones)

| Concern | Recommendation |
|---------|---------------|
| **Multi-VPS deployment** | Express API + Worker on separate VPS instances. Load balancer (nginx) in front of API. Worker gets its own dedicated compute. |
| **Database read replicas** | Prisma supports read replicas. Route read queries to replica, writes to primary. Relevant when DB becomes bottleneck. |
| **Job queue** | Replace in-memory `node-cron` with BullMQ + Redis. Enables retries, dead-letter queues, priority, and multi-worker processing. |
| **API versioning** | Mount routes under `/v1/` prefix (`app.use("/v1", routes)`). Enables non-breaking API evolution. |
| **Turbo Remote Cache** | Configure Vercel Remote Cache or self-hosted equivalent. Speeds up CI builds across machines. |
| **Monitoring** | Add Prometheus metrics to Express (request count, latency histogram, error rate). Grafana dashboard for observability. |
| **CDN for static API responses** | News list, education primers, tag counts are cacheable. Put Cloudflare/Vercel Edge Cache in front of Express for these. |

---

## Summary

| Phase | What | Est. Days |
|-------|------|-----------|
| 0 | Express boilerplate + core infrastructure | 1-2 |
| 1 | Prisma schema + client from db pull | 1-2 |
| 2 | Features: health, source, tag, search | 1-2 |
| 3 | Feature: news (full CRUD + admin review) | 2 |
| 4 | Feature: plan (full CRUD + stats) | 2 |
| 5 | Feature: consult (CRUD + SSE stream) | 2 |
| 6 | Features: chart, calendar, timeline | 2 |
| 7 | Features: user, auth | 1 |
| 8 | Feature: education | 0.5 |
| 9 | Integrations: xendit webhook + brevo email | 1 |
| 10 | Frontend: wire all pages to Express API | 3-4 |
| 11 | Cleanup: delete old code, archive | 1 |
| 12 | Backend tests | 2-3 |
| 13 | E2E tests | 2 |
| 14 | (Optional) Worker → Prisma | 2-3 |
| | **Total (without Phase 14)** | **~22-26 days** |
