-- ============================================================
-- Row Level Security
-- ============================================================

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

alter table public.profiles enable row level security;
create policy profiles_self_read on public.profiles for select
  using (auth.uid() = id or public.is_admin());
create policy profiles_self_update on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);
create policy profiles_admin_update on public.profiles for update
  using (public.is_admin()) with check (public.is_admin());

alter table public.sources enable row level security;
create policy sources_public_read on public.sources for select using (true);
create policy sources_admin_write on public.sources for all
  using (public.is_admin()) with check (public.is_admin());

alter table public.news_items enable row level security;
create policy news_items_public_read on public.news_items for select
  using (status = 'approved');
create policy news_items_admin_read on public.news_items for select
  using (public.is_admin());
create policy news_items_admin_write on public.news_items for all
  using (public.is_admin()) with check (public.is_admin());

alter table public.telegram_admins enable row level security;
create policy telegram_admins_admin_only on public.telegram_admins for all
  using (public.is_admin()) with check (public.is_admin());

alter table public.ingestion_runs enable row level security;
create policy ingestion_runs_admin_read on public.ingestion_runs for select
  using (public.is_admin());
