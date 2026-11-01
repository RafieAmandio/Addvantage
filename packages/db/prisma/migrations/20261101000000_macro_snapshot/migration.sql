-- CreateTable
-- Latest macro snapshot (policy rates, yields, risk gauges, rate-decision odds). Single row, id = 1.
CREATE TABLE "macro_snapshot" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "data" JSONB NOT NULL,
    "synced_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "macro_snapshot_pkey" PRIMARY KEY ("id")
);

-- RLS: backend-only table (service-role connection bypasses it, web never queries
-- it directly). Enable with no policy. Required by CI db-rls-guard.
ALTER TABLE "macro_snapshot" ENABLE ROW LEVEL SECURITY;
