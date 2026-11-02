-- Chowza Payment Engine
-- Marketplace payment metadata for online orders.
-- Safe to run repeatedly: columns are added only when missing.

alter table public.orders
  add column if not exists payment_gross numeric(12,2),
  add column if not exists payment_commission numeric(12,2),
  add column if not exists payment_restaurant_amount numeric(12,2),
  add column if not exists payment_commission_percent numeric(5,2),
  add column if not exists payment_completed_at timestamptz;

-- Keep payment amounts mathematically safe.
alter table public.orders
  drop constraint if exists orders_payment_gross_nonnegative,
  drop constraint if exists orders_payment_commission_nonnegative,
  drop constraint if exists orders_payment_restaurant_amount_nonnegative,
  drop constraint if exists orders_payment_commission_percent_valid;

alter table public.orders
  add constraint orders_payment_gross_nonnegative
    check (payment_gross is null or payment_gross >= 0),
  add constraint orders_payment_commission_nonnegative
    check (payment_commission is null or payment_commission >= 0),
  add constraint orders_payment_restaurant_amount_nonnegative
    check (payment_restaurant_amount is null or payment_restaurant_amount >= 0),
  add constraint orders_payment_commission_percent_valid
    check (
      payment_commission_percent is null
      or (
        payment_commission_percent >= 0
        and payment_commission_percent <= 100
      )
    );

create index if not exists orders_payment_status_idx
  on public.orders(payment_status);

comment on column public.orders.payment_gross is
  'Gross amount charged to the customer for an online payment.';
comment on column public.orders.payment_commission is
  'Chowza marketplace commission amount for the online payment.';
comment on column public.orders.payment_restaurant_amount is
  'Business share of the online payment after the Chowza commission.';
comment on column public.orders.payment_commission_percent is
  'Chowza marketplace commission percentage used for this payment.';
comment on column public.orders.payment_completed_at is
  'Timestamp when the verified payment was completed.';
