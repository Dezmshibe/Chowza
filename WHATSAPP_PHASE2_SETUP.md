# Chowza WhatsApp Embedded Signup — Phase 2 patch

This patch adds the first React + Supabase Edge Function implementation for Meta WhatsApp Embedded Signup v4.

## Frontend environment variables (Render)

Set these in the Render service environment:

- `VITE_META_APP_ID=1379262017519584`
- `VITE_META_EMBEDDED_SIGNUP_CONFIG_ID=837284746144571`
- `VITE_META_GRAPH_API_VERSION=v25.0`

The App ID and configuration ID are public identifiers. Do not put the Meta App Secret in any `VITE_` variable.

## Supabase Edge Function secrets

In Supabase Dashboard → Edge Functions → Secrets, set:

- `META_APP_ID=1379262017519584`
- `META_APP_SECRET=<your Meta App Secret>`
- `META_GRAPH_API_VERSION=v25.0`

Do not send the App Secret to ChatGPT or commit it to Git.

The function also requires the standard Supabase secrets already used by the project:
`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.

## Deploy

From the project root:

```powershell
supabase functions deploy whatsapp-connect
```

The function is configured with `verify_jwt = true` in `supabase/config.toml`.

## Important deployment checks

1. Confirm the Meta app's Facebook Login for Business JavaScript SDK settings include the deployed Chowza HTTPS domain.
2. Confirm the Meta App is allowed to use the configured Embedded Signup v4 configuration.
3. The customer must be the owner of the selected Chowza business (or an admin) to connect/disconnect it.
4. The backend exchanges the short-lived authorization code, validates the resulting token, confirms the selected phone number belongs to the WABA, subscribes the app to that WABA, and stores the token through the Phase 1 Vault RPC.
5. This patch does not implement the inbound webhook receiver or outgoing WhatsApp messaging yet. WABA subscription will only deliver events once a valid Meta webhook callback is configured and deployed.
6. Test first with a Meta app role/test business. Production onboarding remains subject to Meta Tech Provider status, App Review and Advanced Access requirements.

## Files changed

- `src/components/BusinessSettings.tsx` — adds the WhatsApp connection card.
- `src/components/WhatsAppConnectionCard.tsx` — Embedded Signup v4 SDK, event listener, status display and disconnect UI.
- `supabase/functions/whatsapp-connect/index.ts` — authenticated ownership checks, server-side token exchange/validation, WABA subscription and Vault storage.
