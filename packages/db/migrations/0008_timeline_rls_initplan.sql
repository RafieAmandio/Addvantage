-- 0008_timeline_rls_initplan.sql
-- Address Supabase advisors on timeline_events:
--   * auth_rls_initplan — `auth.uid()` is re-evaluated per row at scale; wrap
--     in a scalar subquery so Postgres caches the value once per statement.
--   * unindexed_foreign_keys — `timeline_events_created_by_fkey` lacked a
--     covering index, slowing cascading deletes / lookups by author.

-- Recreate the owner-read policy with the cached-uid pattern.
drop policy if exists "timeline_events: owner read user_pin" on public.timeline_events;
create policy "timeline_events: owner read user_pin"
  on public.timeline_events
  for select
  using (kind = 'user_pin' and created_by = (select auth.uid()));

-- Partial index on the FK column (most rows have created_by = null).
create index if not exists timeline_events_created_by_idx
  on public.timeline_events (created_by)
  where created_by is not null;
