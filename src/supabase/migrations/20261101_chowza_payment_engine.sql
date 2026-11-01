-- Chowza Payment Engine
-- Adds marketplace payment metadata without changing existing order flows.

alter table public.businesses
  add column if not exists payment_enabled boolean not null default true,
  add column if not exists payment_provider text default 'payfast',
  add column if not exists payment_account_status text,
  add column if not exists commission_percent numeric(5,2);

alter table public.businesses
  drop constraint if exists businesses_commission_percent_check;

alter table public.businesses
  add constraint businesses_commission_percent_check
  check (commission_percent is null or (commission_percent >= 0 and commission_percent <= 100));

alter table public.orders
  add column if not exists payment_provider text,
  add column if not exists payment_amount numeric(12,2),
  add column if not exists platform_fee numeric(12,2),
  add column if not exists business_amount numeric(12,2),
  add column if not exists payment_reference text,
  add column if not exists payment_started_at timestamptz,
  add column if not exists payment_completed_at timestamptz;

create index if not exists orders_payment_reference_idx
  on public.orders(payment_reference);

create index if not exists orders_payment_status_idx
  on public.orders(payment_status);

comment on column public.businesses.payment_enabled is
  'Whether Chowza online payments are enabled for this business.';
comment on column public.businesses.payment_provider is
  'Regulated payment provider used by Chowza for this business.';
comment on column public.businesses.commission_percent is
  'Chowza marketplace commission percentage applied to online orders.';
comment on column public.orders.platform_fee is
  'Chowza commission amount for this payment.';
comment on column public.orders.business_amount is
  'Business share of the online payment after Chowza commission.';
