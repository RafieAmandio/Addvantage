-- AlterTable
-- Audit trail for turning a paid early-access application into a real account:
-- when it was provisioned and which Profile it created. `status` (existing TEXT
-- column) moves to 'provisioned' at the same time. Both columns are nullable so
-- existing rows and unprovisioned applications are unaffected. This migration
-- only alters an existing table, so RLS (enabled in the
-- 20260710153000_early_access_applications migration) still applies unchanged.
ALTER TABLE "early_access_applications" ADD COLUMN "provisioned_at" TIMESTAMPTZ(6);
ALTER TABLE "early_access_applications" ADD COLUMN "account_id" UUID;
