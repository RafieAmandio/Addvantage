-- Catch-up migration: schema.prisma gained `short_links` (meet shortlink, 2026-07-13)
-- and a reshaped `upgrade_events` (Coindar -> CoinMarketCap source, 2026-07-09)
-- without migrations, so the migrations history no longer matched the schema.
--
-- Prod most likely has this shape already (both features are live), but that is
-- unverified. Check first, e.g. \d upgrade_events shows event_id as the key.
-- If it matches, do NOT run this on prod. Mark it applied instead:
--   pnpm --filter @tradevantage/db exec prisma migrate resolve --applied 20261031000000_sync_short_links_upgrade_events
--
-- upgrade_events is a scraper cache (refilled by apps/upgrade-scraper), and its
-- primary key changed from coindar_id to event_id, so it is recreated, not altered.

-- CreateTable
CREATE TABLE "short_links" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "target_url" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "short_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "short_links_slug_key" ON "short_links"("slug");

ALTER TABLE public.short_links ENABLE ROW LEVEL SECURITY;

-- Recreate upgrade_events in the CoinMarketCap shape
DROP TABLE "upgrade_events";

CREATE TABLE "upgrade_events" (
    "event_id" BIGINT NOT NULL,
    "coin_gecko_id" TEXT,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mcap_rank" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "cmc_category" TEXT NOT NULL,
    "impact" TEXT,
    "impact_score" DECIMAL,
    "date_start" TIMESTAMPTZ(6) NOT NULL,
    "date_approx" BOOLEAN NOT NULL DEFAULT false,
    "display_date" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "coin_icon" TEXT,
    "fetched_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "upgrade_events_pkey" PRIMARY KEY ("event_id")
);

CREATE INDEX "upgrade_events_date_start_idx" ON "upgrade_events"("date_start");

ALTER TABLE public.upgrade_events ENABLE ROW LEVEL SECURITY;
