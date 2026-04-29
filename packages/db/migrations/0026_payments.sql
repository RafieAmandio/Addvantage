-- payments table for tracking invoices and payment lifecycle
create table if not exists payments (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references profiles(id) on delete cascade,
  external_id  text,
  external_ref text unique not null,
  provider     text not null,
  amount       numeric not null,
  currency     text not null default 'IDR',
  status       text not null default 'pending',
  tier         text not null,
  invoice_url  text,
  description  text,
  paid_at      timestamptz,
  expired_at   timestamptz,
  metadata     jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index idx_payments_profile_created on payments (profile_id, created_at desc);
create index idx_payments_status on payments (status);
create index idx_payments_external_id on payments (external_id);

-- RLS: users can read own payments, admins can read all
alter table payments enable row level security;

create policy "Users can read own payments"
  on payments for select
  using (profile_id = auth.uid() or public.is_admin());

create policy "Service role full access on payments"
  on payments for all
  using (true)
  with check (true);

alter table payments force row level security;

-- Grant the service role bypass (for API server writes)
grant all on payments to service_role;
