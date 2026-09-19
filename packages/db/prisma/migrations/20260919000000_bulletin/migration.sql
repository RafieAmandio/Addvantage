-- CreateTable
CREATE TABLE "bulletin_instruments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "symbol" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "bias" TEXT NOT NULL DEFAULT 'neutral',
    "what_to_watch" TEXT,
    "entry" TEXT,
    "exit" TEXT,
    "note" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bulletin_instruments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bulletin_levels" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "bulletin_id" UUID NOT NULL,
    "timeframe" TEXT NOT NULL,
    "market_structure" TEXT NOT NULL DEFAULT 'neutral',
    "bos_level" TEXT,
    "comment" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bulletin_levels_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bulletin_instruments_symbol_key" ON "bulletin_instruments"("symbol");

-- CreateIndex
CREATE INDEX "bulletin_instruments_status_idx" ON "bulletin_instruments"("status");

-- CreateIndex
CREATE INDEX "bulletin_instruments_updated_idx" ON "bulletin_instruments"("updated_at" DESC);

-- CreateIndex
CREATE INDEX "bulletin_levels_bulletin_id_idx" ON "bulletin_levels"("bulletin_id");

-- CreateIndex
CREATE UNIQUE INDEX "bulletin_levels_bulletin_id_timeframe_key" ON "bulletin_levels"("bulletin_id", "timeframe");

-- AddForeignKey
ALTER TABLE "bulletin_levels" ADD CONSTRAINT "bulletin_levels_bulletin_id_fkey" FOREIGN KEY ("bulletin_id") REFERENCES "bulletin_instruments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Row Level Security: service-role-only tables (no policies). Required by CI db-rls-guard.
ALTER TABLE "bulletin_instruments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bulletin_levels" ENABLE ROW LEVEL SECURITY;
