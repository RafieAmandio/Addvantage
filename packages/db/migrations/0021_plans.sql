-- 0021_plans.sql
-- Section 3 — Trading plan system. Real admin-authored plans replacing the
-- mock `features/plan/mock.ts` data the UI currently reads.
--
-- Design choice (tick 146): single `trading_plans` table with `setups` as a
-- JSONB array rather than a second `plan_setups` table. Each plan renders as
-- one row in the UI (list + detail), and setups are small nested objects
-- (label, entry, notes). A JSONB column keeps v1 queries trivial (one fetch
-- per plan, no joins) and we can promote to a separate table later if we
-- need to index/query across setups. Matches the ROADMAP P1 hint explicitly.
--
-- Tier taxonomy: reuses the profile tier enum (`free` | `vip`) from 0001_init;
-- a plan tagged `vip` still respects RLS via `status='published'` — client-side
-- `isPaidTier()` + server `requireTier()` handle the paywall. `visitor` isn't
-- a meaningful plan gate (unauthenticated users get the published-free feed
-- by default) so it's excluded from the plan tier enum to keep intent clear.

create table public.trading_plans (
  id uuid primary key default gen_random_uuid(),
  symbol text not null,
  thesis text not null,
  direction text not null check (direction in ('long','short')),
  entry numeric,
  stop numeric,
  target numeric,
  r_multiple numeric,
  setups jsonb not null default '[]'::jsonb,
  tags text[] not null default '{}',
  tier text not null default 'free' check (tier in ('free','vip')),
  status text not null default 'draft' check (status in ('draft','published','closed')),
  outcome text check (outcome in ('win','loss','breakeven','stopped')),
  author_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  closed_at timestamptz
);

-- Public feed query: `where status='published' order by published_at desc`.
-- Partial index keeps it cheap as draft/closed rows accumulate.
create index trading_plans_status_published_idx
  on public.trading_plans (published_at desc)
  where status = 'published';

create index trading_plans_symbol_idx on public.trading_plans (symbol);

-- Unindexed-FK hygiene (see 0010_unindexed_fkeys.sql pattern).
create index trading_plans_author_idx
  on public.trading_plans (author_id)
  where author_id is not null;

create index trading_plans_tags_gin
  on public.trading_plans using gin (tags);

alter table public.trading_plans enable row level security;

-- Public read: published only; admins can also see drafts/closed.
-- Single permissive SELECT policy (tick-73 / tick-144 convention) using
-- OR so we don't trip the `multiple_permissive_policies` advisor.
create policy trading_plans_read on public.trading_plans
  for select to anon, authenticated
  using (status = 'published' or public.is_admin());

-- Admin-only writes, split per command to keep a single permissive policy
-- per (table, cmd). `public.is_admin()` helper is from 0003_rls.sql.
create policy trading_plans_admin_insert on public.trading_plans
  for insert to authenticated
  with check (public.is_admin());

create policy trading_plans_admin_update on public.trading_plans
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy trading_plans_admin_delete on public.trading_plans
  for delete to authenticated
  using (public.is_admin());

-- Touch updated_at on UPDATE, matching 0020_education_primers.sql etc.
create trigger trading_plans_set_updated_at
  before update on public.trading_plans
  for each row execute function public.touch_updated_at();
