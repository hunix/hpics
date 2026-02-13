# HPICS ↔ HoC Republic Integration Guide

> **Version**: 1.0.0  
> **Last Updated**: 2026-02-13  
> **Architecture**: API Gateway → Domain Routers → 400+ AI Engines

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Setup & Configuration](#setup--configuration)
4. [Authentication](#authentication)
5. [API Reference](#api-reference)
6. [Tool Catalog](#tool-catalog)
7. [Installing the HoC Skill](#installing-the-hoc-skill)
8. [Usage Examples](#usage-examples)
9. [Rate Limits & Error Handling](#rate-limits--error-handling)
10. [Extending & Maintaining](#extending--maintaining)
11. [Troubleshooting](#troubleshooting)

---

## Overview

The HPICS-HoC integration exposes all 400+ HPICS Intelligence Platform capabilities to HoC Republic agents (OpenClaw-based AI citizens) via a single authenticated REST gateway. HoC agents call HPICS tools the same way they call any external service — through `web_fetch` or `exec(curl)`.

**What flows where:**

| Direction | What | How |
|-----------|------|-----|
| HoC → HPICS | Tool calls (analysis requests, data queries) | POST to `hoc-gateway` |
| HPICS → HoC | Results (analysis data, predictions, dossiers) | JSON response |

---

## Architecture

```
HoC Agent (OpenClaw)                         HPICS Platform (Lovable Cloud)
+---------------------------+                +------------------------------------+
|  OpenClaw Gateway         |                |  Supabase Edge Functions           |
|  +---------------------+ |   HTTPS/JSON   |  +------------------------------+ |
|  | hpics-intelligence   |----(Bearer)----->|  | hoc-gateway                  | |
|  | skill (SKILL.md)     | |                |  |  - API key validation        | |
|  +---------------------+ |                |  |  - Route to domain routers   | |
|  | exec: curl/fetch     | |                |  |  - Rate limiting (60/min)    | |
|  +---------------------+ |                |  |  - Response normalization    | |
+---------------------------+                |  +------------------------------+ |
                                             |            |                      |
                                             |    +-------v-------+              |
                                             |    | Domain Routers |             |
                                             |    | (15 Hono apps) |             |
                                             |    +---------------+              |
                                             +------------------------------------+
```

The gateway acts as a single entry point. It validates the API key, applies rate limiting, looks up the requested tool in an internal route map, and forwards the request to the correct domain router. The domain router then handles the actual business logic.

### Domain Routers

| Router | Category | Tools |
|--------|----------|-------|
| `analysis-router` | Analysis | 50+ behavioral/psychological engines |
| `intelligence-router` | Intelligence | 55+ aggregation/correlation engines |
| `prediction-router` | Prediction | 27+ forecasting/simulation engines |
| `warfare-router` | Warfare | 30+ cognitive warfare/influence engines |
| `biometric-router` | Biometric | 31+ facial/voice/gait processors |
| `network-router` | Network | 19+ graph/community analyzers |
| `enrichment-router` | Enrichment | 22+ OSINT/scraping pipelines |
| `fusion-router` | Fusion | 19+ data fusion/digital twin engines |
| `agis-router` | AGIS | 26+ autonomous intelligence engines |
| `utility-router` | Utility | 53+ encryption/alerting/sync tools |
| `hardware-router` | Hardware | 15+ drone/sensor/TSCM tools |
| `voice-router` | Voice | 14+ transcription/deception tools |
| `document-router` | Document | 14+ doc analysis/RAG tools |
| `security-router` | Security | 16+ threat/red-team tools |
| `media-router` | Media | 6+ media analysis tools |

---

## Setup & Configuration

### Step 1: Configure the API Key (HPICS Side)

1. Generate a strong random key (e.g., `openssl rand -hex 32`)
2. Add it as a Cloud secret named `HOC_API_KEY` in the HPICS project
3. The `hoc-gateway` edge function reads this secret automatically

### Step 2: Deploy the Gateway

The `hoc-gateway` edge function deploys automatically when code is pushed. Verify deployment:

```bash
curl "https://<SUPABASE_URL>/functions/v1/hoc-gateway?healthCheck=1"
# → {"ok":true,"function":"hoc-gateway","timestamp":...}
```

### Step 3: Configure HoC Side

Set two environment variables in your HoC Republic workspace:

```
HPICS_API_KEY=<the same key from Step 1>
HPICS_BASE_URL=https://<your-supabase-project-id>.supabase.co
```

### Step 4: Install the Skill

Copy the file `docs/hoc-skill-template/SKILL.md` into your HoC workspace's skills directory (typically `skills/hpics-intelligence/SKILL.md`).

---

## Authentication

All requests must include the API key as a Bearer token:

```
Authorization: Bearer <HOC_API_KEY>
```

- The gateway validates the token against the `HOC_API_KEY` secret
- Invalid or missing tokens receive a `401` response
- API key rotation: Update the `HOC_API_KEY` secret on both HPICS and HoC sides

---

## API Reference

**Endpoint:** `POST https://<SUPABASE_URL>/functions/v1/hoc-gateway`

### Execute a Tool

```json
{
  "tool": "mice-recruitment-analyzer",
  "params": {
    "userId": "user-uuid",
    "profileId": "target-profile-uuid"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* tool-specific results */ },
  "meta": {
    "tool": "mice-recruitment-analyzer",
    "router": "analysis-router",
    "path": "/mice",
    "duration_ms": 2340,
    "status": 200
  }
}
```

### List All Tools

```json
{ "action": "list-tools" }
```

**Response:**
```json
{
  "success": true,
  "data": {
    "categories": {
      "analysis": {
        "description": "50+ behavioral, psychological, and pattern analysis engines",
        "tools": ["mice-recruitment-analyzer", "behavioral-dna-sequencer", ...]
      },
      ...
    },
    "totalTools": 407
  }
}
```

### List Categories

```json
{ "action": "list-categories" }
```

### Health Check

```json
{ "action": "health" }
```

Returns gateway status + health of all 15 domain routers.

---

## Tool Catalog

### Analysis (50+ tools)

| Tool | Description |
|------|-------------|
| `mice-recruitment-analyzer` | MICE framework vulnerability assessment |
| `behavioral-dna-sequencer` | Deep behavioral pattern DNA extraction |
| `dark-tetrad-profiler` | Dark Tetrad personality profiling |
| `enhanced-deception-detector` | Multi-signal deception detection |
| `breaking-point-calculator` | Psychological breaking point analysis |
| `analyze-profile` | Comprehensive profile analysis |
| `deep-psychological-analysis` | In-depth psychological assessment |
| `forensic-statement-analyzer` | Statement analysis for deception markers |
| `pattern-of-life-engine` | Pattern-of-life behavioral mapping |
| `sacred-values-mapper` | Sacred values identification |
| `coercion-resistance-assessor` | Coercion resistance scoring |
| `manipulation-vulnerability-assessment` | Manipulation vulnerability assessment |
| `emotional-trajectory-analyzer` | Emotional trajectory tracking |
| `epistemic-vulnerability-scanner` | Epistemic vulnerability detection |
| `gottman-relationship-analyzer` | Gottman-method relationship analysis |
| `insider-threat-matrix-engine` | Insider threat assessment |
| `nlp-hypnotic-patterns` | NLP hypnotic pattern analysis |
| `social-engineering-detector` | Social engineering detection |
| `trauma-exploitation-engine` | Trauma pattern analysis |
| ... | Use `list-tools` for the complete list |

### Intelligence (55+ tools)

| Tool | Description |
|------|-------------|
| `generate-intelligence-dossier` | Full intelligence dossier generation |
| `deep-intelligence-engine` | Deep multi-source intelligence |
| `intelligence-session-runner` | Orchestrated multi-step sessions |
| `comprehensive-contact-scan` | Full-spectrum contact scan |
| `cross-domain-correlator` | Cross-domain correlation |
| `contact-ai-agent-v2` | AI agent for contact queries |
| `action-recommendation-engine` | Actionable recommendations |
| `detect-anomalies` | Anomaly detection |
| `mosaic-intelligence-fuser` | Mosaic theory fusion |
| ... | Use `list-tools` for the complete list |

### Prediction (27+ tools)

| Tool | Description |
|------|-------------|
| `predict-behavioral-scenarios` | Behavioral scenario simulation |
| `bayesian-intent-network` | Bayesian intent inference |
| `cascade-predictor` | Event cascade prediction |
| `life-sequence-predictor` | Life event prediction |
| `future-timeline-engine` | Multi-timeline projection |
| ... | Use `list-tools` for the complete list |

### Warfare (30+ tools)

| Tool | Description |
|------|-------------|
| `cognitive-warfare-engine` | Cognitive warfare analysis |
| `narrative-control-engine` | Narrative control architecture |
| `memetic-propagation-engine` | Memetic warfare simulation |
| `reflexive-control-detector` | Reflexive control detection |
| `influence-campaign-optimizer` | Campaign optimization |
| ... | Use `list-tools` for the complete list |

### Biometric (31+ tools)

| Tool | Description |
|------|-------------|
| `extract-facial-biometrics` | Facial feature extraction |
| `microexpression-analyzer` | Micro-expression detection |
| `deepfake-analyzer` | Deepfake detection |
| `keystroke-dynamics-analyzer` | Keystroke behavioral analysis |
| `realtime-face-recognition` | Real-time face recognition |
| ... | Use `list-tools` for the complete list |

### Network, Enrichment, Fusion, AGIS, Utility, Hardware, Voice, Document, Security, Media

> Use `{ "action": "list-tools" }` to get the complete catalog with all tools organized by category.

---

## Installing the HoC Skill

1. Copy `docs/hoc-skill-template/SKILL.md` to your HoC workspace:
   ```
   cp SKILL.md /path/to/hoc/skills/hpics-intelligence/SKILL.md
   ```

2. Set environment variables in your OpenClaw configuration:
   ```
   HPICS_API_KEY=your-api-key-here
   HPICS_BASE_URL=https://your-project-id.supabase.co
   ```

3. The skill will be automatically discovered by OpenClaw agents and available for tool calling.

---

## Usage Examples

### Example 1: Agent Queries a Profile

```bash
curl -X POST "https://<URL>/functions/v1/hoc-gateway" \
  -H "Authorization: Bearer $HPICS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "analyze-profile",
    "params": {
      "userId": "agent-user-uuid",
      "profileId": "target-uuid"
    }
  }'
```

### Example 2: Agent Runs a Full Intelligence Session

```bash
# Step 1: Start session
curl -X POST "$HPICS_BASE_URL/functions/v1/hoc-gateway" \
  -H "Authorization: Bearer $HPICS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "intelligence-session-runner",
    "params": {
      "userId": "agent-uuid",
      "profileId": "target-uuid",
      "phases": ["behavioral", "network", "prediction"]
    }
  }'
```

### Example 3: Agent Discovers Available Tools

```bash
curl -X POST "$HPICS_BASE_URL/functions/v1/hoc-gateway" \
  -H "Authorization: Bearer $HPICS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "action": "list-categories" }'
```

### Example 4: Network Analysis Workflow (HoC Agent Script)

```python
# Pseudocode for a HoC agent workflow
profile_id = "target-uuid"

# 1. Map the network
network = hpics_call("analyze-network-graph", profileId=profile_id)

# 2. Find hidden connections
shadows = hpics_call("detect-shadow-networks", profileId=profile_id)

# 3. Identify power nodes
power = hpics_call("power-network-analyzer", profileId=profile_id)

# 4. Predict network evolution
prediction = hpics_call("social-graph-predictor", profileId=profile_id)

# 5. Compile dossier
dossier = hpics_call("generate-intelligence-dossier", 
  profileId=profile_id, 
  sections=["network", "prediction"])
```

---

## Rate Limits & Error Handling

### Rate Limits

| Limit | Value |
|-------|-------|
| Requests per minute | 60 |
| Default timeout per tool | 120 seconds |
| Custom timeout | Set `params.timeout_ms` |

### Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| `401` | Invalid API key | Check `HPICS_API_KEY` |
| `400` | Malformed request | Check JSON structure |
| `404` | Unknown tool name | Use `list-tools` |
| `429` | Rate limit exceeded | Wait and retry |
| `503` | Gateway not configured | Check `HOC_API_KEY` secret |
| `504` | Tool execution timeout | Increase `timeout_ms` |
| `500` | Internal error | Check `error` field |

### Retry Strategy

```
if status == 429:
    wait(60 seconds)
    retry()
elif status == 504:
    retry with timeout_ms = timeout_ms * 2
elif status >= 500:
    retry up to 3 times with exponential backoff
```

---

## Extending & Maintaining

### Adding New Tools (HPICS Side)

1. Add the tool handler to the appropriate domain router
2. Add an entry to `ROUTE_MAP` in both:
   - `supabase/functions/hoc-gateway/index.ts` (server-side)
   - `src/lib/api/edgeFunctionRouter.ts` (client-side)
3. The tool will automatically appear in `list-tools` responses

### Adding New Categories

1. Add a new domain router edge function
2. Add the category to `CATEGORIES` in `hoc-gateway/index.ts`
3. Map tools to the new router in `ROUTE_MAP`

### API Key Rotation

1. Generate a new key
2. Update `HOC_API_KEY` in HPICS Cloud secrets
3. Update `HPICS_API_KEY` in HoC environment
4. Both old and new keys will work during the gateway redeployment window (~30s)

### Monitoring

- All gateway calls are logged to the `audit_logs` table with `event_source = 'hoc-gateway'`
- Query recent calls:
  ```sql
  SELECT * FROM audit_logs 
  WHERE event_source = 'hoc-gateway' 
  ORDER BY created_at DESC 
  LIMIT 100;
  ```

---

## Troubleshooting

### "Gateway not configured: HOC_API_KEY missing"
The `HOC_API_KEY` secret hasn't been set. Add it via Cloud secrets.

### "Invalid or missing API key"
The Bearer token doesn't match `HOC_API_KEY`. Verify the key on both sides.

### "Unknown tool" errors
The tool name doesn't exist in the route map. Call `list-tools` to see valid names. Tool names use kebab-case (e.g., `mice-recruitment-analyzer`, not `miceRecruitmentAnalyzer`).

### Timeouts
Some tools (dossier generation, deep intelligence) can take 30-90 seconds. Set `params.timeout_ms` to 180000 (3 min) for heavy operations.

### Empty results
Ensure `userId` and `profileId` are valid UUIDs that exist in the HPICS database. The user must have appropriate data loaded for analysis to produce results.

---

## Building Custom HoC-Side Wrappers

For frequently used tool combinations, create wrapper functions in your HoC codebase:

```typescript
// hpics-wrapper.ts
const HPICS_URL = process.env.HPICS_BASE_URL + '/functions/v1/hoc-gateway';
const HPICS_KEY = process.env.HPICS_API_KEY;

async function hpicsCall(tool: string, params: Record<string, unknown>) {
  const resp = await fetch(HPICS_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${HPICS_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ tool, params }),
  });
  
  const result = await resp.json();
  if (!result.success) throw new Error(result.error);
  return result.data;
}

// Convenience functions
export const analyzeBehavior = (profileId: string, userId: string) =>
  hpicsCall('behavioral-dna-sequencer', { profileId, userId });

export const generateDossier = (profileId: string, userId: string, sections?: string[]) =>
  hpicsCall('generate-intelligence-dossier', { profileId, userId, sections });

export const assessThreat = (profileId: string, userId: string) =>
  hpicsCall('assess-threat', { profileId, userId });
```

---

## Security Considerations

- **API Key**: Treat `HOC_API_KEY` as a secret. Never commit it to version control.
- **UserId Trust**: The gateway trusts `userId` from params (service-to-service pattern). Ensure your HoC side validates user identity before passing their UUID.
- **Data Sensitivity**: HPICS processes sensitive intelligence data. Ensure your HoC agents handle returned data according to your security policies.
- **Network Security**: All communication is over HTTPS. No additional encryption layer is needed.
- **Audit Trail**: All calls are logged. Review `audit_logs` periodically for anomalous patterns.
