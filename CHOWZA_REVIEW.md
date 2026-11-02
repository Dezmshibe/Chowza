# Chowza V2 — Review & Correction Report

Reviewed the uploaded Chowza source archive with a focus on:

- Customer storefront and checkout layout
- Cart and order-summary visibility
- Brand colours and contrast
- Responsive positioning
- SSR/client rendering behaviour
- Payment-flow source consistency
- CSRF configuration
- Server browser-security headers
- Publicly exposed source/build artifacts
- Duplicate/stale Supabase function files

## Corrections made

### 1. Cart and checkout visibility
The business portal CSS was targeting every HTML `<aside>` in the application. Customer cart and checkout components also use `<aside>`, so they were being forced onto the dark green business-sidebar background.

The business portal styles are now scoped to `.business-sidebar`, and `BusinessAreaLayout` uses that class.

Result: customer cart and checkout summaries keep their intended white surfaces and readable text.

### 2. SSR hydration mismatch
The server-rendered business page intentionally has different markup from the interactive customer store. Hydrating that markup could produce React hydration mismatch errors.

The client now mounts the interactive application instead of hydrating the different SSR shell. The server-rendered HTML remains useful for SEO before the client takes over.

### 3. Production CSRF origin
The production Chowza Render origin was added to the CSRF allowed-origin list:

`https://chowza-jku1.onrender.com`

### 4. CSRF token endpoint
The Supabase configuration includes the public `csrf-token` function with JWT verification disabled, matching the token bootstrap flow.

### 5. Payment-engine source consistency
The Supabase deployment function tree and the duplicate source function tree were synchronized so the PayFast payment functions are no longer represented by two different implementations.

Stale non-entrypoint PayFast ITN helper copies were removed.

### 6. Payment-engine migration
The payment migration was corrected to match the payment fields used by the current payment engine:

- `payment_gross`
- `payment_commission`
- `payment_restaurant_amount`
- `payment_commission_percent`
- `payment_completed_at`

Basic non-negative and percentage constraints were included.

### 7. Payment return pages
The success/cancelled/failed return handling was made explicit. The success page no longer treats a browser redirect alone as proof that payment completed; the verified PayFast ITN remains the source of truth.

### 8. Browser security headers
The Express server now sends:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

`X-Powered-By` is also disabled.

### 9. Public artifact cleanup
Legacy source-code artifacts that had been placed under the web `public/` directory were removed. The actual Android project remains in the project-level `android/` directory.

### 10. Visual consistency
The customer storefront/checkout was normalised toward the existing Chowza green/white design system. Low-contrast business-sidebar text was improved, and the old beige placeholder/hover colours were replaced with the current green/white palette.

## Items that still require verification in the real project

### Supabase RLS
The archive does not contain the complete database RLS/policy definition. RLS therefore cannot be fully audited from this archive alone. The production Supabase database should be checked to confirm that:

- customers can read only published storefront/menu data;
- businesses can access only their own business, menu and orders;
- one business cannot read another business's private orders;
- admin operations require the intended authenticated role;
- payment configuration and Vault RPCs cannot be called by ordinary customers.

### Yoco webhook
The archived `yoco-webhook` entrypoint is empty. PayFast is the working payment path, but Yoco should either be fully implemented and tested or explicitly removed/disabled until needed.

### Full build
A full `npm run build` could not be completed inside the isolated review environment because the archive's dependency installation did not finish. Run the normal build in `C:\chowza v2` after replacing the files:

```powershell
npm install
npm run build
```

Do not deploy the archive until that build passes.
