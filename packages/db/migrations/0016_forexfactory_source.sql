-- 0016_forexfactory_source.sql
-- Section 3 Calendar: add the FF source (ForexFactory weekly RSS mirror)
-- and extend the news→timeline mirror trigger so macro-calendar events land
-- in timeline_events with kind='macro' instead of kind='news'.
--
-- Per ROADMAP §4 design, macro events render as `kind='macro'` on the chart,
-- distinct from `news` and `tweet`. Calendar candidates still flow through
-- the existing news_items → rephrase → approve pipeline so editors can
-- filter noise, drop irrelevant prints, and curate `affects[]`. The mirror
-- to timeline_events tags them correctly via a single source_code → kind
-- `case` branch (extended from 0015 which introduced TRUMP → tweet).

-- (1) Register the FF source. Idempotent.
insert into public.sources (code, name, url, adapter, enabled, poll_minutes)
values (
  'FF',
  'ForexFactory Economic Calendar',
  'https://nfs.faireconomy.media/ff_calendar_thisweek.xml',
  'forexfactory',
  true,
  360
)
on conflict (code) do nothing;

-- (2) Broaden the idempotency unique index from 0015 so it also covers
-- kind='macro' rows keyed by news_item_id. The trigger's ON CONFLICT target
-- predicate below must match this index predicate exactly (per 0015 lesson
-- on partial unique index / ON CONFLICT WHERE coupling).
drop index if exists public.timeline_events_news_item_id_unique;
create unique index timeline_events_news_item_id_unique
  on public.timeline_events (news_item_id)
  where kind in ('news', 'tweet', 'macro') and news_item_id is not null;

-- (3) Replace the mirror trigger function: extend the source_code → kind
-- routing with FF → 'macro'. Preserves SECURITY DEFINER + ON CONFLICT
-- DO NOTHING semantics from 0014/0015.
create or replace function public.mirror_news_item_to_timeline()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_kind text;
begin
  if new.status = 'approved'
     and (tg_op = 'INSERT' or old.status is distinct from 'approved') then
    -- Source-code → timeline kind routing. Extend this `case` when adding a
    -- new tweet-like or macro source.
    v_kind := case new.source_code
      when 'TRUMP' then 'tweet'
      when 'FF' then 'macro'
      else 'news'
    end;

    insert into public.timeline_events (
      kind,
      source_code,
      occurred_at,
      symbols,
      title,
      body,
      url,
      bias,
      impact,
      news_item_id,
      created_at
    )
    values (
      v_kind,
      new.source_code,
      coalesce(new.published_at, new.fetched_at),
      new.affects,
      new.headline,
      new.analysis,
      new.source_url,
      new.bias,
      new.impact,
      new.id,
      new.created_at
    )
    on conflict (news_item_id)
      where kind in ('news', 'tweet', 'macro') and news_item_id is not null
    do nothing;
  end if;
  return new;
end;
$$;
