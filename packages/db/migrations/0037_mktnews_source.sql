-- 0037_mktnews_source.sql
-- Register the MKT source (mktnews.net flash API — US-relevant market headlines).
-- Flash items flow through the standard news_items -> rephrase -> (auto-)approve
-- pipeline. MKT is a plain news source, so the news->timeline mirror trigger
-- routes it via its default `else 'news'` branch — no trigger change needed.

insert into public.sources (code, name, url, adapter, enabled, poll_minutes)
values (
  'MKT',
  'MKT News — Market Flash',
  'https://www.mktnews.net',
  'mktnews',
  true,
  60
)
on conflict (code) do nothing;
