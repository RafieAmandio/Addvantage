-- Records two changes that reached prod through the frozen legacy SQL
-- (migrations/0040_upgrade_radar.sql, migrations/0043_short_links.sql) after the
-- 0_init baseline was cut, so prisma/migrations reproduces schema.prisma again.
-- Idempotent: on prod both tables already have this shape and nothing changes.

-- Upgrade Radar moved from Coindar to CoinMarketCal. The table is a scraper cache
-- (re-synced by upgrade-scraper), so the old Coindar shape is dropped, not migrated.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'upgrade_events' AND column_name = 'coindar_id'
  ) THEN
    DROP TABLE "upgrade_events";
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "upgrade_events" (
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

CREATE INDEX IF NOT EXISTS "upgrade_events_date_start_idx" ON "upgrade_events"("date_start");

-- VIP-only surface: service-role access only, no public policy.
ALTER TABLE "upgrade_events" ENABLE ROW LEVEL SECURITY;

-- Host-based shortlinks (meet.tradevantage.gg -> Zoom room), served by the API.
CREATE TABLE IF NOT EXISTS "short_links" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "target_url" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "short_links_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "short_links_slug_key" ON "short_links"("slug");

-- RLS mirrors 0043: public read, admin-only writes.
ALTER TABLE "short_links" ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY short_links_read ON public.short_links
    FOR SELECT TO anon, authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY short_links_admin_insert ON public.short_links
    FOR INSERT TO authenticated WITH CHECK (public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY short_links_admin_update ON public.short_links
    FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE TRIGGER short_links_set_updated_at
  BEFORE UPDATE ON public.short_links
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
