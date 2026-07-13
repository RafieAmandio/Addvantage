-- 0043_short_links.sql
-- Host-based shortlinks. One row = one slug -> target URL. The API serves the
-- redirect: a host that maps to a slug (e.g. meet.tradevantage.gg -> slug
-- 'meet') 302s to target_url. Slug-keyed so more links are a small step, but
-- only 'meet' is exposed in the admin UI for now.
--
-- RLS mirrors the 0038 convention (public read, admin-only writes) as
-- defense-in-depth for direct PostgREST access; the API connects as the
-- service role and bypasses RLS.

create table public.short_links (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  target_url text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Seed the single meet row with the recurring Zoom room.
insert into public.short_links (slug, target_url)
values ('meet', 'https://ui-ac-id.zoom.us/j/6203674797?pwd=Y3pWTHI3NjV4Qmp1RHBvbXRxN0xwdz09')
on conflict (slug) do nothing;

alter table public.short_links enable row level security;

create policy short_links_read on public.short_links
  for select to anon, authenticated
  using (true);

create policy short_links_admin_insert on public.short_links
  for insert to authenticated
  with check (public.is_admin());

create policy short_links_admin_update on public.short_links
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create trigger short_links_set_updated_at
  before update on public.short_links
  for each row execute function public.touch_updated_at();
