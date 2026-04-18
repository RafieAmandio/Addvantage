-- 0018_profiles_trader_fields.sql
-- Persist signup wizard answers on public.profiles (one column per answer).
-- handle already exists (text unique) — signup flow UPDATEs it, not added here.

alter table public.profiles
  add column if not exists trading_length text,
  add column if not exists longest_profitable text,
  add column if not exists markets text[],
  add column if not exists yearly_goal text,
  add column if not exists fault_attribution text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_trading_length_check'
  ) then
    alter table public.profiles
      add constraint profiles_trading_length_check
      check (trading_length is null or trading_length in ('<1','1-3','3-5','5+'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'profiles_longest_profitable_check'
  ) then
    alter table public.profiles
      add constraint profiles_longest_profitable_check
      check (longest_profitable is null or longest_profitable in ('1week','1month','1year','3year+'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'profiles_fault_attribution_check'
  ) then
    alter table public.profiles
      add constraint profiles_fault_attribution_check
      check (fault_attribution is null or fault_attribution in ('vantage','me','market'));
  end if;
end$$;
