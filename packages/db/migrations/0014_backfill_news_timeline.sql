-- 0014_backfill_news_timeline.sql
-- Section 4 Phase C: migrate approved news_items into timeline_events so
-- timeline_events becomes the single source of truth for news on the chart.
--
-- Three parts:
--   (a) Partial unique index keyed on news_item_id for kind='news' rows,
--       making both the backfill and the auto-mirror trigger idempotent.
--   (b) One-shot backfill from approved news_items.
--   (c) AFTER INSERT/UPDATE trigger on news_items that mirrors future
--       approvals into timeline_events (SECURITY DEFINER so it bypasses RLS).

-- (a) Idempotency guard for news-kind mirroring.
create unique index if not exists timeline_events_news_item_id_unique
  on public.timeline_events (news_item_id)
  where kind = 'news' and news_item_id is not null;

-- (b) Backfill approved news_items into timeline_events.
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
select
  'news'                                      as kind,
  ni.source_code,
  coalesce(ni.published_at, ni.fetched_at)    as occurred_at,
  ni.affects                                  as symbols,
  ni.headline                                 as title,
  ni.analysis                                 as body,
  ni.source_url                               as url,
  ni.bias,
  ni.impact,
  ni.id                                       as news_item_id,
  ni.created_at
from public.news_items ni
where ni.status = 'approved'
on conflict (news_item_id) where kind = 'news' and news_item_id is not null
do nothing;

-- (c) Trigger function + trigger to auto-mirror future approvals.
create or replace function public.mirror_news_item_to_timeline()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'approved'
     and (tg_op = 'INSERT' or old.status is distinct from 'approved') then
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
      'news',
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
    on conflict (news_item_id) where kind = 'news' and news_item_id is not null
    do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists news_items_mirror_to_timeline on public.news_items;
create trigger news_items_mirror_to_timeline
  after insert or update of status on public.news_items
  for each row
  execute function public.mirror_news_item_to_timeline();
