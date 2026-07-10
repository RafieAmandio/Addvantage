-- CreateTable
-- Draft-first: the row is created from the identity step (email + telegram,
-- status 'draft') and finalized on submit (status 'pending'). Later-step fields
-- are nullable so a lead can be captured before the flow completes. `email` is
-- unique so re-entry upserts (dedupe) and restores the draft.
CREATE TABLE "early_access_applications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "telegram_handle" TEXT NOT NULL,
    "wants_cashback" BOOLEAN,
    "broker" TEXT,
    "broker_account_ref" TEXT,
    "signed_name" TEXT,
    "signed_at" TIMESTAMPTZ(6),
    "acknowledgements" JSONB,
    "payment_method" TEXT,
    "payment_amount" DECIMAL,
    "payment_currency" TEXT,
    "proof_image_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "confirmation_email_sent_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "early_access_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "early_access_applications_email_key" ON "early_access_applications"("email");

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
