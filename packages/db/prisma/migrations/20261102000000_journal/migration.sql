-- Trade journal, morning plan and trader settings. Member-owned rows, read and written only through the API.
-- CreateTable
CREATE TABLE "journal_trades" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "symbol" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "setup" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL DEFAULT '1H',
    "status" TEXT NOT NULL DEFAULT 'planned',
    "entry" DECIMAL NOT NULL,
    "stop" DECIMAL NOT NULL,
    "target" DECIMAL,
    "exit" DECIMAL,
    "size" DECIMAL,
    "risk_pct" DECIMAL NOT NULL,
    "opened_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMPTZ(6),
    "followed_plan" BOOLEAN,
    "mistakes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT NOT NULL DEFAULT '',
    "screenshot_url" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journal_trades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_plans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "picks" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trader_settings" (
    "user_id" UUID NOT NULL,
    "equity" DECIMAL NOT NULL DEFAULT 10000,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "risk_tier" DECIMAL NOT NULL DEFAULT 1.5,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trader_settings_pkey" PRIMARY KEY ("user_id")
);

-- CreateIndex
CREATE INDEX "journal_trades_user_idx" ON "journal_trades"("user_id", "opened_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "daily_plans_user_date_key" ON "daily_plans"("user_id", "date");

-- AddForeignKey
ALTER TABLE "journal_trades" ADD CONSTRAINT "journal_trades_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "daily_plans" ADD CONSTRAINT "daily_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trader_settings" ADD CONSTRAINT "trader_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;


-- RLS: the web never queries these directly; the API's service-role connection bypasses it.
-- Enable with no policy. Required by CI db-rls-guard.
ALTER TABLE "journal_trades" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "daily_plans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "trader_settings" ENABLE ROW LEVEL SECURITY;
