-- CreateTable
CREATE TABLE "early_access_applications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "telegram_handle" TEXT NOT NULL,
    "wants_cashback" BOOLEAN NOT NULL,
    "broker" TEXT,
    "broker_account_ref" TEXT,
    "signed_name" TEXT NOT NULL,
    "signed_at" TIMESTAMPTZ(6) NOT NULL,
    "acknowledgements" JSONB NOT NULL,
    "payment_method" TEXT NOT NULL,
    "payment_amount" DECIMAL NOT NULL,
    "payment_currency" TEXT NOT NULL,
    "proof_image_url" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "confirmation_email_sent_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "early_access_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "early_access_applications_created_at_idx" ON "early_access_applications"("created_at" DESC);

-- ---------------------------------------------------------------------------
-- RLS (Prisma cannot model this; the db-drift gate is blind to it, db-rls-guard
-- is not). Backend-only table: enable RLS with NO policy. The Express API reaches
-- it over the service-role Postgres connection (bypasses RLS) and the web app
-- never queries it directly. Same posture as payments / profiles. Enabling RLS
-- with no policy also applies cleanly on a vanilla shadow DB (no roles needed).
-- ---------------------------------------------------------------------------
ALTER TABLE "early_access_applications" ENABLE ROW LEVEL SECURITY;
