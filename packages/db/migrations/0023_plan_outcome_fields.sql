-- Outcome tracking (O1) — capture the close price and the realized-R
-- multiple on closed trading plans. Both columns are nullable; they are
-- only populated when an admin closes a plan via `closePlan` (see
-- features/plan/actions.ts). RLS inherits from the existing row policies
-- on `trading_plans` (migration 0021), so no new policy is required.

alter table public.trading_plans
  add column if not exists close_price numeric,
  add column if not exists realized_r numeric;

comment on column public.trading_plans.close_price is
  'Market price at the time the plan was closed by an admin. Null until status=closed.';
comment on column public.trading_plans.realized_r is
  'Realized R multiple: (close_price - entry) / (entry - stop) for longs, flipped for shorts. Null when any of entry/stop/close_price is null.';
