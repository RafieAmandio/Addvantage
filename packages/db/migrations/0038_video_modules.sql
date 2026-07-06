-- 0038_video_modules.sql
-- Video Modules — curated VIP-only recordings (market analysis + live
-- sessions) surfaced as a tab inside /app/education. One row = one module
-- video, hosted externally as a link-shared embed (YouTube unlisted or
-- Google Drive); we store only the provider + its video ID.
--
-- Access control differs from education_primers: the API gates reads to
-- vip/admin so video_id never reaches free-tier clients. RLS mirrors the
-- 0020 convention (published-or-admin read, admin-only writes) as
-- defense-in-depth for direct PostgREST access.

create table public.video_modules (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  category text not null default 'analysis' check (category in ('analysis', 'session')),
  provider text not null default 'youtube' check (provider in ('youtube', 'drive')),
  video_id text not null,
  duration text not null default '',
  sort_order int not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index video_modules_published_sort_idx
  on public.video_modules (published, sort_order)
  where published = true;

alter table public.video_modules enable row level security;

-- Single permissive SELECT policy (tick-73 convention).
create policy video_modules_read on public.video_modules
  for select to anon, authenticated
  using (published = true or public.is_admin());

create policy video_modules_admin_insert on public.video_modules
  for insert to authenticated
  with check (public.is_admin());

create policy video_modules_admin_update on public.video_modules
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy video_modules_admin_delete on public.video_modules
  for delete to authenticated
  using (public.is_admin());

create trigger video_modules_set_updated_at
  before update on public.video_modules
  for each row execute function public.touch_updated_at();
