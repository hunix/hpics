

# HPICS-HoC Integration Layer: Bridge Plan

## Overview

This plan creates a two-part integration between the HPICS Intelligence Platform and the HoC Republic (OpenClaw-based agentic AI civilization):

1. **HPICS Side (built here)**: A new `hoc-gateway` edge function that exposes all 400+ HPICS capabilities as a single authenticated REST API designed for tool-calling agents.

2. **HoC Side (documentation + skill template)**: A complete OpenClaw skill (`hpics-intelligence`) and documentation you'll place into your HoC workspace so agents can call HPICS tools natively.

## Architecture

```text
HoC Agent (OpenClaw)                         HPICS Platform (Lovable Cloud)
+---------------------------+                +------------------------------------+
|  OpenClaw Gateway         |                |  Supabase Edge Functions           |
|  +---------------------+ |   HTTPS/JSON   |  +------------------------------+ |
|  | hpics-intelligence   |----(Bearer)----->|  | hoc-gateway                  | |
|  | skill (SKILL.md)     | |                |  |  - API key validation        | |
|  +---------------------+ |                |  |  - Route to domain routers   | |
|  | exec: curl/fetch     | |                |  |  - Rate limiting             | |
|  +---------------------+ |                |  |  - Response normalization    | |
+---------------------------+                |  +------------------------------+ |
                                             |            |                      |
                                             |    +-------v-------+              |
                                             |    | Domain Routers |             |
                                             |    | (15 Hono apps) |             |
                                             |    +---------------+              |
                                             +------------------------------------+
```

## What Gets Built

### Part 1: `hoc-gateway` Edge Function (HPICS Side)

A single edge function that acts as the external API gateway for HoC agents. It:

- Authenticates via a shared API key (stored as `HOC_API_KEY` secret)
- Accepts a uniform JSON payload: `{ "tool": "<function-name>", "params": { ... } }`
- Routes internally to the correct domain router using the existing `ROUTE_MAP`
- Supports `POST /hoc-gateway` for tool execution and `GET /hoc-gateway?action=list-tools` for tool discovery
- Rate limits per-key (60 requests/minute default)
- Returns normalized responses: `{ "success": boolean, "data": ..., "error": ..., "meta": { "duration_ms": ..., "router": ... } }`

Endpoints:
- `POST /hoc-gateway` with `{ "tool": "mice-recruitment-analyzer", "params": { "profileId": "...", "userId": "..." } }` -- executes the tool
- `POST /hoc-gateway` with `{ "action": "list-tools" }` -- returns full tool catalog with categories
- `POST /hoc-gateway` with `{ "action": "health" }` -- returns gateway and router health
- `POST /hoc-gateway` with `{ "action": "list-categories" }` -- returns available categories

### Part 2: Documentation File (HPICS Side)

A comprehensive `docs/HOC_INTEGRATION_GUIDE.md` covering:

- How to configure the `HOC_API_KEY` secret
- How to install the skill in HoC
- Complete tool catalog (all 400+ tools organized by domain router)
- Request/response formats with examples
- Rate limits and error handling
- How to extend, maintain, and debug
- How to build custom HoC-side wrappers

### Part 3: OpenClaw Skill Template (HPICS Side, for copy to HoC)

A `docs/hoc-skill-template/SKILL.md` file in AgentSkills format that:

- Declares the `hpics-intelligence` skill
- Requires `HPICS_API_KEY` and `HPICS_BASE_URL` environment variables
- Teaches the HoC agent how to use `web_fetch` or `exec` (curl) to call the gateway
- Lists all available tool categories and key tools
- Includes example invocations for common workflows

## Technical Details

### `hoc-gateway` Edge Function Implementation

```text
supabase/functions/hoc-gateway/index.ts

Flow:
1. OPTIONS -> CORS response
2. Parse body -> validate API key from Authorization header
3. If action=list-tools -> return ROUTE_MAP as categorized tool list
4. If action=health -> fan-out health checks to routers
5. If tool=<name> -> look up in ROUTE_MAP -> invoke domain router
6. Return normalized { success, data, error, meta }
```

Key design decisions:
- Uses the `ROUTE_MAP` from `edgeFunctionRouter.ts` (rebuilt server-side as a const map) so tool names stay in sync
- API key auth (not JWT) since HoC agents are external systems, not platform users
- The `HOC_API_KEY` secret will be requested from the user
- UserId is passed in params (trusted since this is service-to-service with API key)
- Timeout: 120s default, configurable per-call via `params.timeout_ms`

### OpenClaw Skill Format

```yaml
---
name: hpics-intelligence
description: Access the HPICS Intelligence Platform for behavioral analysis, biometric processing, network intelligence, warfare simulation, predictions, and 400+ specialized AI engines.
metadata:
  {
    "openclaw": {
      "requires": { "env": ["HPICS_API_KEY", "HPICS_BASE_URL"] },
      "primaryEnv": "HPICS_API_KEY"
    }
  }
---
```

The skill body teaches the agent to use `web_fetch` with:
```text
POST ${HPICS_BASE_URL}/functions/v1/hoc-gateway
Authorization: Bearer ${HPICS_API_KEY}
Content-Type: application/json

{ "tool": "<tool-name>", "params": { ... } }
```

### Tool Catalog Structure (in list-tools response)

```json
{
  "categories": {
    "analysis": { 
      "description": "50+ behavioral, psychological, and pattern analysis engines",
      "tools": ["mice-recruitment-analyzer", "behavioral-dna-sequencer", ...] 
    },
    "intelligence": { "description": "...", "tools": [...] },
    "prediction": { ... },
    "warfare": { ... },
    "biometric": { ... },
    "network": { ... },
    "enrichment": { ... },
    "fusion": { ... },
    "agis": { ... },
    "utility": { ... },
    "hardware": { ... },
    "voice": { ... },
    "document": { ... },
    "security": { ... },
    "media": { ... }
  }
}
```

### Security Model

- API key rotation: The `HOC_API_KEY` can be rotated by updating the secret
- Rate limiting: 60 req/min per API key (tracked in-memory per edge function instance)
- No user JWT required -- the gateway uses the service role key internally
- UserId in params is trusted (service-to-service pattern)
- All requests are logged to `audit_logs` table with source='hoc-gateway'

### Files Created

| File | Purpose |
|------|---------|
| `supabase/functions/hoc-gateway/index.ts` | Gateway edge function |
| `docs/HOC_INTEGRATION_GUIDE.md` | Complete integration documentation |
| `docs/hoc-skill-template/SKILL.md` | OpenClaw skill file (copy to HoC) |

### Config Updates

| File | Change |
|------|--------|
| `supabase/config.toml` | NOT edited (auto-managed) |

### Secret Required

- `HOC_API_KEY`: A shared secret for HoC-to-HPICS authentication (will be requested from user)

## Implementation Order

1. Create `supabase/functions/hoc-gateway/index.ts` with the full gateway logic
2. Create `docs/hoc-skill-template/SKILL.md` with the OpenClaw skill template  
3. Create `docs/HOC_INTEGRATION_GUIDE.md` with comprehensive documentation
4. Request the `HOC_API_KEY` secret from the user
5. Deploy and test the gateway

