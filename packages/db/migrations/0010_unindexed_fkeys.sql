-- 0010_unindexed_fkeys.sql
-- Address Supabase advisor `unindexed_foreign_keys` (INFO) on the two
-- remaining unindexed FKs in public schema:
--   * news_items.reviewed_by → profiles(id)
--   * telegram_admins.profile_id → profiles(id)
-- Both are nullable / sparsely populated, so partial indexes are sufficient
-- and keep the index small.

create index if not exists news_items_reviewed_by_idx
  on public.news_items (reviewed_by)
  where reviewed_by is not null;

create index if not exists telegram_admins_profile_id_idx
  on public.telegram_admins (profile_id)
  where profile_id is not null;
