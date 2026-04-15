-- ============================================================
-- sources
-- ============================================================
create table public.sources (
  code text primary key,
  name text not null,
  url text not null,
  adapter text not null,
  enabled boolean not null default true,
  poll_minutes integer not null default 60,
  last_polled_at timestamptz,
  last_success_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger sources_touch_updated_at
  before update on public.sources
  for each row execute function public.touch_updated_at();

insert into public.sources (code, name, url, adapter, enabled, poll_minutes) values
  ('FRED',  'FRED — Federal Reserve Economic Data', 'https://fred.stlouisfed.org',               'fred',        true, 60),
  ('SC',    'SlickCharts — S&P 500',                'https://www.slickcharts.com/sp500',          'slickcharts', true, 60),
  ('SPDJI', 'S&P Dow Jones Indices',                'https://www.spglobal.com/spdji',             'spdji',       true, 60),
  ('YRD',   'Yardeni Research',                     'https://www.yardeni.com',                    'yardeni',     true, 60),
  ('RBC',   'RBC Wealth Management — Insights',     'https://www.rbcwealthmanagement.com/en-asia/insights', 'rbc', true, 60);

-- ============================================================
-- news_items
-- ============================================================
create table public.news_items (
  id uuid primary key default gen_random_uuid(),
  source_code text not null references public.sources(code) on update cascade,
  source_url text,
  content_hash text not null,
  fetched_at timestamptz not null default now(),
  raw_text text,
  headline text not null,
  rephrased text,
  analysis text not null,
  impact text not null check (impact in ('high','medium','low')),
  bias text not null check (bias in ('bullish','bearish','neutral')),
  affects text[] not null default '{}',
  tags text[] not null default '{}',
  related_plan_ids text[] not null default '{}',
  author text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_code, content_hash)
);

create index news_items_status_idx       on public.news_items (status);
create index news_items_published_at_idx on public.news_items (published_at desc);
create index news_items_source_code_idx  on public.news_items (source_code);
create index news_items_tags_gin         on public.news_items using gin (tags);
create index news_items_affects_gin      on public.news_items using gin (affects);

create trigger news_items_touch_updated_at
  before update on public.news_items
  for each row execute function public.touch_updated_at();

-- ============================================================
-- telegram_admins
-- ============================================================
create table public.telegram_admins (
  tg_user_id bigint primary key,
  profile_id uuid references public.profiles(id) on delete set null,
  label text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================
-- ingestion_runs — worker observability
-- ============================================================
create table public.ingestion_runs (
  id uuid primary key default gen_random_uuid(),
  source_code text not null references public.sources(code) on update cascade,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running' check (status in ('running','ok','error')),
  items_fetched integer not null default 0,
  items_new integer not null default 0,
  items_rephrased integer not null default 0,
  error text
);

create index ingestion_runs_started_idx on public.ingestion_runs (started_at desc);
create index ingestion_runs_source_idx  on public.ingestion_runs (source_code, started_at desc);
