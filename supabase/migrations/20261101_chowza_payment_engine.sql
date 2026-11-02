-- Chowza Payment Engine
-- Adds payment breakdown metadata to orders.
-- Existing PayFast/Yoco fields and RLS policies are preserved.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_gross numeric,
  ADD COLUMN IF NOT EXISTS payment_commission numeric,
  ADD COLUMN IF NOT EXISTS payment_restaurant_amount numeric,
  ADD COLUMN IF NOT EXISTS payment_commission_percent numeric,
  ADD COLUMN IF NOT EXISTS payment_completed_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'orders_payment_gross_check'
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_payment_gross_check
      CHECK (payment_gross IS NULL OR payment_gross >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'orders_payment_commission_check'
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_payment_commission_check
      CHECK (payment_commission IS NULL OR payment_commission >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'orders_payment_restaurant_amount_check'
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_payment_restaurant_amount_check
      CHECK (payment_restaurant_amount IS NULL OR payment_restaurant_amount >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'orders_payment_commission_percent_check'
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_payment_commission_percent_check
      CHECK (
        payment_commission_percent IS NULL
        OR (
          payment_commission_percent >= 0
          AND payment_commission_percent <= 100
        )
      );
  END IF;
END
$$;
