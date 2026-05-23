-- 0033_polymarket.sql
-- Polymarket prediction market tracking: curated events + periodic probability snapshots.

-- ─── polymarket_tracked ──────────────────────────────────────────────
-- Admin-curated list of Polymarket events to display on the dashboard.
-- Worker cron keeps this up-to-date (slug rotation for monthly markets).
create table if not exists public.polymarket_tracked (
  id           uuid primary key default gen_random_uuid(),
  category     text not null,
  label        text not null,
  event_id     text not null,
  event_slug   text not null,
  event_title  text not null,
  search_query text not null,
  active       boolean not null default true,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create unique index polymarket_tracked_event_id_idx on public.polymarket_tracked (event_id);
create index polymarket_tracked_active_idx on public.polymarket_tracked (active, sort_order);

-- ─── polymarket_snapshots ────────────────────────────────────────────
-- Periodic probability snapshots for tracked markets.
-- Worker upserts every ~10 min. Dashboard reads latest; weekly range
-- computed from 7 days of history.
create table if not exists public.polymarket_snapshots (
  id           uuid primary key default gen_random_uuid(),
  tracked_id   uuid not null references public.polymarket_tracked(id) on delete cascade,
  outcomes     jsonb not null default '[]',
  volume       numeric,
  liquidity    numeric,
  market_count int not null default 0,
  fetched_at   timestamptz not null default now()
);

create index polymarket_snapshots_tracked_fetched_idx
  on public.polymarket_snapshots (tracked_id, fetched_at desc);

-- ─── RLS ─────────────────────────────────────────────────────────────
alter table public.polymarket_tracked enable row level security;
alter table public.polymarket_snapshots enable row level security;

-- Public read for both tables (prediction data is not sensitive)
create policy polymarket_tracked_public_read on public.polymarket_tracked
  for select using (true);

create policy polymarket_snapshots_public_read on public.polymarket_snapshots
  for select using (true);

-- Admin write for tracked table
create policy polymarket_tracked_admin_insert on public.polymarket_tracked
  for insert with check (public.is_admin());

create policy polymarket_tracked_admin_update on public.polymarket_tracked
  for update using (public.is_admin());

create policy polymarket_tracked_admin_delete on public.polymarket_tracked
  for delete using (public.is_admin());

-- Service-role insert for snapshots (worker uses service role)
-- No user-facing write needed
create policy polymarket_snapshots_admin_insert on public.polymarket_snapshots
  for insert with check (public.is_admin());

create policy polymarket_snapshots_admin_update on public.polymarket_snapshots
  for update using (public.is_admin());

create policy polymarket_snapshots_admin_delete on public.polymarket_snapshots
  for delete using (public.is_admin());

-- ─── Seed tracked markets ────────────────────────────────────────────
-- Initial curated set. Worker will auto-rotate event_id/slug for monthly markets.
insert into public.polymarket_tracked (category, label, search_query, event_id, event_slug, event_title, sort_order) values
  ('CRYPTO',      'BTC',   'what price will bitcoin hit',  'pending-btc',   '', 'BTC Price Prediction',       0),
  ('COMMODITIES', 'OIL',   'crude oil hit',                'pending-oil',   '', 'Oil Price Prediction',       1),
  ('EQUITIES',    'SPX',   'sp500 hit',                    'pending-spx',   '', 'S&P 500 Level Prediction',   2),
  ('MACRO',       'RATES', 'how many fed rate cuts',       'pending-rates', '', 'Fed Rate Cuts 2026',         3);
