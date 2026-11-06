-- Secure customer payment initiation
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS payment_token_hash text;

COMMENT ON COLUMN public.orders.payment_token_hash IS
'Hash of the one-time customer payment authorisation token. Never store the raw token.';
