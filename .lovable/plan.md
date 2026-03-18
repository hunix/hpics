

## What You're Seeing & What's Missing

### Current State

You're on the landing page (`/`) which shows a basic "PICS" splash screen with a "Get Started" button. All the HoC integration, API key management, and gateway configuration already exist but are buried inside **Settings → API Keys & Vault → Inbound Access** section. The user needs to:
1. Log in
2. Navigate to Settings
3. Click "API Keys & Vault" in the sidebar
4. Scroll to the "Inbound Access" section

This is not discoverable enough. Additionally, there's no dedicated **HoC Integration page** that consolidates everything an HoC agent needs: gateway URL, API key generation, available tools/workflows, connection status, and setup instructions.

### What Needs to Be Built

#### 1. Dedicated HoC Integration Hub Page (`/hoc-integration`)

A new page accessible from the sidebar under the "System" category that provides a single-page setup guide for connecting HoC Republic to HPICS. It will display:

- **Gateway Endpoint URL** (copy-to-clipboard): `https://yibszncvwmefwamayfty.supabase.co/functions/v1/hoc-gateway`
- **API Key Generation** — reuse the existing `InboundApiKeys` component or a streamlined version
- **Connection Requirements Checklist**: 
  - Gateway URL
  - API Key (Bearer token)
  - Available actions: `run-workflow`, `resolve-contact`, `list-workflows`, plus all 400+ individual tools
- **Available Workflows** — display the 8 autonomous workflows (full-intelligence, generate-dossier, track-contact, counter-intel-scan, quick-profile, verified-dossier, deep-research, adversarial-assessment, vulnerability-defense)
- **Tool Categories** — list all 15 categories with tool counts
- **Live Connection Test** — button that calls `?healthCheck=1` on the gateway and shows status
- **Code Examples** — curl/JS snippets for common operations

#### 2. Add to Navigation

Add "HoC Integration" to `navigationConfig.ts` under `system` category and add the route to `App.tsx`.

#### 3. Improve Landing Page

Update the Index page to show "HPICS" instead of "PICS" and include a brief mention of the platform's capabilities.

### Files to Create

| File | Purpose |
|------|---------|
| `src/pages/HocIntegration.tsx` | Dedicated HoC integration hub with setup guide, gateway URL, key generation, workflow listing, and connection testing |

### Files to Modify

| File | Change |
|------|--------|
| `src/lib/navigationConfig.ts` | Add HoC Integration nav item under system category |
| `src/App.tsx` | Add `/hoc-integration` route |
| `src/pages/Index.tsx` | Update branding from "PICS" to "HPICS" |

### Technical Details

- The HoC Integration page will import and reuse the existing `InboundApiKeys` component for key management
- Gateway health check will use `fetch()` to `hoc-gateway?healthCheck=1`
- Workflow and tool category data will be hardcoded from the known `ROUTE_MAP` in `hoc-gateway/index.ts` (15 categories, 400+ tools, 9 workflows)
- Connection test will verify both gateway reachability and API key validity

