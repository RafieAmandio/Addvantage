-- CreateTable
-- Public giveaway sign-ups. `bingx_uid` is unique so a re-submit upserts (dedupe).
CREATE TABLE "giveaway_entries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "bingx_uid" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telegram" TEXT NOT NULL,
    "name" TEXT,
    "won_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "giveaway_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "giveaway_entries_bingx_uid_key" ON "giveaway_entries"("bingx_uid");

-- CreateIndex
CREATE INDEX "giveaway_entries_created_at_idx" ON "giveaway_entries"("created_at" DESC);

-- RLS: backend-only table (service-role connection bypasses it, web never queries
-- it directly). Enable with no policy. Required by CI db-rls-guard.
ALTER TABLE "giveaway_entries" ENABLE ROW LEVEL SECURITY;
