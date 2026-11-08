# Business PayFast settings implementation

Added a Payments & PayFast tool to the authenticated business dashboard. It is scoped to the signed-in business and calls two database RPCs. The migration stores the Merchant Key and passphrase in Supabase Vault and stores only Vault IDs in `business_payment_connections`.

## Apply before testing
1. Review and run `supabase/migrations/20261108_business_payfast_settings.sql` in the Supabase SQL Editor.
2. Confirm your existing `business_payment_connections` table has the columns referenced by the migration: `id`, `business_id`, `provider`, `is_enabled`, `payfast_mode`, `payfast_merchant_id`, `payfast_merchant_key_id`, `payfast_passphrase_id`, `created_at`, `updated_at`.
3. Confirm `vault.update_secret` and `vault.create_secret` are available in your Supabase Vault schema.
4. Run `npm run lint` and `npm run build`.
5. Test using sandbox credentials only.

The feature does not confirm PayFast split settlement. Do not enable live payments until PayFast has confirmed the split-payment arrangement and the Chowza secondary merchant is allowed by the primary restaurant account.
