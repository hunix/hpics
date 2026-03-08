# FUNCTION_ROUTE_MAP — Edge Function → Domain Router Reference

> **Purpose**: Authoritative mapping of all 400+ legacy function names to their consolidated domain routers. AI models MUST use this when writing `invokeFunction()` or `invokeFn()` calls.
>
> **Source of truth**: `src/lib/api/edgeFunctionRouter.ts` → `ROUTE_MAP`

---

## How to Call Functions

```typescript
import { invokeFunction } from '@/lib/api/edgeFunctionRouter';

// Call by legacy name — routing is automatic
const { data, error } = await invokeFunction('mice-recruitment-analyzer', {
  userId: user.id,
  profileId: profile.id,
});
```

**Never** construct router URLs manually. Always use `invokeFunction` or `invokeFn`.

---

## Domain Routers (15 total)

### `analysis-router` (~50 functions)
Behavioral, psychological, and pattern analysis engines.

| Legacy Function Name | Route Path |
|---------------------|-----------|
| `mice-recruitment-analyzer` | `/mice` |
| `behavioral-dna-sequencer` | `/behavioral-dna` |
| `attachment-vulnerability-analyzer` | `/attachment` |
| `enhanced-deception-detector` | `/deception` |
| `dark-tetrad-profiler` | `/dark-tetrad` |
| `analyze-influence-profile` | `/influence-profile` |
| `coercion-resistance-assessor` | `/coercion` |
| `existential-leverage-calculator` | `/existential` |
| `manipulation-vulnerability-assessment` | `/manipulation` |
| `phobia-exploitation-engine` | `/phobia` |
| `analyze-behavioral` | `/behavioral` |
| `analyze-communication-patterns` | `/communication-patterns` |
| `analyze-conversation-deep` | `/conversation-deep` |
| `analyze-conversation` | `/conversation` |
| `analyze-profile` | `/profile` |
| `deep-psychological-analysis` | `/deep-psychological` |
| `analyze-linguistic-patterns` | `/linguistic-patterns` |
| `analyze-email-insights` | `/email-insights` |
| `analyze-romantic-intelligence` | `/romantic` |
| `analyze-methodology-effectiveness` | `/methodology` |
| `personality-dna-extractor` | `/personality-dna` |
| `behavioral-economics-engine` | `/behavioral-economics` |
| `behavioral-fingerprint-engine` | `/behavioral-fingerprint` |
| `behavioral-future-modeler` | `/behavioral-future` |
| `behavioral-baseline-monitor` | `/behavioral-baseline` |
| `betrayal-likelihood-scorer` | `/betrayal-likelihood` |
| `breaking-point-calculator` | `/breaking-point` |
| `choice-architecture-optimizer` | `/choice-architecture` |
| `chronotype-analyzer` | `/chronotype` |
| `conditioning-orchestrator` | `/conditioning` |
| `elicitation-engine` | `/elicitation` |
| `emotional-contagion-modeler` | `/emotional-contagion` |
| `emotional-trajectory-analyzer` | `/emotional-trajectory` |
| `epistemic-vulnerability-scanner` | `/epistemic` |
| `forensic-statement-analyzer` | `/forensic-statement` |
| `gottman-relationship-analyzer` | `/gottman` |
| `family-systems-analyzer` | `/family-systems` |
| `family-protection-analyzer` | `/family-protection` |
| `hyperpersonalization-engine` | `/hyperpersonalization` |
| `insider-threat-matrix-engine` | `/insider-threat` |
| `kallisti-theory-of-mind` | `/theory-of-mind` |
| `karmic-pattern-calculator` | `/karmic-pattern` |
| `nlp-hypnotic-patterns` | `/nlp-hypnotic` |
| `pattern-of-life-engine` | `/pattern-of-life` |
| `relationship-half-life-calculator` | `/relationship-half-life` |
| `sacred-values-mapper` | `/sacred-values` |
| `sacred-value-predictor` | `/sacred-value-predictor` |
| `social-engineering-detector` | `/social-engineering` |

### `intelligence-router` (~45 functions)
Dossier generation, cross-correlation, and AI agents.

| Legacy Function Name | Route Path |
|---------------------|-----------|
| `generate-dossier` | `/dossier` |
| `generate-intelligence-dossier` | `/intelligence-dossier` |
| `generate-executive-summary` | `/executive-summary` |
| `aggregate-media-intelligence` | `/aggregate-media` |
| `aggregate-voice-intelligence` | `/aggregate-voice` |
| `aggregate-contact-intelligence` | `/aggregate-contact` |
| `aggregate-social-intelligence` | `/aggregate-social` |
| `aggregate-bulk-results` | `/aggregate-bulk` |
| `deep-intelligence-engine` | `/deep-engine` |
| `intelligence-session-runner` | `/session-runner` |
| `mosaic-intelligence-fuser` | `/mosaic-fuser` |
| `cross-modal-synthesis` | `/cross-modal` |
| `cross-modal-synthesis-v2` | `/cross-modal-v2` |
| `cross-reference-analysis` | `/cross-reference` |
| `cross-contact-correlation` | `/cross-contact` |
| `cross-domain-correlator` | `/cross-domain` |
| `deep-correlation-mapper` | `/deep-correlation` |
| `detect-cross-patterns` | `/cross-patterns` |
| `detect-cross-contact-patterns` | `/cross-contact-patterns` |
| `detect-anomalies` | `/anomalies` |
| `detect-communication-anomalies` | `/communication-anomalies` |
| `detect-interests` | `/interests` |
| `detect-life-milestones` | `/life-milestones` |
| `detect-relationship-lifecycle` | `/relationship-lifecycle` |
| `detect-influence-opportunities` | `/influence-opportunities` |
| `generate-proactive-insights` | `/proactive-insights` |
| `insight-prioritizer` | `/insight-prioritizer` |
| `save-ai-insight` | `/save-insight` |
| `comprehensive-contact-scan` | `/comprehensive-scan` |
| `analysis-orchestrator` | `/orchestrator` |
| `action-intelligence-engine` | `/action-intelligence` |
| `action-recommendation-engine` | `/action-recommendation` |
| `contact-ai-agent` | `/ai-agent` |
| `contact-ai-agent-v2` | `/ai-agent-v2` |
| `contact-news-correlator` | `/news-correlator` |
| `infer-relationships` | `/infer-relationships` |
| `infer-social-context` | `/infer-social-context` |
| `suggest-followups` | `/suggest-followups` |
| `suggest-gifts` | `/suggest-gifts` |
| `suggest-introductions` | `/suggest-introductions` |
| `suggest-meeting-time` | `/suggest-meeting-time` |
| `suggest-missing-data` | `/suggest-missing-data` |
| `suggest-network-growth` | `/suggest-network-growth` |
| `suggest-outreach-timing` | `/suggest-outreach-timing` |
| `suggest-contact-groups` | `/suggest-groups` |
| `ai-chat-query` | `/ai-chat` |

### `prediction-router` (~25 functions)
Churn, behavioral, and trajectory predictions.

| Legacy Function Name | Route Path |
|---------------------|-----------|
| `churn-prediction-engine` | `/churn` |
| `predict-churn` | `/predict-churn` |
| `predict-churn-enhanced` | `/predict-churn-enhanced` |
| `predict-behavioral-scenarios` | `/behavioral-scenarios` |
| `predict-relationship-trajectory` | `/relationship-trajectory` |
| `predict-contact-needs` | `/contact-needs` |
| `predict-contact-preferences` | `/contact-preferences` |
| `predict-context` | `/context` |
| `predict-risks` | `/risks` |
| `life-sequence-predictor` | `/life-sequence` |
| `fortune-trajectory-engine` | `/fortune-trajectory` |
| `cascade-predictor` | `/cascade` |
| `cascade-virality-predictor` | `/cascade-virality` |
| `collective-behavior-predictor` | `/collective-behavior` |
| `bayesian-intent-network` | `/bayesian-intent` |
| `bayesian-intention-predictor` | `/bayesian-intention` |
| `mdp-behavior-predictor` | `/mdp-behavior` |
| `precognitive-pattern-engine` | `/precognitive` |
| `prediction-calibration-engine` | `/calibration` |
| `predictive-doctrine-engine` | `/doctrine` |
| `predictive-opportunity-scanner` | `/opportunity` |
| `predictive-trajectory-engine` | `/trajectory` |
| `psychoagent-cascade-predictor` | `/psychoagent-cascade` |
| `investment-opportunity-predictor` | `/investment` |
| `future-timeline-engine` | `/future-timeline` |

### `warfare-router` (~25 functions)
Cognitive warfare, narrative control, influence operations.

| Legacy Function Name | Route Path |
|---------------------|-----------|
| `cognitive-warfare-engine` | `/cognitive` |
| `cognitive-warfare-planner` | `/cognitive-planner` |
| `cognitive-iw-detector` | `/cognitive-iw` |
| `cognitive-effect-orchestrator` | `/cognitive-effect` |
| `cognitive-defense-simulator` | `/cognitive-defense` |
| `memetic-propagation-engine` | `/memetic` |
| `narrative-control-engine` | `/narrative` |
| `semantic-warfare-engine` | `/semantic` |
| `identity-destabilization-engine` | `/identity-destabilization` |
| `cult-tactics-engine` | `/cult-tactics` |
| `draco-deception-orchestrator` | `/draco-deception` |
| `reflexive-control-detector` | `/reflexive-control` |
| `influence-campaign-optimizer` | `/influence-campaign` |
| `influence-orchestrator-v2` | `/influence-orchestrator` |
| `influence-propagation-engine` | `/influence-propagation` |
| `computational-persuasion-engine` | `/computational-persuasion` |
| `counter-narrative-generator` | `/counter-narrative` |
| `counter-intelligence-monitor` | `/counter-intelligence` |
| `subliminal-messaging-engine` | `/subliminal` |
| `mass-formation-analyzer` | `/mass-formation` |
| `memory-reconsolidation-engine` | `/memory-reconsolidation` |
| `memory-anchor-generator` | `/memory-anchor` |
| `premem-belief-modifier` | `/premem-belief` |
| `proportional-response-engine` | `/proportional-response` |
| `reputation-defense-engine` | `/reputation-defense` |

### `biometric-router` (~30 functions)
Facial, voice, body, and behavioral biometrics.

Key functions: `extract-facial-biometrics`, `extract-voice-biometrics`, `analyze-facial`, `analyze-vocal`, `analyze-body-language`, `keystroke-dynamics-analyzer`, `micro-expression-decoder`, `physiological-stress-detector`, `voice-stress-analyzer`.

### `network-router` (~30 functions)
Social graph, power analysis, community detection.

Key functions: `analyze-power-network`, `compute-network-metrics`, `detect-communities`, `detect-network-anomalies`, `identify-key-players`, `map-influence-flow`, `social-graph-enricher`.

### `enrichment-router` (~35 functions)
Data enrichment, OSINT, and external data integration.

Key functions: `enrich-contact`, `enrich-from-linkedin`, `enrich-from-social`, `chrome-extension-deep-scrape`, `batch-enrich`, `auto-tag-contacts`.

### `fusion-router` (~25 functions)
Multi-source intelligence fusion and synthesis.

Key functions: `fuse-intelligence`, `intelligence-fusion-engine`, `multi-source-correlator`, `temporal-fusion-engine`.

### `agis-router` (~20 functions)
Autonomous General Intelligence System phases.

Key functions: `agis-phase-executor`, `agis-cascade-engine`, `agis-synthesis`, `agis-objective-planner`.

### `utility-router` (~40 functions)
Import/export, OAuth, sync, and platform utilities.

Key functions: `import-gmail-contacts`, `import-outlook-contacts`, `gmail-oauth`, `outlook-oauth`, `sync-location-history`, `chrome-extension-bridge`, `whatsapp-send`.

### `hardware-router` (~15 functions)
Drone, sensor, and IoT device control.

### `voice-router` (~15 functions)
Voice recording, transcription, and analysis.

### `document-router` (~15 functions)
Document processing, OCR, and extraction.

### `security-router` (~15 functions)
Active defense, threat detection, counter-intelligence.

### `media-router` (~15 functions)
Media analysis, facial recognition pipeline, gallery AI.

---

## Important Notes

1. **All functions are called by legacy name** — the router handles internal routing
2. **Use `invokeFunction()`** from `@/lib/api/edgeFunctionRouter` — never construct URLs
3. **The invoke proxy** (installed in `main.tsx`) also intercepts raw `supabase.functions.invoke()` calls and routes them automatically
4. **Health checks**: Each router supports `?healthCheck=1` on GET requests
5. **Full ROUTE_MAP source**: `src/lib/api/edgeFunctionRouter.ts`
