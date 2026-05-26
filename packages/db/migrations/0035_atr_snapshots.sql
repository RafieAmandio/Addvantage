-- ATR daily level snapshot cache for the ATR scanner feature.
-- Worker computes ATR(20) from TwelveData daily candles, upserts here.
-- API reads for GET /atr/scanner.

create table if not exists public.atr_snapshots (
  symbol          text        not null,
  atr             numeric     not null,
  price           numeric,
  daily_open      numeric     not null,
  daily_high      numeric     not null,
  daily_low       numeric     not null,
  daily_close     numeric     not null,
  upper_level     numeric     not null,
  lower_level     numeric     not null,
  exhaustion_pct  numeric     not null,
  direction       text        not null check (direction in ('bullish', 'bearish')),
  ts              timestamptz not null,
  fetched_at      timestamptz not null default now(),
  primary key (symbol)
);

alter table public.atr_snapshots enable row level security;

create policy "atr_snapshots: public read"
  on public.atr_snapshots
  for select
  using (true);
