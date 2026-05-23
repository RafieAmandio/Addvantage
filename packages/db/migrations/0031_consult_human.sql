-- 0031_consult_human.sql
-- Convert consultation from AI chat to human-to-human messaging between
-- founders (admins) and paying subscribers.

-- 1. Add session lifecycle columns
alter table public.consult_sessions
  add column status text not null default 'open'
    check (status in ('open', 'awaiting_reply', 'closed')),
  add column unread_admin boolean not null default true,
  add column unread_user boolean not null default false;

create index consult_sessions_status_idx
  on public.consult_sessions (status, updated_at desc);

-- 2. Update role check constraint: 'assistant' → 'admin'
alter table public.consult_messages
  drop constraint consult_messages_role_check;
alter table public.consult_messages
  add constraint consult_messages_role_check
    check (role in ('user', 'admin'));

-- Backfill existing 'assistant' rows to 'admin'
update public.consult_messages set role = 'admin' where role = 'assistant';

-- 3. Fix RLS on consult_messages: users should see all messages in their
--    sessions (not just messages where user_id = auth.uid()), so they can
--    read admin replies.
drop policy consult_messages_owner_select on public.consult_messages;
create policy consult_messages_session_select on public.consult_messages
  for select to authenticated
  using (
    session_id in (
      select id from public.consult_sessions
      where user_id = (select auth.uid())
    )
    or public.is_admin()
  );

-- Admin insert: admins can insert messages into any session
drop policy consult_messages_owner_insert on public.consult_messages;
create policy consult_messages_insert on public.consult_messages
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (
      session_id in (
        select id from public.consult_sessions
        where user_id = (select auth.uid())
      )
      or public.is_admin()
    )
  );

-- Admin select on sessions: admins can see all sessions
create policy consult_sessions_admin_select on public.consult_sessions
  for select to authenticated
  using (public.is_admin());

-- Admin update on sessions: admins can update status/unread flags
create policy consult_sessions_admin_update on public.consult_sessions
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());
