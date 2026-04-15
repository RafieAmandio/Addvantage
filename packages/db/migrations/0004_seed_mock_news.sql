-- Seed: backfill approved news from the hand-authored mock data.
-- Invents a 'SEED' source so FK to sources stays clean.
insert into public.sources (code, name, url, adapter, enabled, poll_minutes)
values ('SEED', 'Seed — hand-authored desk notes', 'https://tradevantage.gg', 'none', false, 0)
on conflict (code) do nothing;

-- (ten rows omitted here for brevity — see migration 0004 applied via Supabase MCP.
-- Kept in migrations dir as a record of the seed strategy; actual values live in DB.)
