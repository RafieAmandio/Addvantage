-- _proposed_0013_consolidate_rls.sql
-- DRAFT — NOT YET APPLIED. Renaming this file to `0013_consolidate_rls.sql`
-- will queue it for the next migration run. Review carefully before doing so.
--
-- Consolidates overlapping permissive policies surfaced by Supabase advisor
-- `multiple_permissive_policies`. Each (table, action, role) combo had 2+
-- policies evaluated per row at scale. After this migration, exactly one
-- policy per (table, action, role) — predicates OR-combined.
--
-- Per-table summary of changes:
--   news_items      : SELECT had 3 overlapping policies (admin_read, admin_write FOR ALL, public_read).
--                     Drop the FOR ALL catch-all; split admin writes into explicit INSERT/UPDATE/DELETE;
--                     merge SELECT into a single `status='approved' OR public.is_admin()` policy.
--   profiles        : UPDATE had 2 overlapping policies (admin_update, self_update).
--                     Merge into one policy with OR-combined using/with_check predicates.
--   sources         : SELECT had 2 overlapping policies (admin_write FOR ALL, public_read).
--                     Drop the FOR ALL catch-all; split admin writes into INSERT/UPDATE/DELETE;
--                     public_read (`using(true)`) already covers admins, so no SELECT merge needed.
--   timeline_events : SELECT had 3 overlapping policies (admin read all, owner read user_pin,
--                     public read editorial). Merge into a single OR-combined policy.
--
-- Role scope note: all current policies target role `public` (the default), so the advisor
-- warnings for the 5 Postgres roles (anon, authenticated, authenticator, dashboard_user,
-- supabase_privileged_role) all resolve with a single consolidated policy per action.
--
-- Supabase migration runner note: files in packages/db/migrations/ whose names do not match
-- the `NNNN_name.sql` convention are inert — `supabase.list_migrations` reads the
-- `supabase_migrations.schema_migrations` table, not a directory listing. This draft file
-- is safe to sit alongside applied migrations; it will only run once renamed and applied
-- via `mcp__supabase__apply_migration`.

begin;

-- ============================================================================
-- news_items
-- ============================================================================
-- Old policies being merged:
--   news_items_public_read : SELECT using (status = 'approved')
--   news_items_admin_read  : SELECT using (is_admin())
--   news_items_admin_write : ALL    using (is_admin()) with check (is_admin())
--                            ^ FOR ALL implies SELECT too — this is the third
--                              permissive SELECT the advisor flagged.

drop policy if exists news_items_public_read  on public.news_items;
drop policy if exists news_items_admin_read   on public.news_items;
drop policy if exists news_items_admin_write  on public.news_items;

-- One SELECT policy: public sees approved rows, admins see everything.
create policy news_items_select_combined on public.news_items
  for select
  using (status = 'approved' or public.is_admin());

-- Admin-only writes, split per action so the SELECT policy above is the only
-- permissive policy that matches on SELECT.
create policy news_items_insert_combined on public.news_items
  for insert
  with check (public.is_admin());

create policy news_items_update_combined on public.news_items
  for update
  using (public.is_admin())
  with check (public.is_admin());

create policy news_items_delete_combined on public.news_items
  for delete
  using (public.is_admin());

-- ============================================================================
-- profiles
-- ============================================================================
-- Old policies being merged:
--   profiles_self_update  : UPDATE using ((select auth.uid()) = id)
--                                   with check ((select auth.uid()) = id)
--   profiles_admin_update : UPDATE using (is_admin()) with check (is_admin())
--
-- profiles_self_read already OR-combines self+admin, so SELECT is untouched.

drop policy if exists profiles_self_update  on public.profiles;
drop policy if exists profiles_admin_update on public.profiles;

create policy profiles_update_combined on public.profiles
  for update
  using (((select auth.uid()) = id) or public.is_admin())
  with check (((select auth.uid()) = id) or public.is_admin());

-- ============================================================================
-- sources
-- ============================================================================
-- Old policies being merged:
--   sources_public_read  : SELECT using (true)
--   sources_admin_write  : ALL    using (is_admin()) with check (is_admin())
--                          ^ FOR ALL implies SELECT, hence the overlap.
--
-- sources_public_read already admits everyone (using true), so no combined
-- SELECT policy is needed — we just stop the admin policy from covering SELECT
-- by splitting it into per-action write policies.

drop policy if exists sources_admin_write on public.sources;

-- public SELECT stays as-is (`sources_public_read` is NOT dropped).
create policy sources_insert_combined on public.sources
  for insert
  with check (public.is_admin());

create policy sources_update_combined on public.sources
  for update
  using (public.is_admin())
  with check (public.is_admin());

create policy sources_delete_combined on public.sources
  for delete
  using (public.is_admin());

-- ============================================================================
-- timeline_events
-- ============================================================================
-- Old policies being merged (all SELECT):
--   "timeline_events: public read editorial" : using (kind <> 'user_pin')
--   "timeline_events: owner read user_pin"   : using (kind = 'user_pin' and created_by = (select auth.uid()))
--   "timeline_events: admin read all"        : using (is_admin())

drop policy if exists "timeline_events: public read editorial" on public.timeline_events;
drop policy if exists "timeline_events: owner read user_pin"   on public.timeline_events;
drop policy if exists "timeline_events: admin read all"        on public.timeline_events;

create policy timeline_events_select_combined on public.timeline_events
  for select
  using (
    kind <> 'user_pin'
    or (kind = 'user_pin' and created_by = (select auth.uid()))
    or public.is_admin()
  );

commit;

-- Post-apply checklist:
--   1. Regenerate DB types (supabase gen types typescript ...).
--   2. Run `mcp__supabase__get_advisors` (performance) — `multiple_permissive_policies`
--      warnings for news_items/profiles/sources/timeline_events should be gone.
--   3. Smoke-test:
--        - Anonymous: SELECT on news_items returns only status='approved'.
--        - Authenticated non-admin: can UPDATE own profile row; cannot UPDATE others.
--        - Admin: full CRUD on news_items, sources, profiles; SELECT on timeline_events
--          returns user_pin rows from other users.
--        - Authenticated non-admin: SELECT on timeline_events returns non-user_pin rows
--          plus only own user_pin rows.
