-- 0011_renewals.sql
-- Renewal tracking + email send log for Brevo dunning/renewal flow (E3).
--
-- Note: public.profiles already has a `renews_at` column from older schema,
-- but we add `tier_renewal_at` per the E3 spec so the renewal scheduler has
-- an explicit, semantically-named column it owns. If a future tick unifies
-- the two, add a migration that backfills + drops `renews_at`.

alter table public.profiles
  add column if not exists tier_renewal_at timestamptz;

create index if not exists profiles_tier_renewal_at_idx
  on public.profiles (tier_renewal_at)
  where tier_renewal_at is not null;

create table if not exists public.email_log (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('renewal_reminder', 'dunning', 'welcome', 'receipt')),
  external_message_id text,
  provider text not null,
  template_id text,
  sent_at timestamptz default now(),
  payload jsonb,
  unique (profile_id, kind, sent_at)
);

create index if not exists email_log_profile_id_idx
  on public.email_log (profile_id);

alter table public.email_log enable row level security;

-- Admin-only read; the worker uses the service role and bypasses RLS.
create policy email_log_admin_read on public.email_log for select
  using (public.is_admin());
