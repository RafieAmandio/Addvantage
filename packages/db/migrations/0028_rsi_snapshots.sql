-- RSI snapshot cache for the heatmap feature.
-- Worker writes every 4 hours; API reads for GET /rsi/heatmap.

create table if not exists public.rsi_snapshots (
  symbol     text        not null,
  interval   text        not null check (interval in ('1h','4h','1day')),
  rsi        numeric     not null,
  price      numeric,
  ts         timestamptz not null,
  fetched_at timestamptz not null default now(),
  primary key (symbol, interval)
);

alter table public.rsi_snapshots enable row level security;

create policy "rsi_snapshots: public read"
  on public.rsi_snapshots
  for select
  using (true);

create index if not exists rsi_snapshots_interval_idx
  on public.rsi_snapshots (interval);
