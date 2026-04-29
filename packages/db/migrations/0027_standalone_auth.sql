-- 0027: Standalone auth — add password_hash, email_verified, make email unique
-- Profile.id now defaults to gen_random_uuid() (Prisma schema change);
-- existing rows already have UUIDs so no backfill needed.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS password_hash text,
  ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false;

-- Make email NOT NULL + unique for login lookup.
-- Existing rows with NULL email must be backfilled before this runs in prod.
ALTER TABLE profiles
  ALTER COLUMN email SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_email_key'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_email_key UNIQUE (email);
  END IF;
END $$;
