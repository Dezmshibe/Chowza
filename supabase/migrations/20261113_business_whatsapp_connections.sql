-- Chowza: business-owned WhatsApp Cloud API connections.
-- Public metadata is visible to the owning business and trusted admins.
-- Access tokens are stored in Supabase Vault; only the private schema stores
-- the Vault secret UUID. No client-side role can read or write credentials.
-- Apply only after confirming the Supabase Vault extension is available.

DO $$
BEGIN
  IF to_regnamespace('vault') IS NULL THEN
    RAISE EXCEPTION 'Supabase Vault is not available. Enable the Vault extension before applying this migration.';
  END IF;
END;
$$;

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS public.business_whatsapp_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL UNIQUE
    REFERENCES public.businesses(id) ON DELETE CASCADE,
  waba_id text UNIQUE,
  phone_number_id text UNIQUE,
  display_phone_number text,
  verified_name text,
  connection_status text NOT NULL DEFAULT 'disconnected'
    CHECK (connection_status IN (
      'pending',
      'connected',
      'disconnected',
      'reauthorization_required',
      'error'
    )),
  is_enabled boolean NOT NULL DEFAULT false,
  connected_at timestamptz,
  last_webhook_at timestamptz,
  last_error_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.business_whatsapp_connections IS
  'Non-secret WhatsApp Cloud API connection metadata, isolated per Chowza business.';
COMMENT ON COLUMN public.business_whatsapp_connections.waba_id IS
  'Meta WhatsApp Business Account ID; not an access token.';
COMMENT ON COLUMN public.business_whatsapp_connections.phone_number_id IS
  'Meta WhatsApp Cloud API phone number ID; not the public phone number.';

CREATE TABLE IF NOT EXISTS private.business_whatsapp_credentials (
  business_id uuid PRIMARY KEY
    REFERENCES public.businesses(id) ON DELETE CASCADE,
  access_token_secret_id uuid NOT NULL,
  token_expires_at timestamptz,
  granted_scopes text[] NOT NULL DEFAULT ARRAY[]::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

REVOKE ALL ON TABLE private.business_whatsapp_credentials
  FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE private.business_whatsapp_credentials TO service_role;

ALTER TABLE public.business_whatsapp_connections ENABLE ROW LEVEL SECURITY;

-- The browser may read connection status and display metadata only.
-- All writes are performed by authenticated Edge Functions using service_role.
DROP POLICY IF EXISTS "Owners can view their WhatsApp connection"
  ON public.business_whatsapp_connections;
CREATE POLICY "Owners can view their WhatsApp connection"
  ON public.business_whatsapp_connections
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.businesses b
      WHERE b.id = business_whatsapp_connections.business_id
        AND b.owner_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admins can view all WhatsApp connections"
  ON public.business_whatsapp_connections;
CREATE POLICY "Admins can view all WhatsApp connections"
  ON public.business_whatsapp_connections
  FOR SELECT TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

REVOKE ALL ON TABLE public.business_whatsapp_connections
  FROM PUBLIC, anon;
GRANT SELECT ON TABLE public.business_whatsapp_connections TO authenticated;
GRANT ALL ON TABLE public.business_whatsapp_connections TO service_role;

-- Store or rotate a token in Vault. This RPC is service-role only and must be
-- called by a trusted Edge Function after validating the business owner.
CREATE OR REPLACE FUNCTION public.store_business_whatsapp_token(
  p_business_id uuid,
  p_access_token text,
  p_token_expires_at timestamptz DEFAULT NULL,
  p_granted_scopes text[] DEFAULT ARRAY[]::text[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_secret_id uuid;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Not authorised to store WhatsApp credentials.';
  END IF;

  IF p_business_id IS NULL
     OR p_access_token IS NULL
     OR length(trim(p_access_token)) < 20 THEN
    RAISE EXCEPTION 'A valid business ID and access token are required.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.businesses b WHERE b.id = p_business_id
  ) THEN
    RAISE EXCEPTION 'Business not found.';
  END IF;

  SELECT c.access_token_secret_id
    INTO v_secret_id
  FROM private.business_whatsapp_credentials c
  WHERE c.business_id = p_business_id;

  IF v_secret_id IS NULL THEN
    v_secret_id := vault.create_secret(
      p_access_token,
      'whatsapp_access_token_' || p_business_id::text,
      'Chowza business WhatsApp Cloud API access token'
    );
  ELSE
    PERFORM vault.update_secret(v_secret_id, p_access_token);
  END IF;

  INSERT INTO private.business_whatsapp_credentials (
    business_id,
    access_token_secret_id,
    token_expires_at,
    granted_scopes,
    created_at,
    updated_at
  ) VALUES (
    p_business_id,
    v_secret_id,
    p_token_expires_at,
    COALESCE(p_granted_scopes, ARRAY[]::text[]),
    now(),
    now()
  )
  ON CONFLICT (business_id) DO UPDATE
    SET access_token_secret_id = EXCLUDED.access_token_secret_id,
        token_expires_at = EXCLUDED.token_expires_at,
        granted_scopes = EXCLUDED.granted_scopes,
        updated_at = now();
END;
$$;

-- Retrieve a decrypted token only for a trusted server-side Edge Function.
CREATE OR REPLACE FUNCTION public.get_business_whatsapp_token(
  p_business_id uuid
)
RETURNS TABLE (
  access_token text,
  token_expires_at timestamptz,
  granted_scopes text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Not authorised to retrieve WhatsApp credentials.';
  END IF;

  RETURN QUERY
  SELECT
    ds.decrypted_secret::text,
    c.token_expires_at,
    c.granted_scopes
  FROM private.business_whatsapp_credentials c
  JOIN vault.decrypted_secrets ds
    ON ds.id = c.access_token_secret_id
  WHERE c.business_id = p_business_id;
END;
$$;

-- Remove the Vault secret as well as its private reference on disconnect.
CREATE OR REPLACE FUNCTION public.delete_business_whatsapp_token(
  p_business_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_secret_id uuid;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Not authorised to delete WhatsApp credentials.';
  END IF;

  SELECT c.access_token_secret_id
    INTO v_secret_id
  FROM private.business_whatsapp_credentials c
  WHERE c.business_id = p_business_id;

  DELETE FROM private.business_whatsapp_credentials
  WHERE business_id = p_business_id;

  IF v_secret_id IS NOT NULL THEN
    DELETE FROM vault.secrets WHERE id = v_secret_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.store_business_whatsapp_token(uuid, text, timestamptz, text[])
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_business_whatsapp_token(uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.delete_business_whatsapp_token(uuid)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.store_business_whatsapp_token(uuid, text, timestamptz, text[])
  TO service_role;
GRANT EXECUTE ON FUNCTION public.get_business_whatsapp_token(uuid)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_business_whatsapp_token(uuid)
  TO service_role;
