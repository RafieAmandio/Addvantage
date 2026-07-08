-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "handle" TEXT,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "tier" TEXT NOT NULL DEFAULT 'free',
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "signed_liability" BOOLEAN NOT NULL DEFAULT false,
    "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "renews_at" TIMESTAMPTZ(6),
    "package" TEXT,
    "trading_length" TEXT,
    "longest_profitable" TEXT,
    "markets" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "yearly_goal" TEXT,
    "fault_attribution" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sources" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "adapter" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "poll_minutes" INTEGER NOT NULL DEFAULT 60,
    "last_polled_at" TIMESTAMPTZ(6),
    "last_success_at" TIMESTAMPTZ(6),
    "last_error" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sources_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "news_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "source_code" TEXT NOT NULL,
    "source_url" TEXT,
    "content_hash" TEXT NOT NULL,
    "fetched_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "raw_text" TEXT,
    "headline" TEXT NOT NULL,
    "rephrased" TEXT,
    "analysis" TEXT NOT NULL,
    "impact" TEXT NOT NULL,
    "bias" TEXT NOT NULL,
    "affects" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "related_plan_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "author" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMPTZ(6),
    "published_at" TIMESTAMPTZ(6),
    "ai_system_prompt" TEXT,
    "ai_user_message" TEXT,
    "ai_raw_response" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "news_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "telegram_admins" (
    "tg_user_id" BIGINT NOT NULL,
    "profile_id" UUID,
    "label" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "telegram_admins_pkey" PRIMARY KEY ("tg_user_id")
);

-- CreateTable
CREATE TABLE "ingestion_runs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "source_code" TEXT NOT NULL,
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMPTZ(6),
    "status" TEXT NOT NULL DEFAULT 'running',
    "items_fetched" INTEGER NOT NULL DEFAULT 0,
    "items_new" INTEGER NOT NULL DEFAULT 0,
    "items_rephrased" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,

    CONSTRAINT "ingestion_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instrument_bars" (
    "symbol" TEXT NOT NULL,
    "interval" TEXT NOT NULL,
    "ts" TIMESTAMPTZ(6) NOT NULL,
    "open" DECIMAL,
    "high" DECIMAL,
    "low" DECIMAL,
    "close" DECIMAL,
    "volume" DECIMAL,

    CONSTRAINT "instrument_bars_pkey" PRIMARY KEY ("symbol","interval","ts")
);

-- CreateTable
CREATE TABLE "timeline_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "kind" TEXT NOT NULL,
    "source_code" TEXT,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL,
    "symbols" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "title" TEXT NOT NULL,
    "body" TEXT,
    "url" TEXT,
    "bias" TEXT,
    "impact" TEXT,
    "metadata" JSONB,
    "news_item_id" UUID,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "timeline_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trading_plans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "symbol" TEXT NOT NULL,
    "thesis" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "bias" TEXT NOT NULL DEFAULT 'neutral',
    "entry" DECIMAL,
    "stop" DECIMAL,
    "target" DECIMAL,
    "r_multiple" DECIMAL,
    "setups" JSONB NOT NULL DEFAULT '[]',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "risks" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tier" TEXT NOT NULL DEFAULT 'free',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "outcome" TEXT,
    "author_id" UUID,
    "close_price" DECIMAL,
    "realized_r" DECIMAL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_at" TIMESTAMPTZ(6),
    "closed_at" TIMESTAMPTZ(6),
    "image_url" TEXT,
    "image_key" TEXT,

    CONSTRAINT "trading_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consult_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'New session',
    "status" TEXT NOT NULL DEFAULT 'open',
    "unread_admin" BOOLEAN NOT NULL DEFAULT true,
    "unread_user" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consult_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consult_messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consult_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "education_primers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL DEFAULT 'Anthony',
    "framework" TEXT,
    "summary" TEXT,
    "body" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "reading_min" INTEGER NOT NULL DEFAULT 3,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "education_primers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_modules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT 'analysis',
    "provider" TEXT NOT NULL DEFAULT 'youtube',
    "video_id" TEXT NOT NULL,
    "duration" TEXT NOT NULL DEFAULT '',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "video_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profile_id" UUID NOT NULL,
    "external_id" TEXT,
    "external_ref" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "tier" TEXT NOT NULL,
    "invoice_url" TEXT,
    "description" TEXT,
    "paid_at" TIMESTAMPTZ(6),
    "expired_at" TIMESTAMPTZ(6),
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_log" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profile_id" UUID,
    "kind" TEXT NOT NULL,
    "external_message_id" TEXT,
    "provider" TEXT NOT NULL,
    "template_id" TEXT,
    "sent_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "payload" JSONB,

    CONSTRAINT "email_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rsi_snapshots" (
    "symbol" TEXT NOT NULL,
    "interval" TEXT NOT NULL,
    "rsi" DECIMAL NOT NULL,
    "price" DECIMAL,
    "ts" TIMESTAMPTZ(6) NOT NULL,
    "fetched_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rsi_snapshots_pkey" PRIMARY KEY ("symbol","interval")
);

-- CreateTable
CREATE TABLE "atr_snapshots" (
    "symbol" TEXT NOT NULL,
    "atr" DECIMAL NOT NULL,
    "price" DECIMAL,
    "daily_open" DECIMAL NOT NULL,
    "daily_high" DECIMAL NOT NULL,
    "daily_low" DECIMAL NOT NULL,
    "daily_close" DECIMAL NOT NULL,
    "upper_level" DECIMAL NOT NULL,
    "lower_level" DECIMAL NOT NULL,
    "exhaustion_pct" DECIMAL NOT NULL,
    "direction" TEXT NOT NULL,
    "ts" TIMESTAMPTZ(6) NOT NULL,
    "fetched_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "atr_snapshots_pkey" PRIMARY KEY ("symbol")
);

-- CreateTable
CREATE TABLE "channel_threads" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "channel_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channel_posts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "author" TEXT NOT NULL DEFAULT 'Anthony',
    "body" TEXT NOT NULL,
    "image_url" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "thread_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "channel_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_partners" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tagline" TEXT NOT NULL DEFAULT '',
    "url" TEXT NOT NULL,
    "icon_url" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "polymarket_tracked" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "category" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "event_slug" TEXT NOT NULL,
    "event_title" TEXT NOT NULL,
    "search_query" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "polymarket_tracked_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "polymarket_snapshots" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tracked_id" UUID NOT NULL,
    "outcomes" JSONB NOT NULL DEFAULT '[]',
    "volume" DECIMAL,
    "liquidity" DECIMAL,
    "market_count" INTEGER NOT NULL DEFAULT 0,
    "fetched_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "polymarket_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gap_snapshots" (
    "symbol" TEXT NOT NULL,
    "friday_close" DECIMAL NOT NULL,
    "monday_open" DECIMAL NOT NULL,
    "current_price" DECIMAL,
    "gap_pct" DECIMAL NOT NULL,
    "gap_direction" TEXT NOT NULL,
    "fill_pct" DECIMAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "week_start" DATE NOT NULL,
    "ts" TIMESTAMPTZ(6) NOT NULL,
    "fetched_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gap_snapshots_pkey" PRIMARY KEY ("symbol","week_start")
);

-- CreateTable
CREATE TABLE "token_unlocks" (
    "gecko_id" TEXT NOT NULL,
    "unlock_at" TIMESTAMPTZ(6) NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mcap_rank" INTEGER NOT NULL,
    "tokens" DECIMAL NOT NULL,
    "pct_supply" DECIMAL NOT NULL,
    "usd_value" DECIMAL NOT NULL,
    "price" DECIMAL NOT NULL,
    "circ_supply" DECIMAL NOT NULL,
    "categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "recipients" JSONB NOT NULL DEFAULT '[]',
    "fetched_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "token_unlocks_pkey" PRIMARY KEY ("gecko_id","unlock_at")
);

-- CreateTable
CREATE TABLE "token_unlocks_meta" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "tracked_top200" INTEGER NOT NULL,
    "synced_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "token_unlocks_meta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "upgrade_events" (
    "coindar_id" BIGINT NOT NULL,
    "coin_gecko_id" TEXT,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mcap_rank" INTEGER NOT NULL,
    "caption" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "date_start" TIMESTAMPTZ(6) NOT NULL,
    "date_end" TIMESTAMPTZ(6),
    "date_public" TIMESTAMPTZ(6),
    "source" TEXT,
    "source_reliable" BOOLEAN NOT NULL DEFAULT false,
    "important" BOOLEAN NOT NULL DEFAULT false,
    "fetched_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "upgrade_events_pkey" PRIMARY KEY ("coindar_id")
);

-- CreateTable
CREATE TABLE "upgrade_events_meta" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "tracked_top200" INTEGER NOT NULL,
    "synced_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "upgrade_events_meta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_handle_key" ON "profiles"("handle");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_email_key" ON "profiles"("email");

-- CreateIndex
CREATE INDEX "news_items_status_idx" ON "news_items"("status");

-- CreateIndex
CREATE INDEX "news_items_published_at_idx" ON "news_items"("published_at" DESC);

-- CreateIndex
CREATE INDEX "news_items_source_code_idx" ON "news_items"("source_code");

-- CreateIndex
CREATE INDEX "news_items_affects_gin" ON "news_items" USING GIN ("affects");

-- CreateIndex
CREATE INDEX "news_items_tags_gin" ON "news_items" USING GIN ("tags");

-- CreateIndex
CREATE UNIQUE INDEX "news_items_source_code_content_hash_key" ON "news_items"("source_code", "content_hash");

-- CreateIndex
CREATE INDEX "ingestion_runs_source_idx" ON "ingestion_runs"("source_code", "started_at" DESC);

-- CreateIndex
CREATE INDEX "ingestion_runs_started_idx" ON "ingestion_runs"("started_at" DESC);

-- CreateIndex
CREATE INDEX "timeline_events_news_item_idx" ON "timeline_events"("news_item_id");

-- CreateIndex
CREATE INDEX "timeline_events_occurred_idx" ON "timeline_events"("occurred_at" DESC);

-- CreateIndex
CREATE INDEX "timeline_events_symbols_gin" ON "timeline_events" USING GIN ("symbols");

-- CreateIndex
CREATE INDEX "trading_plans_symbol_idx" ON "trading_plans"("symbol");

-- CreateIndex
CREATE INDEX "trading_plans_author_idx" ON "trading_plans"("author_id");

-- CreateIndex
CREATE INDEX "trading_plans_published_idx" ON "trading_plans"("published_at" DESC);

-- CreateIndex
CREATE INDEX "trading_plans_tags_gin" ON "trading_plans" USING GIN ("tags");

-- CreateIndex
CREATE INDEX "consult_sessions_user_idx" ON "consult_sessions"("user_id", "updated_at" DESC);

-- CreateIndex
CREATE INDEX "consult_sessions_status_idx" ON "consult_sessions"("status", "updated_at" DESC);

-- CreateIndex
CREATE INDEX "consult_messages_session_idx" ON "consult_messages"("session_id", "created_at");

-- CreateIndex
CREATE INDEX "consult_messages_user_idx" ON "consult_messages"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "education_primers_slug_key" ON "education_primers"("slug");

-- CreateIndex
CREATE INDEX "education_primers_pub_idx" ON "education_primers"("published", "sort_order");

-- CreateIndex
CREATE INDEX "education_primers_tags_gin" ON "education_primers" USING GIN ("tags");

-- CreateIndex
CREATE UNIQUE INDEX "video_modules_slug_key" ON "video_modules"("slug");

-- CreateIndex
CREATE INDEX "video_modules_published_sort_idx" ON "video_modules"("published", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "payments_external_ref_key" ON "payments"("external_ref");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "payments_external_id_idx" ON "payments"("external_id");

-- CreateIndex
CREATE INDEX "payments_profile_idx" ON "payments"("profile_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "email_log_profile_idx" ON "email_log"("profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "email_log_profile_id_kind_sent_at_key" ON "email_log"("profile_id", "kind", "sent_at");

-- CreateIndex
CREATE INDEX "rsi_snapshots_interval_idx" ON "rsi_snapshots"("interval");

-- CreateIndex
CREATE UNIQUE INDEX "channel_threads_slug_key" ON "channel_threads"("slug");

-- CreateIndex
CREATE INDEX "channel_threads_sort_order_idx" ON "channel_threads"("sort_order");

-- CreateIndex
CREATE INDEX "channel_posts_created_at_idx" ON "channel_posts"("created_at" DESC);

-- CreateIndex
CREATE INDEX "channel_posts_tags_idx" ON "channel_posts" USING GIN ("tags");

-- CreateIndex
CREATE INDEX "channel_posts_thread_id_idx" ON "channel_posts"("thread_id");

-- CreateIndex
CREATE INDEX "polymarket_tracked_active_sort_order_idx" ON "polymarket_tracked"("active", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "polymarket_tracked_event_id_key" ON "polymarket_tracked"("event_id");

-- CreateIndex
CREATE INDEX "polymarket_snapshots_tracked_id_fetched_at_idx" ON "polymarket_snapshots"("tracked_id", "fetched_at" DESC);

-- CreateIndex
CREATE INDEX "token_unlocks_unlock_at_idx" ON "token_unlocks"("unlock_at");

-- CreateIndex
CREATE INDEX "upgrade_events_date_start_idx" ON "upgrade_events"("date_start");

-- AddForeignKey
ALTER TABLE "news_items" ADD CONSTRAINT "news_items_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "news_items" ADD CONSTRAINT "news_items_source_code_fkey" FOREIGN KEY ("source_code") REFERENCES "sources"("code") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "telegram_admins" ADD CONSTRAINT "telegram_admins_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ingestion_runs" ADD CONSTRAINT "ingestion_runs_source_code_fkey" FOREIGN KEY ("source_code") REFERENCES "sources"("code") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_news_item_id_fkey" FOREIGN KEY ("news_item_id") REFERENCES "news_items"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trading_plans" ADD CONSTRAINT "trading_plans_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "consult_sessions" ADD CONSTRAINT "consult_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "consult_messages" ADD CONSTRAINT "consult_messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "consult_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "consult_messages" ADD CONSTRAINT "consult_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "email_log" ADD CONSTRAINT "email_log_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "channel_posts" ADD CONSTRAINT "channel_posts_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "channel_threads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "polymarket_snapshots" ADD CONSTRAINT "polymarket_snapshots_tracked_id_fkey" FOREIGN KEY ("tracked_id") REFERENCES "polymarket_tracked"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ============================================================================
-- Security layer — RLS, policies, helper functions, triggers, storage.
-- Captured from live prod so a from-scratch rebuild reproduces the security
-- posture. Guarded so it also applies cleanly on a vanilla Postgres shadow DB
-- (CI drift gate) where the Supabase roles / auth.uid() / storage schema are
-- absent. On real Supabase these already exist and the guards are no-ops.
-- ============================================================================

-- Supabase roles (created only on shadow DBs; already present on Supabase).
DO $$ BEGIN CREATE ROLE anon;          EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE authenticated; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE service_role;  EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Stub auth.uid() only if absent (present on Supabase; stubbed on shadow DBs).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'auth' AND p.proname = 'uid'
  ) THEN
    CREATE SCHEMA IF NOT EXISTS auth;
    EXECUTE 'CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $f$ SELECT NULL::uuid $f$';
  END IF;
END $$;

-- is_admin() references auth.uid() (a stub on shadow DBs) — skip body validation.
SET check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.is_admin()
  RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT COALESCE((SELECT is_admin FROM public.profiles WHERE id = (SELECT auth.uid())), false);
$$;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM public, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.is_admin() TO service_role;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
  RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER video_modules_set_updated_at
  BEFORE UPDATE ON public.video_modules
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Enable RLS on every table.
ALTER TABLE public.profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sources             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_items          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_admins     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingestion_runs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instrument_bars     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeline_events     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_plans       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consult_sessions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consult_messages    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_primers   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_log           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_posts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_partners   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rsi_snapshots       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atr_snapshots       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gap_snapshots       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_threads     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polymarket_tracked  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polymarket_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_modules       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_unlocks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_unlocks_meta  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upgrade_events      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upgrade_events_meta ENABLE ROW LEVEL SECURITY;

-- Public-read reference/market-data tables (writes are service-role only).
CREATE POLICY "atr_snapshots: public read"       ON public.atr_snapshots       FOR SELECT USING (true);
CREATE POLICY "gap_snapshots_public_read"        ON public.gap_snapshots       FOR SELECT USING (true);
CREATE POLICY "rsi_snapshots: public read"       ON public.rsi_snapshots       FOR SELECT USING (true);
CREATE POLICY "token_unlocks_public_read"        ON public.token_unlocks       FOR SELECT USING (true);
CREATE POLICY "token_unlocks_meta_public_read"   ON public.token_unlocks_meta  FOR SELECT USING (true);

-- channel_threads: public read, admin manage.
CREATE POLICY "Public read threads"  ON public.channel_threads FOR SELECT USING (true);
CREATE POLICY "Admin manage threads" ON public.channel_threads FOR ALL    USING (public.is_admin());

-- polymarket_tracked: public read, admin write.
CREATE POLICY "polymarket_tracked_public_read"   ON public.polymarket_tracked FOR SELECT USING (true);
CREATE POLICY "polymarket_tracked_admin_insert"  ON public.polymarket_tracked FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "polymarket_tracked_admin_update"  ON public.polymarket_tracked FOR UPDATE USING (public.is_admin());
CREATE POLICY "polymarket_tracked_admin_delete"  ON public.polymarket_tracked FOR DELETE USING (public.is_admin());

-- polymarket_snapshots: public read, admin write.
CREATE POLICY "polymarket_snapshots_public_read"  ON public.polymarket_snapshots FOR SELECT USING (true);
CREATE POLICY "polymarket_snapshots_admin_insert" ON public.polymarket_snapshots FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "polymarket_snapshots_admin_update" ON public.polymarket_snapshots FOR UPDATE USING (public.is_admin());
CREATE POLICY "polymarket_snapshots_admin_delete" ON public.polymarket_snapshots FOR DELETE USING (public.is_admin());

-- video_modules: published rows readable by all; admin writes.
CREATE POLICY "video_modules_read"         ON public.video_modules FOR SELECT TO anon, authenticated USING ((published = true) OR public.is_admin());
CREATE POLICY "video_modules_admin_insert" ON public.video_modules FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "video_modules_admin_update" ON public.video_modules FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "video_modules_admin_delete" ON public.video_modules FOR DELETE TO authenticated USING (public.is_admin());

-- timeline_events: editorial rows public; users see their own pins (realtime feed).
CREATE POLICY "timeline_events_read" ON public.timeline_events FOR SELECT
  USING ((kind <> 'user_pin') OR ((kind = 'user_pin') AND (created_by = (SELECT auth.uid()))));

-- NOTE: the remaining 14 tables (profiles, sources, news_items, telegram_admins,
-- ingestion_runs, instrument_bars, trading_plans, consult_sessions,
-- consult_messages, education_primers, payments, email_log, channel_posts,
-- referral_partners, upgrade_events, upgrade_events_meta) have RLS enabled with
-- NO policy on purpose — they are reached only by the service-role backend.

-- Storage: only run where the Supabase storage schema exists (skipped on shadow).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='storage' AND table_name='objects') THEN
    INSERT INTO storage.buckets (id, name, public) VALUES ('uploads','uploads',true)
      ON CONFLICT (id) DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Service role upload') THEN
      EXECUTE $p$ CREATE POLICY "Service role upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'uploads') $p$;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Service role delete') THEN
      EXECUTE $p$ CREATE POLICY "Service role delete" ON storage.objects FOR DELETE USING (bucket_id = 'uploads') $p$;
    END IF;
  END IF;
END $$;

RESET check_function_bodies;
