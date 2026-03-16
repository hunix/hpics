

## Plan: HPICS Gateway Endpoint Display, Inbound API Key Management & Usage Tracking

### What's Missing Today

The current API Keys page only manages **outbound** credentials (keys HPICS uses to call external services). It's missing:

1. **Gateway URL display** — The HPICS Gateway URL (`https://yibszncvwmefwamayfty.supabase.co/functions/v1/hoc-gateway`) isn't shown anywhere for users to copy
2. **Inbound API key generation** — No way to create keys for external systems (HoC, bots, etc.) to authenticate with HPICS
3. **Usage tracking** — No visibility into which client is making how many calls

### Implementation

#### 1. Database: `hpics_api_clients` table + `api_usage_logs` table

```sql
-- Issued API keys for external clients
CREATE TABLE public.hpics_api_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,                    -- e.g. "HoC Republic", "My Bot"
  api_key_hash text NOT NULL,            -- SHA-256 hash (never store raw)
  key_prefix text NOT NULL,              -- first 8 chars for display: "hpics_ab12..."
  permissions text[] DEFAULT '{}',       -- optional scoping
  rate_limit_rpm int DEFAULT 60,
  is_active boolean DEFAULT true,
  last_used_at timestamptz,
  total_requests bigint DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  revoked_at timestamptz
);

-- Usage log per request
CREATE TABLE public.api_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.hpics_api_clients(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tool_called text,
  status_code int,
  response_time_ms int,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

-- RLS: users see only their own clients and logs
-- Indexes on client_id, created_at for fast usage queries
```

#### 2. Edge Function: `manage-api-clients/index.ts`

Handles:
- **`generate`** — creates a new API key (returns raw key ONCE, stores only hash)
- **`list`** — returns all clients with stats (never returns raw keys)
- **`revoke`** — deactivates a client key
- **`usage`** — returns aggregated usage stats per client (last 24h, 7d, 30d)

#### 3. Update `hoc-gateway/index.ts`

- Support multiple API keys (not just single `HOC_API_KEY`)
- Look up incoming Bearer token against `hpics_api_clients` table (hash comparison)
- Log each call to `api_usage_logs`
- Update `last_used_at` and `total_requests` on the client record

#### 4. New UI Component: `InboundApiKeys.tsx`

Added as a prominent section at the top of the API Keys page, containing:

- **Gateway Endpoint card** — displays the full HPICS Gateway URL with a copy-to-clipboard button and integration instructions
- **Client API Keys table** — list of issued keys showing: name, key prefix (`hpics_ab12...`), status (active/revoked), created date, last used, total requests, rate limit
- **"Generate New Key" button** — dialog to name the client, then shows the raw key ONCE with a copy button and warning
- **Revoke button** per key
- **Usage sparkline/stats** per client (24h, 7d, 30d call counts)

#### 5. Wire Into `ApiKeysPage.tsx`

Add the `InboundApiKeys` component at the top of the page, before the outbound key sections, with a clear visual separator ("Inbound Access" vs "Outbound Credentials").

### Files to Create/Modify

| File | Action |
|------|--------|
| Migration SQL | Create `hpics_api_clients` + `api_usage_logs` tables with RLS |
| `supabase/functions/manage-api-clients/index.ts` | Create — generate/list/revoke/usage endpoints |
| `supabase/functions/hoc-gateway/index.ts` | Modify — multi-key auth + usage logging |
| `src/components/settings/InboundApiKeys.tsx` | Create — gateway URL display + client key management UI |
| `src/pages/settings/ApiKeysPage.tsx` | Modify — add InboundApiKeys at top |

