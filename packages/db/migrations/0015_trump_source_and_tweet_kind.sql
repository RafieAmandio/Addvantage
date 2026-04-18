-- 0015_trump_source_and_tweet_kind.sql
-- Section 4 Phase C: add the TRUMP source row (Truth Social via RSS mirror)
-- and extend the news→timeline mirror trigger so tweet-like sources land in
-- timeline_events with kind='tweet' instead of kind='news'.
--
-- Rationale: the ROADMAP §4 design specifies tweets should be rendered as
-- `kind='tweet'` on the chart, distinct from `news`. Tweet Candidates still
-- flow through the existing news_items → rephrase → approve pipeline (so the
-- editor can curate noisy posts), but the mirror to timeline_events must tag
-- them correctly. Instead of a second trigger, we extend the existing one
-- with a source_code → kind `case`.

-- (1) Register the TRUMP source. Idempotent.
insert into public.sources (code, name, url, adapter, enabled, poll_minutes)
values (
  'TRUMP',
  'Donald Trump (Truth Social)',
  'https://trumpstruth.org/feed',
  'truth-social',
  true,
  60
)
on conflict (code) do nothing;

-- (2) Broaden the idempotency unique index from 0014 so it also covers
-- kind='tweet' rows keyed by news_item_id. The trigger's ON CONFLICT target
-- predicate below must match this index predicate exactly.
drop index if exists public.timeline_events_news_item_id_unique;
create unique index timeline_events_news_item_id_unique
  on public.timeline_events (news_item_id)
  where kind in ('news', 'tweet') and news_item_id is not null;

-- (3) Replace the mirror trigger function: branch `kind` on `source_code`.
-- Preserves SECURITY DEFINER + ON CONFLICT DO NOTHING semantics from 0014.
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
    -- new tweet-like source (e.g. a future ELON / TWEET_X code).
    v_kind := case new.source_code
      when 'TRUMP' then 'tweet'
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
      where kind in ('news', 'tweet') and news_item_id is not null
    do nothing;
  end if;
  return new;
end;
$$;
