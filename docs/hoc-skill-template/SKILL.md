---
name: hpics-intelligence
description: Access the HPICS Intelligence Platform — 400+ behavioral analysis, biometric processing, network intelligence, warfare simulation, prediction, and autonomous AI engines via a single tool-calling gateway.
metadata:
  {
    "openclaw": {
      "requires": { "env": ["HPICS_API_KEY", "HPICS_BASE_URL"] },
      "primaryEnv": "HPICS_API_KEY"
    }
  }
---

# HPICS Intelligence Platform Skill

You have access to **HPICS** (Human Performance Intelligence & Cognitive Systems), an enterprise intelligence platform with 400+ specialized AI engines organized into 15 domain categories. You can invoke any tool via a single HTTP gateway.

## Configuration

Two environment variables are required:

- `HPICS_API_KEY` — The shared API key for authentication (Bearer token)
- `HPICS_BASE_URL` — The base URL of the HPICS platform (e.g., `https://yibszncvwmefwamayfty.supabase.co`)

## How to Call Tools

Use `web_fetch` (or `exec` with `curl`) to call the HPICS gateway:

```
POST ${HPICS_BASE_URL}/functions/v1/hoc-gateway
Authorization: Bearer ${HPICS_API_KEY}
Content-Type: application/json

{
  "tool": "<tool-name>",
  "params": {
    "userId": "<user-uuid>",
    "profileId": "<profile-uuid>",
    ...additional tool-specific parameters
  }
}
```

### Response Format

All responses follow this structure:

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "tool": "mice-recruitment-analyzer",
    "router": "analysis-router",
    "path": "/mice",
    "duration_ms": 2340,
    "status": 200
  }
}
```

On error:

```json
{
  "success": false,
  "error": "Description of what went wrong",
  "meta": { "tool": "...", "router": "...", "duration_ms": ... }
}
```

## Discovery Actions

### List All Tools

```json
{ "action": "list-tools" }
```

Returns the complete tool catalog organized by category with descriptions.

### List Categories

```json
{ "action": "list-categories" }
```

Returns a summary of all 15 categories with tool counts.

### Health Check

```json
{ "action": "health" }
```

Returns the health status of the gateway and all 15 domain routers.

## Tool Categories

### 1. Analysis (50+ tools)
Behavioral, psychological, and pattern analysis engines.

**Key tools:**
- `mice-recruitment-analyzer` — MICE framework recruitment vulnerability assessment
- `behavioral-dna-sequencer` — Deep behavioral pattern DNA extraction
- `dark-tetrad-profiler` — Dark Tetrad personality profiling
- `enhanced-deception-detector` — Multi-signal deception detection
- `breaking-point-calculator` — Psychological breaking point analysis
- `analyze-profile` — Comprehensive profile analysis
- `deep-psychological-analysis` — In-depth psychological assessment
- `forensic-statement-analyzer` — Statement analysis for deception markers
- `pattern-of-life-engine` — Pattern-of-life behavioral mapping
- `sacred-values-mapper` — Sacred values identification and mapping

**Example — MICE Analysis:**
```json
{
  "tool": "mice-recruitment-analyzer",
  "params": {
    "userId": "uuid-here",
    "profileId": "target-profile-uuid"
  }
}
```

### 2. Intelligence (55+ tools)
Intelligence gathering, aggregation, correlation, and recommendation engines.

**Key tools:**
- `generate-intelligence-dossier` — Full intelligence dossier generation
- `deep-intelligence-engine` — Deep multi-source intelligence analysis
- `intelligence-session-runner` — Orchestrated multi-step intelligence sessions
- `comprehensive-contact-scan` — Full-spectrum contact intelligence scan
- `cross-domain-correlator` — Cross-domain pattern correlation
- `contact-ai-agent-v2` — AI agent for contact analysis queries
- `action-recommendation-engine` — Actionable intelligence recommendations
- `detect-anomalies` — Anomaly detection across data sources

**Example — Generate Dossier:**
```json
{
  "tool": "generate-intelligence-dossier",
  "params": {
    "userId": "uuid-here",
    "profileId": "target-profile-uuid",
    "sections": ["behavioral", "network", "warfare", "biometric"]
  }
}
```

### 3. Prediction (27+ tools)
Predictive modeling, trajectory forecasting, and scenario simulation.

**Key tools:**
- `predict-behavioral-scenarios` — Behavioral scenario simulation
- `predict-relationship-trajectory` — Relationship evolution prediction
- `bayesian-intent-network` — Bayesian intent inference
- `cascade-predictor` — Event cascade prediction
- `life-sequence-predictor` — Life event sequence prediction
- `future-timeline-engine` — Multi-timeline future projection

**Example — Predict Scenarios:**
```json
{
  "tool": "predict-behavioral-scenarios",
  "params": {
    "userId": "uuid-here",
    "profileId": "target-profile-uuid",
    "timeHorizon": "6months"
  }
}
```

### 4. Warfare (30+ tools)
Cognitive warfare, influence operations, and narrative control.

**Key tools:**
- `cognitive-warfare-engine` — Full cognitive warfare analysis
- `narrative-control-engine` — Narrative architecture and control
- `memetic-propagation-engine` — Memetic warfare simulation
- `reflexive-control-detector` — Reflexive control pattern detection
- `influence-campaign-optimizer` — Campaign optimization engine
- `counter-narrative-generator` — Counter-narrative construction
- `reputation-defense-engine` — Reputation defense strategies

### 5. Biometric (31+ tools)
Facial, voice, gait, keystroke, and multimodal biometric processors.

**Key tools:**
- `extract-facial-biometrics` — Facial feature extraction
- `extract-voice-biometrics` — Voice biometric extraction
- `microexpression-analyzer` — Micro-expression detection
- `deepfake-analyzer` — Deepfake detection
- `gaze-pattern-analyzer` — Gaze pattern analysis
- `keystroke-dynamics-analyzer` — Keystroke behavioral analysis
- `realtime-face-recognition` — Real-time face recognition

### 6. Network (19+ tools)
Social graph, community detection, and network topology analyzers.

**Key tools:**
- `analyze-network-graph` — Social network graph analysis
- `power-network-analyzer` — Power dynamics and centrality analysis
- `detect-shadow-networks` — Hidden network detection
- `network-cascade-modeler` — Information cascade modeling
- `social-graph-predictor` — Social graph evolution prediction

### 7. Enrichment (22+ tools)
OSINT, social scraping, and data enrichment pipelines.

**Key tools:**
- `osint-scan` — Open-source intelligence scan
- `deep-osint-scan` — Deep OSINT with multi-source fusion
- `digital-footprint-scanner` — Digital presence mapping
- `enrich-contact` — Multi-source contact enrichment
- `scrape-linkedin-proxycurl` — LinkedIn data extraction

### 8. Fusion (19+ tools)
Multi-source data fusion, digital twin, and cross-modal correlation.

**Key tools:**
- `digital-twin-generator` — Digital twin creation
- `digital-twin-simulator` — Digital twin scenario simulation
- `dempster-shafer-fusion` — Dempster-Shafer evidence fusion
- `entity-resolution-engine` — Cross-source entity resolution
- `counterfactual-engine` — Counterfactual scenario analysis

### 9. AGIS (26+ tools)
Autonomous general intelligence, quantum cognition, and orchestration.

**Key tools:**
- `agis-api` — AGIS phase orchestration API
- `genesis-engine` — Genesis-level intelligence synthesis
- `quantum-cognition-engine` — Quantum-inspired cognitive modeling
- `hypergame-solver` — Hypergame theory solver
- `omniscient-orchestrator` — Multi-phase omniscient orchestration

### 10. Utility (53+ tools)
Encryption, alerting, reporting, sync, import/export, and communication.

**Key tools:**
- `generate-briefing` — Intelligence briefing generation
- `generate-meeting-prep` — Meeting preparation intelligence
- `send-intelligence-alert` — Alert dispatch
- `encrypt-field` / `decrypt-field` — Field-level encryption
- `sync-gmail-emails` — Gmail synchronization
- `summarize-conversation` — Conversation summarization

### 11. Hardware (15+ tools)
Drone, SDR, sensor, NFC, thermal, and TSCM hardware integration.

**Key tools:**
- `aerial-intelligence` — Drone/aerial intelligence processing
- `sdr-intelligence` — Software-defined radio signal intelligence
- `thermal-intelligence` — Thermal imaging analysis
- `tscm-intelligence` — Technical surveillance countermeasures

### 12. Voice (14+ tools)
Voice recording, transcription, deception detection, and stylometric analysis.

**Key tools:**
- `transcribe-audio` — Audio transcription
- `analyze-voice-comprehensive` — Comprehensive voice analysis
- `linguistic-deception-analyzer` — Linguistic deception detection
- `multi-party-deception-detector` — Multi-party deception analysis

### 13. Document (14+ tools)
Document analysis, embedding, RAG query, and entity extraction.

**Key tools:**
- `analyze-document-comprehensive` — Comprehensive document analysis
- `rag-query-v3` — RAG-powered document Q&A
- `entity-extraction` — Named entity extraction
- `parse-identity-document` — Identity document parsing

### 14. Security (16+ tools)
Threat assessment, red teaming, OPSEC, and crisis response.

**Key tools:**
- `assess-threat` — Threat assessment
- `assess-trust` — Trust scoring
- `automated-red-team-engine` — Automated red team simulation
- `opsec-vulnerability-analyzer` — OPSEC vulnerability analysis
- `crisis-response-orchestrator` — Crisis response orchestration

### 15. Media (6+ tools)
Media metadata, triangulation, and affective analysis.

**Key tools:**
- `analyze-media-deep` — Deep media analysis
- `analyze-communication-triangulation` — Communication triangulation
- `detect-shared-experiences` — Shared experience detection

## Common Workflows

### Full Intelligence Assessment
1. `comprehensive-contact-scan` → initial scan
2. `deep-psychological-analysis` → psychological profile
3. `behavioral-dna-sequencer` → behavioral patterns
4. `predict-behavioral-scenarios` → future projections
5. `generate-intelligence-dossier` → compiled dossier

### Threat Evaluation
1. `assess-threat` → initial threat level
2. `mice-recruitment-analyzer` → vulnerability assessment
3. `dark-tetrad-profiler` → personality risk factors
4. `predict-risks` → predictive risk analysis
5. `opsec-vulnerability-analyzer` → operational security gaps

### Network Analysis
1. `analyze-network-graph` → map the network
2. `detect-shadow-networks` → find hidden connections
3. `power-network-analyzer` → identify key nodes
4. `network-cascade-modeler` → model information flow
5. `social-graph-predictor` → predict evolution

## Rate Limits

- 60 requests per minute per API key
- Default timeout: 120 seconds per tool call (configurable via `params.timeout_ms`)

## Error Handling

- `401` — Invalid API key
- `404` — Unknown tool name (use `list-tools` to find valid names)
- `429` — Rate limit exceeded (wait and retry)
- `504` — Tool execution timed out
- `500` — Internal error (check `error` field for details)

When you receive an error, include the `meta` object in your analysis for debugging context.
