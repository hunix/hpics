

## Plan: Production-Grade API Keys & Integrations Management Page

### Current State Assessment

The project already has a solid integration management system:
- `src/lib/integrations/registry.ts` — master registry with 8 categories and ~18 integrations
- `src/components/settings/UnifiedIntegrationSettings.tsx` — existing UI with collapsible cards, secret status checks, save flow
- `supabase/functions/utility-router` — routes for `save-secret` and `check-secrets` (but these are generic stubs that don't actually interact with Vault)
- No Supabase Vault (`vault.secrets`) integration exists yet — secrets are saved via edge function invocation but there's no actual Vault RPC

The request asks to build a comprehensive API Keys page with 7 new integration categories (LLM Providers, HPICS Bridge, Supabase Data Layer, OSINT, Voice/Biometric, Communications, Hardware Intelligence) with Vault-backed persistence, readback verification, and connection testing.

### Architecture Decisions

1. **Vault Storage**: Create `store_api_key` and `get_api_key` SECURITY DEFINER functions operating on `vault.secrets`. These require the `pgsodium` extension (already available in Supabase). Secrets are scoped per-user via a naming convention: `{user_id}:{secret_name}`.

2. **Don't replace existing system**: The existing `UnifiedIntegrationSettings` handles connectors and OSINT. The new page will be a dedicated `/settings` section (`api-keys`) that extends the existing `SettingsNavigation` with the 7 HPICS-specific categories and Vault-backed storage.

3. **Edge Function for connection testing**: Create a dedicated `test-api-key` edge function that performs lightweight validation calls per provider.

### Implementation Plan

#### 1. Database Migration — Vault RPC Functions

Create migration with:

```sql
-- Enable pgsodium if not already enabled
CREATE EXTENSION IF NOT EXISTS pgsodium;

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
```

#### 2. `src/lib/vault.ts` — Vault Read/Write Helpers

TypeScript helper module wrapping the RPC calls with readback verification:

- `saveApiKey(name, value)` — calls `store_api_key`, then `get_api_key` for readback verification
- `getApiKey(name)` — calls `get_api_key`
- `checkApiKeys(names[])` — calls `check_api_keys`, returns `Record<string, boolean>`
- `deleteApiKey(name)` — calls `delete_api_key`
- `saveApiKeys(entries[])` — batch save with readback verification, returns per-key success/failure

#### 3. `src/lib/integrations/api-keys-registry.ts` — 7-Section Key Definitions

Define all 7 sections with their keys, including:
- `envVar`, `label`, `howToGet` (instructions), `portalUrl`, `isUrl` flag, `isSecret` flag
- Model selector definitions (for LLM providers with dropdown options)
- `testable` flag per key for connection testing

Categories: `llm-providers`, `hpics-bridge`, `supabase-layer`, `osint-enrichment`, `voice-biometric`, `communications`, `hardware-intel`

#### 4. `src/pages/settings/ApiKeysPage.tsx` — Main Page

- Status overview grid at top (icon + name + green/red/grey dot per integration)
- "Save All" button in header (visible when any key is dirty)
- 7 tabbed sections
- Uses `useQuery` to load key status via `checkApiKeys` on mount
- Dirty state tracking via `useReducer` or `useState` map
- Post-save verification alert (green/red)

#### 5. `src/components/settings/KeySection.tsx` — Collapsible Section

- Collapsible header with section icon, title, "3/7 set" badge, "2 unsaved" amber badge
- "Save Section" button (appears only when section has dirty keys)
- Maps over keys to render `KeyInput` components

#### 6. `src/components/settings/KeyInput.tsx` — Individual Key Input

- Password input with eye toggle (text input for `isUrl` keys)
- "Saved" (green) / "Unsaved" (amber) badge
- Expandable "How to generate" instructions
- "Get key →" external link
- "Test" button (where `testable: true`)
- Model selector dropdown (for LLM providers)
- Skeleton loading state

#### 7. Edge Function: `test-api-key/index.ts`

Lightweight provider validation:
- **Anthropic**: `POST /v1/messages` with tiny prompt
- **OpenAI**: `GET /v1/models`
- **Gemini**: `GET /v1beta/models?key=...`
- **Groq**: `GET /openai/v1/models`
- **ElevenLabs**: `GET /v1/user`
- **PDL**: `GET /v5/person/enrich?email=test`
- **HuggingFace**: `GET /api/whoami-v2`
- **Deepgram**: `GET /v1/projects`
- Returns `{ success, message, responseTime }`

#### 8. Wire Into Settings Navigation

Add `api-keys` section to `SettingsNavigation.tsx` under the "Integrations" group, and add the route case to `Settings.tsx`.

### Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/migrations/xxx_vault_api_key_functions.sql` | Create — Vault RPC functions |
| `src/lib/vault.ts` | Create — Vault helpers with readback verification |
| `src/lib/integrations/api-keys-registry.ts` | Create — 7-section key definitions (~60 keys) |
| `src/pages/settings/ApiKeysPage.tsx` | Create — Main page with status grid, tabs, save-all |
| `src/components/settings/KeySection.tsx` | Create — Collapsible section component |
| `src/components/settings/KeyInput.tsx` | Create — Individual key input with show/hide, instructions |
| `supabase/functions/test-api-key/index.ts` | Create — Connection test edge function |
| `src/components/settings/SettingsNavigation.tsx` | Modify — Add `api-keys` to Integrations group |
| `src/pages/Settings.tsx` | Modify — Add `api-keys` case to `renderContent` |

