-- Business-owned PayFast credentials.
-- Raw Merchant Key and passphrase are stored only in Supabase Vault.
-- The business table stores Vault secret IDs and the non-secret Merchant ID.

create or replace function public.get_business_payfast_connection_status(p_business_id uuid)
returns table (is_enabled boolean, payfast_mode text, merchant_id_configured boolean)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.businesses b
    where b.id = p_business_id and b.owner_id = auth.uid()
  ) then
    raise exception 'Not authorised to access this business payment connection.';
  end if;

  return query
  select coalesce(c.is_enabled, false), coalesce(c.payfast_mode, 'test'),
         coalesce(nullif(c.payfast_merchant_id, ''), '') <> ''
  from (select 1) seed
  left join public.business_payment_connections c
    on c.business_id = p_business_id and c.provider = 'payfast';
end;
$$;

create or replace function public.save_business_payfast_config(
  p_business_id uuid,
  p_merchant_id text,
  p_merchant_key text,
  p_passphrase text,
  p_mode text default 'test',
  p_enabled boolean default false
)
returns void
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  v_connection public.business_payment_connections%rowtype;
  v_key_id uuid;
  v_passphrase_id uuid;
begin
  if auth.uid() is null or not exists (
    select 1 from public.businesses b
    where b.id = p_business_id and b.owner_id = auth.uid()
  ) then
    raise exception 'Not authorised to update this business payment connection.';
  end if;

  if p_merchant_id is null or p_merchant_id !~ '^[0-9]+$' then
    raise exception 'Merchant ID must contain digits only.';
  end if;
  if coalesce(trim(p_merchant_key), '') = '' or coalesce(p_passphrase, '') = '' then
    raise exception 'Merchant Key and passphrase are required.';
  end if;
  if p_mode not in ('test', 'live') then
    raise exception 'Invalid PayFast mode.';
  end if;

  select * into v_connection
  from public.business_payment_connections
  where business_id = p_business_id and provider = 'payfast'
  limit 1;

  if v_connection.payfast_merchant_key_id is not null then
    perform vault.update_secret(v_connection.payfast_merchant_key_id, p_merchant_key);
    v_key_id := v_connection.payfast_merchant_key_id;
  else
    v_key_id := vault.create_secret(p_merchant_key, 'payfast_key_' || p_business_id::text, 'Business PayFast Merchant Key');
  end if;

  if v_connection.payfast_passphrase_id is not null then
    perform vault.update_secret(v_connection.payfast_passphrase_id, p_passphrase);
    v_passphrase_id := v_connection.payfast_passphrase_id;
  else
    v_passphrase_id := vault.create_secret(p_passphrase, 'payfast_passphrase_' || p_business_id::text, 'Business PayFast passphrase');
  end if;

  if v_connection.id is null then
    insert into public.business_payment_connections (
      business_id, provider, is_enabled, payfast_mode, payfast_merchant_id,
      payfast_merchant_key_id, payfast_passphrase_id, created_at, updated_at
    ) values (
      p_business_id, 'payfast', p_enabled, p_mode, p_merchant_id,
      v_key_id, v_passphrase_id, now(), now()
    );
  else
    update public.business_payment_connections
    set is_enabled = p_enabled,
        payfast_mode = p_mode,
        payfast_merchant_id = p_merchant_id,
        payfast_merchant_key_id = v_key_id,
        payfast_passphrase_id = v_passphrase_id,
        updated_at = now()
    where id = v_connection.id;
  end if;
end;
$$;

revoke all on function public.get_business_payfast_connection_status(uuid) from public;
grant execute on function public.get_business_payfast_connection_status(uuid) to authenticated;
revoke all on function public.save_business_payfast_config(uuid,text,text,text,text,boolean) from public;
grant execute on function public.save_business_payfast_config(uuid,text,text,text,text,boolean) to authenticated;
