-- 0009_profiles_rls_initplan.sql
-- Address Supabase advisor `auth_rls_initplan` on profiles policies.
-- Wrap `auth.uid()` as `(select auth.uid())` so Postgres caches the value
-- once per statement instead of re-evaluating per row. Same pattern as 0008.

drop policy if exists profiles_self_read on public.profiles;
create policy profiles_self_read on public.profiles for select
  using ((select auth.uid()) = id or public.is_admin());

drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles for update
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
