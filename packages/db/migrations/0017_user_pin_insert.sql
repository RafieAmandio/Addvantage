-- 0017_user_pin_insert.sql
-- Phase D4 — enable authenticated users to insert their own `kind='user_pin'`
-- rows into public.timeline_events. All other kinds remain service-role-only
-- (worker ingestion path) because there is no INSERT policy matching them.
--
-- SELECT visibility for user_pin is already handled by
-- `timeline_events_select_combined` (see 0013_consolidate_rls.sql):
--   (kind <> 'user_pin') OR (kind = 'user_pin' AND created_by = (select auth.uid())) OR is_admin()
--
-- WITH CHECK enforces:
--   1. kind must be 'user_pin' (non-admin users cannot insert editorial kinds)
--   2. created_by must equal the caller (no spoofing other users' pins)
-- Uses the cached-uid pattern `(select auth.uid())` to avoid initplan per-row
-- re-evaluation, matching the convention from 0008/0013.

create policy timeline_events_user_pin_insert
  on public.timeline_events
  for insert
  to authenticated
  with check (
    kind = 'user_pin'
    and created_by = (select auth.uid())
  );
