
# HPICS-HoC Strategic Enhancement Plan — IMPLEMENTED

## Status: ✅ Tier 1 Complete

### What Was Built

#### 1. Agent Workflow Orchestrator (`supabase/functions/agent-workflow/index.ts`)
- DAG-based multi-step workflow executor
- 5 predefined workflows: `full-intelligence`, `generate-dossier`, `track-contact`, `counter-intel-scan`, `quick-profile`
- Parallel step execution with dependency ordering
- Contact resolution by name/email/phone (no UUID needed)
- Workflow run tracking in `agent_workflow_runs` table
- Accessible via gateway: `{ "action": "run-workflow", "command": "full-intelligence", "contact": "John Smith", "userId": "..." }`

#### 2. External API Integration Layer (`supabase/functions/_shared/external-api.ts`)
- Real API calls to: PDL, Hunter.io, Proxycurl (LinkedIn), Tavily, Brave Search
- Vault-based API key retrieval per user
- Graceful AI fallback when keys not configured
- Multi-source OSINT aggregation

#### 3. Updated Enrichment Router (`supabase/functions/enrichment-router/index.ts` v5.0.0)
- `/auto-enrich`, `/enrich` → tries PDL + Hunter + Proxycurl in parallel, falls back to AI
- `/hunter` → real Hunter.io API with AI fallback
- `/pdl` → real PDL API with AI fallback
- `/linkedin` → real Proxycurl API with AI fallback
- `/osint`, `/deep-osint` → Tavily + Brave web search with AI fallback
- `/digital-footprint`, `/web-mentions` → multi-source web search with AI fallback
- AI-only routes preserved for social scraping, Instagram, Threads, Diffbot

#### 4. Updated HoC Gateway (`supabase/functions/hoc-gateway/index.ts`)
- New actions: `resolve-contact`, `list-workflows`, `run-workflow`
- Workflow tool routes added to ROUTE_MAP
- `workflows` category added to tool catalog

#### 5. Database Migration
- `agent_workflow_runs` table with RLS, indexes

### How HoC Agents Use It

```json
// Resolve a contact by name
POST { "action": "resolve-contact", "query": "John Smith", "userId": "..." }

// Run full intelligence pipeline
POST { "action": "run-workflow", "command": "full-intelligence", "contact": "John Smith", "userId": "..." }

// Generate dossier
POST { "action": "run-workflow", "command": "generate-dossier", "profileId": "uuid", "userId": "..." }

// List available workflows
POST { "action": "list-workflows" }
```

### Tier 2 (Future)
- Agentic RAG with iterative retrieval
- Graph-of-Thought reasoning for dossiers
- Constitutional AI verification pipeline
- Multimodal unified fusion via Gemini 2.5 Pro 1M context
- Adversarial robustness testing in dossier pipeline
