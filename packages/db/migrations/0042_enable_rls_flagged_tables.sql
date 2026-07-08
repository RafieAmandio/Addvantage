-- 0042_enable_rls_flagged_tables.sql
-- Clears the Supabase security advisor (rls_disabled_in_public + related lints).
--
-- Context: only `init_schema` + `channel_posts` were ever applied to prod, so the
-- RLS defined in earlier migration files never reached the live DB. The backend
-- (Prisma over DATABASE_URL + service_role) bypasses RLS, and the web app reads
-- every table through the Express API rather than the Supabase client, so enabling
-- RLS with no anon policy locks out the anon/authenticated roles without breaking
-- anything. timeline_events is the one exception (web realtime subscription on the
-- anon key), so it gets an explicit SELECT policy.

begin;

-- 1. Backend-only tables: enable RLS, no policy (service_role/postgres bypass).
alter table public.profiles          enable row level security;
alter table public.sources           enable row level security;
alter table public.news_items        enable row level security;
alter table public.telegram_admins   enable row level security;
alter table public.ingestion_runs    enable row level security;
alter table public.instrument_bars   enable row level security;
alter table public.trading_plans     enable row level security;
alter table public.consult_sessions  enable row level security;
alter table public.consult_messages  enable row level security;
alter table public.education_primers enable row level security;
alter table public.payments          enable row level security;
alter table public.email_log         enable row level security;
alter table public.channel_posts     enable row level security;
alter table public.referral_partners enable row level security;

-- 2. timeline_events: enable RLS + SELECT policy for the web realtime feed
--    (editorial rows are public; a user can also see their own pins).
alter table public.timeline_events enable row level security;
create policy timeline_events_read on public.timeline_events
  for select
  using (
    kind <> 'user_pin'
    or (kind = 'user_pin' and created_by = (select auth.uid()))
  );

-- 3. Harden is_admin() (SECURITY DEFINER). No live policy references it; it is
--    only reachable as an anon/authenticated RPC. Pin search_path + drop the
--    anon/authenticated/public EXECUTE grants (service_role keeps its own).
alter function public.is_admin() set search_path = '';
revoke execute on function public.is_admin() from public, anon, authenticated;

-- 4. touch_updated_at trigger function: pin search_path.
alter function public.touch_updated_at() set search_path = '';

-- 5. token_unlocks / token_unlocks_meta had RLS enabled but no policy. Public
--    token-vesting data -> add public read to clear the "RLS enabled, no policy".
create policy token_unlocks_public_read
  on public.token_unlocks for select using (true);
create policy token_unlocks_meta_public_read
  on public.token_unlocks_meta for select using (true);

-- 6. Storage: `uploads` is a public bucket (objects served via public URL without
--    a policy). Drop the broad SELECT policy that also allowed LISTING every file.
drop policy if exists "Public read access" on storage.objects;

commit;
