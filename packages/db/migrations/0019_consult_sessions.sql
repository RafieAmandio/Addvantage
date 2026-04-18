-- 0019_consult_sessions.sql
-- Section 2 M2 / Section 3 "Message persistence" — move `/app/consult` from
-- localStorage-only to Supabase-backed persistence.
--
-- Two tables (sessions + messages) so each session has a stable id for
-- URL sharing (`?sq=`) + pagination + cascade-delete of messages. Ownership
-- is enforced by RLS (user_id = auth.uid()).

create table public.consult_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'New session',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index consult_sessions_user_updated_idx
  on public.consult_sessions (user_id, updated_at desc);

create table public.consult_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.consult_sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null check (length(content) between 1 and 10000),
  created_at timestamptz not null default now()
);
create index consult_messages_session_created_idx
  on public.consult_messages (session_id, created_at asc);
-- FK coverage for the user_id → profiles reference (per 0010 convention).
create index consult_messages_user_idx
  on public.consult_messages (user_id);

alter table public.consult_sessions enable row level security;
alter table public.consult_messages enable row level security;

-- RLS: user owns their rows. (select auth.uid()) per tick-73 convention to
-- avoid per-row re-evaluation.
create policy consult_sessions_owner_select on public.consult_sessions
  for select to authenticated
  using (user_id = (select auth.uid()));
create policy consult_sessions_owner_insert on public.consult_sessions
  for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy consult_sessions_owner_update on public.consult_sessions
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy consult_sessions_owner_delete on public.consult_sessions
  for delete to authenticated
  using (user_id = (select auth.uid()));

create policy consult_messages_owner_select on public.consult_messages
  for select to authenticated
  using (user_id = (select auth.uid()));
create policy consult_messages_owner_insert on public.consult_messages
  for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy consult_messages_owner_delete on public.consult_messages
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- Touch parent session updated_at on new message insert, so list ordering
-- stays correct without the client having to issue a second UPDATE.
create or replace function public.touch_consult_session()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.consult_sessions
    set updated_at = now()
    where id = NEW.session_id;
  return NEW;
end;
$$;

create trigger consult_messages_touch_session
  after insert on public.consult_messages
  for each row execute function public.touch_consult_session();
