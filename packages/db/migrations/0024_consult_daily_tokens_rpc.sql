-- 0024_consult_daily_tokens_rpc.sql
--
-- Server-side aggregate for RT3 daily token budget. Before: web summed
-- `metadata.total_tokens` across every consult_messages row in the last
-- 24h, pulling the full JSONB over the wire. After: a SECURITY DEFINER
-- function sums server-side and returns one bigint.
--
-- Security: function filters by `auth.uid()` so the caller can only read
-- their own rows; no RLS bypass for other users. `security definer` plus
-- the explicit `auth.uid()` check mean we don't need the client to send
-- `user_id` (and they couldn't spoof it if they did). Grants are limited
-- to authenticated — anon cannot call.

create or replace function public.get_consult_daily_tokens_used()
returns bigint
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select coalesce(
    sum(
      case
        when (cm.metadata ->> 'total_tokens') ~ '^[0-9]+$'
        then (cm.metadata ->> 'total_tokens')::bigint
        else 0
      end
    ),
    0
  )::bigint
  from public.consult_messages cm
  where cm.user_id = auth.uid()
    and cm.created_at >= now() - interval '24 hours';
$$;

revoke all on function public.get_consult_daily_tokens_used() from public;
grant execute on function public.get_consult_daily_tokens_used() to authenticated;
