-- CreateTable
-- Black Friday intake. Draft keyed by email; `bingx_uid` unique across applications.
CREATE TABLE "black_friday_applications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "answers" JSONB,
    "biggest_loss_bucket" TEXT,
    "bingx_uid" TEXT,
    "bingx_proof_path" TEXT,
    "plan" TEXT,
    "payment_method" TEXT,
    "payment_amount" DECIMAL,
    "payment_currency" TEXT,
    "payment_proof_path" TEXT,
    "signed_name" TEXT,
    "signed_at" TIMESTAMPTZ(6),
    "acknowledgements" JSONB,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "reviewed_at" TIMESTAMPTZ(6),
    "review_note" TEXT,
    "dinner_invited_at" TIMESTAMPTZ(6),
    "account_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "black_friday_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "black_friday_applications_email_key" ON "black_friday_applications"("email");

-- CreateIndex
CREATE UNIQUE INDEX "black_friday_applications_bingx_uid_key" ON "black_friday_applications"("bingx_uid");

-- CreateIndex
CREATE INDEX "black_friday_applications_status_idx" ON "black_friday_applications"("status");

-- CreateIndex
CREATE INDEX "black_friday_applications_created_at_idx" ON "black_friday_applications"("created_at" DESC);

-- RLS: backend-only table (service-role connection bypasses it, web never queries
-- it directly). Enable with no policy. Required by CI db-rls-guard.
ALTER TABLE "black_friday_applications" ENABLE ROW LEVEL SECURITY;
