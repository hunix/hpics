
# v8.0 DDD Type System Integration Plan

## Objective
Integrate all 35 v8.0 Masterpiece Intelligence engines into the formal Domain-Driven Design (DDD) type system for full type safety, IDE autocompletion, and repository pattern compliance.

---

## Current State

The v8.0 Masterpiece Suite is fully functional but bypasses formal DDD typing:

| Component | v1-v7 Status | v8.0 Status |
|-----------|--------------|-------------|
| Edge Functions | 30 deployed | 35 deployed |
| FusionEngineType union | 30 types | Missing 35 |
| FUSION_ANALYSIS_TYPES mapping | 30 mappings | Missing 35 |
| getEdgeFunctionName mapping | 30 entries | Missing 35 |
| FusionService execution | Supported | Manual calls only |
| Repository queries | Included | Not included |

---

## Implementation Strategy

### Smart/Efficient Approach

Rather than modifying 6+ files independently, we will use a **centralized type expansion** pattern:

1. **Single Source of Truth**: Define all 35 v8.0 engine types in `FusionResult.ts`
2. **Automatic Propagation**: Other files import from this source
3. **Parallel Editing**: All files can be updated in a single batch
4. **Minimal Diff**: Only add new entries without restructuring existing code

---

## Phase 1: Core Type Expansion

### File: `src/domains/fusion/entities/FusionResult.ts`

Add 35 new engine types to the `FusionEngineType` union:

```text
// v8.0 Phase 1 - Counter-Intelligence
| 'draco-deception-orchestrator'
| 'sentient-intent-analyzer'
| 'insider-threat-matrix'
| 'bayesian-intention-predictor'
| 'red-team-adversary-simulator'
| 'semafor-forgery-detector'
| 'epistemic-vulnerability-scanner'
| 'cognitive-iw-detector'

// v8.0 Phase 2 - Psychological Warfare
| 'psychoagent-cascade-predictor'
| 'affective-manipulation-detector'
| 'hyperpersonalization-engine'
| 'computational-persuasion-engine'
| 'synthetic-memory-generator'
| 'premem-belief-modifier'
| 'linguistic-stress-detector'
| 'memory-anchor-generator'
| 'emotional-contagion-modeler'
| 'sacred-value-predictor'

// v8.0 Phase 3 - Biometric & Network
| 'pupillometry-analyzer'
| 'thermal-stress-detector'
| 'attention-multimodal-fuser'
| 'keystroke-dynamics-analyzer'
| 'sheaf-neural-influence-mapper'
| 'ctdg-link-predictor'
| 'cascade-virality-predictor'
| 'network-resilience-analyzer'
| 'gaze-pattern-analyzer'
| 'micro-expression-timeline'
| 'voice-stress-correlator'
| 'social-graph-predictor'
| 'behavioral-fingerprint-engine'

// v8.0 Phase 4 - Doctrine & Prediction
| 'influence-campaign-optimizer'
| 'counter-narrative-generator'
| 'predictive-doctrine-engine'
| 'cognitive-defense-simulator'
```

---

## Phase 2: Analysis Type Mapping

### File: `src/domains/fusion/services/FusionService.ts`

Extend `FUSION_ANALYSIS_TYPES` constant with 35 new entries:

```text
// v8.0 Phase 1 - Counter-Intelligence
'draco-deception-orchestrator': 'draco_deception',
'sentient-intent-analyzer': 'sentient_intent',
'insider-threat-matrix': 'insider_threat_matrix',
...

// v8.0 Phase 2 - Psychological Warfare
'psychoagent-cascade-predictor': 'psychoagent_cascade',
...

// v8.0 Phase 3 - Biometric & Network
'pupillometry-analyzer': 'pupillometry',
...

// v8.0 Phase 4 - Doctrine & Prediction
'influence-campaign-optimizer': 'influence_campaign',
...
```

---

## Phase 3: Edge Function Routing

### File: `src/domains/fusion/services/FusionService.ts`

Extend `getEdgeFunctionName` mapping with 35 new routes:

```text
// v8.0 Phase 1
'draco-deception-orchestrator': 'draco-deception-orchestrator',
'sentient-intent-analyzer': 'sentient-intent-analyzer',
...

// v8.0 Phase 2-4 (same pattern)
```

---

## Phase 4: Repository Interface Sync

### File: `src/domains/fusion/repositories/IFusionRepository.ts`

This file imports `FusionEngineType` from `FusionResult.ts`, so it will automatically receive the new types after Phase 1. However, we must also update its duplicate `FUSION_ANALYSIS_TYPES` constant.

Action: Synchronize the `FUSION_ANALYSIS_TYPES` in `IFusionRepository.ts` with the same 35 entries added in Phase 2.

---

## Phase 5: Repository Implementation

### File: `src/infrastructure/repositories/SupabaseFusionRepository.ts`

This file imports from `IFusionRepository.ts`, so type propagation is automatic. No changes needed if imports are correctly structured.

---

## Phase 6: DI Container Update (Optional Enhancement)

### File: `src/infrastructure/di/bootstrap.ts`

The `FusionService` is already registered. We can enhance it to use constructor injection with repositories:

```typescript
container.register(ServiceKeys.FusionService, () => {
  const fusionRepo = container.resolve(ServiceKeys.FusionRepository);
  const twinRepo = container.resolve(ServiceKeys.DigitalTwinRepository);
  return new FusionService(fusionRepo, twinRepo);
}, 'singleton');
```

This enables the service to use DDD repositories for all 65 engines.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/domains/fusion/entities/FusionResult.ts` | +35 types to FusionEngineType union |
| `src/domains/fusion/services/FusionService.ts` | +35 entries to FUSION_ANALYSIS_TYPES, +35 to getEdgeFunctionName |
| `src/domains/fusion/repositories/IFusionRepository.ts` | +35 entries to FUSION_ANALYSIS_TYPES (sync) |
| `src/infrastructure/di/bootstrap.ts` | Enhance FusionService DI with repository injection |

---

## Technical Details

### New Engine Type Naming Convention

Following existing kebab-case pattern:
- Engine Type: `draco-deception-orchestrator`
- Analysis Type: `draco_deception` (snake_case, matches edge function output)
- Edge Function: `draco-deception-orchestrator` (kebab-case folder name)

### Complete v8.0 Engine List (35 total)

**Phase 1 - Counter-Intelligence (8 engines)**
1. draco-deception-orchestrator
2. sentient-intent-analyzer
3. insider-threat-matrix
4. bayesian-intention-predictor
5. red-team-adversary-simulator
6. semafor-forgery-detector
7. epistemic-vulnerability-scanner
8. cognitive-iw-detector

**Phase 2 - Psychological Warfare (10 engines)**
9. psychoagent-cascade-predictor
10. affective-manipulation-detector
11. hyperpersonalization-engine
12. computational-persuasion-engine
13. synthetic-memory-generator
14. premem-belief-modifier
15. linguistic-stress-detector
16. memory-anchor-generator
17. emotional-contagion-modeler
18. sacred-value-predictor

**Phase 3 - Biometric & Network (13 engines)**
19. pupillometry-analyzer
20. thermal-stress-detector
21. attention-multimodal-fuser
22. keystroke-dynamics-analyzer
23. sheaf-neural-influence-mapper
24. ctdg-link-predictor
25. cascade-virality-predictor
26. network-resilience-analyzer
27. gaze-pattern-analyzer
28. micro-expression-timeline
29. voice-stress-correlator
30. social-graph-predictor
31. behavioral-fingerprint-engine

**Phase 4 - Doctrine & Prediction (4 engines)**
32. influence-campaign-optimizer
33. counter-narrative-generator
34. predictive-doctrine-engine
35. cognitive-defense-simulator

---

## Execution Order

1. **FusionResult.ts** - Define types (source of truth)
2. **FusionService.ts** - Add mappings + routing
3. **IFusionRepository.ts** - Sync FUSION_ANALYSIS_TYPES
4. **bootstrap.ts** - Enhance DI with repository injection

All 4 files can be edited in parallel since they have no circular write dependencies.

---

## Validation

After implementation:
- TypeScript compilation passes
- IDE autocomplete shows all 65 engine types
- FusionService.executeFusion() accepts v8.0 engines
- Repository queries include v8.0 analysis types
- getEdgeFunctionName() routes to correct endpoints

---

## Summary

This plan adds full DDD compliance for 35 v8.0 engines by:
- Expanding the FusionEngineType union (35 new types)
- Synchronizing FUSION_ANALYSIS_TYPES across 2 files (70 entries total)
- Adding getEdgeFunctionName routing (35 new routes)
- Enhancing DI to use repository injection

Total: **4 files modified** with **~180 lines of additions** (no deletions or restructuring).
