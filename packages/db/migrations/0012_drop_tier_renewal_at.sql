-- 0012_drop_tier_renewal_at.sql
-- Resolve duplicate renewal-date columns on profiles. The pre-existing
-- `renews_at` (from 0001_init.sql) is the canonical column going forward.
-- `tier_renewal_at` was added in 0011 for the renewal-reminder cron but
-- was never populated. Drop it and have the cron read `renews_at` instead.
drop index if exists public.profiles_tier_renewal_at_idx;
alter table public.profiles drop column if exists tier_renewal_at;

-- Add an equivalent partial index on the canonical column.
create index if not exists profiles_renews_at_idx
  on public.profiles (renews_at)
  where renews_at is not null;
