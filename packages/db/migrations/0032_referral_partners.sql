-- 0032_referral_partners.sql
-- Referral partner links displayed in the app sidebar.
-- Managed from the DB so partners can be added/edited without code changes.

create table public.referral_partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('crypto_exchange', 'broker')),
  tagline text not null default '',
  url text not null,
  icon_url text,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.referral_partners enable row level security;

create policy referral_partners_public_read on public.referral_partners
  for select to authenticated using (active = true);

create policy referral_partners_admin_all on public.referral_partners
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

insert into public.referral_partners (name, category, tagline, url, icon_url, sort_order) values
  ('Bitget', 'crypto_exchange', 'Cashback fees 20%', 'https://www.bitget.com/', null, 1),
  ('Bybit', 'crypto_exchange', 'Bonus deposit baru', 'https://www.bybit.com/', null, 2),
  ('Exness', 'broker', 'Spread rendah', 'https://www.exness.com/', null, 3);
