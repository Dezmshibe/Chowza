# Chowza Payments Engine

## Payment flow

Customer → Chowza Checkout → Chowza Payment Engine → PayFast → Restaurant + Chowza commission

The payment engine does **not** hold restaurant money. PayFast processes the transaction and performs the split between the restaurant's primary PayFast account and Chowza's secondary PayFast account.

## Current implementation

- Customer sees **Chowza Payments** at checkout.
- `create-order` creates the order and validates menu prices server-side.
- `create-payfast-payment` is now the payment-engine entry point.
- The engine calculates:
  - gross customer payment
  - Chowza commission
  - restaurant share
- PayFast receives a Split Payments `setup` payload.
- `payfast-itn` remains the server-to-server payment confirmation endpoint.
- Paid orders record payment completion time.
- Payment amounts are stored on the order for reconciliation.

## Supabase secrets

Set these Edge Function secrets:

```text
PUBLIC_SITE_URL=https://chowza-jku1.onrender.com
CHOWZA_PAYFAST_MERCHANT_ID=<CHOWZA SECONDARY PAYFAST MERCHANT ID>
CHOWZA_COMMISSION_PERCENT=5
```

`CHOWZA_PAYFAST_MERCHANT_ID` is the PayFast merchant ID for the Chowza platform account. Do not put this in frontend code.

The existing business-specific PayFast configuration remains server-side and is loaded through `get_business_payfast_config`.

## Database migration

Run:

```text
supabase/migrations/20261101_chowza_payment_engine.sql
```

It adds payment-engine metadata to `businesses` and `orders` without removing existing payment columns.

## PayFast Split Payments setup

For the first production version, the restaurant is the primary PayFast merchant and Chowza is the secondary split merchant.

Each participating restaurant must have a PayFast account/configuration that Chowza can securely retrieve through the existing `get_business_payfast_config` function.

The primary merchant must enable Split Payments and allow the Chowza secondary merchant ID in PayFast. PayFast's custom Split Payments integration accepts a fixed amount, percentage, or combination. Chowza currently uses a percentage commission.

## Example

For an R200 order with a 5% Chowza commission:

```text
Customer pays                 R200.00
Chowza commission (5%)          R10.00
Restaurant share               R190.00
```

The actual settlement is handled by PayFast. Chowza records the transaction split for reconciliation and reporting.

## Important production requirement

Before enabling live payments, confirm the Split Payments arrangement with PayFast and complete the required merchant/business onboarding and legal/compliance work for the platform model.
