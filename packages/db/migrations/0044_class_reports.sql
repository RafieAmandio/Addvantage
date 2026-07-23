-- 0044_class_reports.sql
-- Class Reports — written recaps of live classes/sessions, surfaced as a
-- "Reports" tab inside /app/education. One row = one report; the content is a
-- branded PDF hosted on Google Drive (link-shared), embedded via the same
-- /preview iframe used by video_modules. We store only the Drive file id.
--
-- Access mirrors video_modules: the API gates reads to vip/admin so drive_id
-- never reaches free-tier clients. RLS (published-or-admin read, admin-only
-- writes) is defense-in-depth for direct PostgREST access.

create table public.class_reports (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title        text not null,
  summary      text not null default '',
  author       text not null default 'Anthony',
  drive_id     text not null,
  published_at timestamptz(6),
  sort_order   int not null default 0,
  published    boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index class_reports_pub_idx
  on public.class_reports (published, sort_order)
  where published = true;

alter table public.class_reports enable row level security;

create policy class_reports_read on public.class_reports
  for select to anon, authenticated
  using (published = true or public.is_admin());

create policy class_reports_admin_insert on public.class_reports
  for insert to authenticated
  with check (public.is_admin());

create policy class_reports_admin_update on public.class_reports
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy class_reports_admin_delete on public.class_reports
  for delete to authenticated
  using (public.is_admin());

create trigger class_reports_set_updated_at
  before update on public.class_reports
  for each row execute function public.touch_updated_at();
