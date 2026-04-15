-- Extensions
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- ============================================================
-- profiles — mirrors auth.users with app-level metadata
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text unique,
  email text,
  tier text not null default 'free' check (tier in ('visitor','free','vip')),
  is_admin boolean not null default false,
  signed_liability boolean not null default false,
  joined_at timestamptz not null default now(),
  renews_at timestamptz,
  package text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_is_admin_idx on public.profiles (is_admin) where is_admin = true;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();
