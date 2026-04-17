-- 0007_timeline.sql
-- Tables for the Market Timeline Chart feature (Section 4 Phase A skeleton).
-- See docs/ROADMAP.md §4 for the full design context.

-- ---------- instrument_bars ----------
-- OHLCV candles cached from a market data provider. Composite PK on
-- (symbol, interval, ts) so writes are upserts and reads are range scans.
create table public.instrument_bars (
  symbol text not null,
  interval text not null check (interval in ('1m','5m','1h','1d')),
  ts timestamptz not null,
  open numeric,
  high numeric,
  low numeric,
  close numeric,
  volume numeric,
  primary key (symbol, interval, ts)
);

alter table public.instrument_bars enable row level security;

-- Bars are public reference data. No write policy: only the service role
-- (worker) writes them.
create policy "instrument_bars: public read"
  on public.instrument_bars
  for select
  using (true);

-- ---------- timeline_events ----------
-- Generic timeline marker (superset of news, tweets, macro events, user pins).
-- News rows backlink to news_items so the existing editorial dataset can be
-- exposed on the chart without duplication.
create table public.timeline_events (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('news','tweet','macro','earnings','user_pin')),
  source_code text,
  occurred_at timestamptz not null,
  symbols text[] not null default '{}',
  title text not null,
  body text,
  url text,
  bias text check (bias is null or bias in ('bullish','bearish','neutral')),
  impact text check (impact is null or impact in ('high','medium','low')),
  metadata jsonb,
  news_item_id uuid references public.news_items(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index timeline_events_symbols_gin
  on public.timeline_events using gin (symbols);
create index timeline_events_occurred_at_idx
  on public.timeline_events (occurred_at desc);
create index timeline_events_news_item_id_idx
  on public.timeline_events (news_item_id)
  where news_item_id is not null;

alter table public.timeline_events enable row level security;

-- Editorial kinds are public read. user_pin is private until the Phase D
-- design lands.
create policy "timeline_events: public read editorial"
  on public.timeline_events
  for select
  using (kind <> 'user_pin');

-- A user can see their own pins.
create policy "timeline_events: owner read user_pin"
  on public.timeline_events
  for select
  using (kind = 'user_pin' and created_by = auth.uid());

-- Admin can see everything (incl. other users' pins) for moderation.
create policy "timeline_events: admin read all"
  on public.timeline_events
  for select
  using (public.is_admin());
