
-- Vault RPC functions for API key management (user-scoped via auth.uid())

-- Store API key in vault (upsert pattern, scoped to user)
CREATE OR REPLACE FUNCTION public.store_api_key(p_name text, p_value text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_secret_name text;
  v_existing_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  v_secret_name := v_user_id::text || ':' || p_name;

  SELECT id INTO v_existing_id
  FROM vault.secrets
  WHERE name = v_secret_name;

  IF v_existing_id IS NOT NULL THEN
    UPDATE vault.secrets SET secret = p_value, updated_at = now()
    WHERE id = v_existing_id;
  ELSE
    INSERT INTO vault.secrets (name, secret)
    VALUES (v_secret_name, p_value);
  END IF;
END;
$$;

-- Read API key from vault (returns decrypted value, user-scoped)
CREATE OR REPLACE FUNCTION public.get_api_key(p_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_result text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT decrypted_secret INTO v_result
  FROM vault.decrypted_secrets
  WHERE name = v_user_id::text || ':' || p_name;

  RETURN v_result;
END;
$$;

-- Check which keys exist (returns name->boolean map)
CREATE OR REPLACE FUNCTION public.check_api_keys(p_names text[])
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_result jsonb := '{}'::jsonb;
  v_name text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  FOREACH v_name IN ARRAY p_names LOOP
    v_result := v_result || jsonb_build_object(
      v_name,
      EXISTS(SELECT 1 FROM vault.secrets WHERE name = v_user_id::text || ':' || v_name)
    );
  END LOOP;

  RETURN v_result;
END;
$$;

-- Delete an API key
CREATE OR REPLACE FUNCTION public.delete_api_key(p_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  DELETE FROM vault.secrets WHERE name = auth.uid()::text || ':' || p_name;
END;
$$;
