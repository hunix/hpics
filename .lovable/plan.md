
# Warfare Features Comprehensive Audit & Remediation Plan
## Line-by-Line Analysis of Issues, Inconsistencies, and Integration Gaps

---

## Executive Summary

After a thorough line-by-line audit of all warfare-related features, edge functions, hooks, components, libraries, and DDD infrastructure, I have identified **23 actionable issues** across 5 categories:

1. **Analysis Type Mismatches (CRITICAL)** - Edge functions persist with different `analysis_type` keys than `sectionDataCheck.ts` expects
2. **Missing Barrel Exports** - `src/lib/warfare/index.ts` does not exist, forcing scattered imports
3. **Missing Component Exports** - 12 warfare components exist but only 7 are exported from the index
4. **Fusion Engine Integration Gaps** - Warfare engines not registered in FusionEngineType
5. **Dossier Rendering Improvements** - Several warfare sections lack complete field extraction

---

## Category 1: Analysis Type Mismatches (CRITICAL)

These mismatches cause dossier sections to appear empty even when edge functions have successfully generated analysis.

### Issue 1.1: Sacred Values Mapping Mismatch
| Location | Current Value | Expected by sectionDataCheck.ts |
|----------|---------------|--------------------------------|
| `supabase/functions/sacred-values-mapper/index.ts:207` | `'sacred_values'` | `'existential_leverage'` |
| `src/components/reports/utils/sectionDataCheck.ts:43` | `sacredValues: ['existential_leverage']` | - |

**Fix**: Either update edge function to persist `analysis_type: 'existential_leverage'` OR add `'sacred_values'` to the alias array.

### Issue 1.2: Betrayal Analysis Mismatch
| Location | Current Value | Expected by sectionDataCheck.ts |
|----------|---------------|--------------------------------|
| `supabase/functions/betrayal-likelihood-scorer/index.ts:192` | `'betrayal_likelihood'` | `'trauma_exploitation'` |
| `src/components/reports/utils/sectionDataCheck.ts:51` | `betrayal: ['trauma_exploitation']` | - |

**Fix**: Add `'betrayal_likelihood'` to the betrayal alias array in sectionDataCheck.ts.

### Issue 1.3: Semantic Warfare Mismatch
| Location | Current Value | Expected by sectionDataCheck.ts |
|----------|---------------|--------------------------------|
| `supabase/functions/semantic-warfare-engine/index.ts:170` | `'semantic_warfare'` | `'narrative_control'` |
| `src/components/reports/utils/sectionDataCheck.ts:46` | `semanticWarfare: ['narrative_control']` | - |

**Fix**: Add `'semantic_warfare'` to the semanticWarfare alias array.

### Issue 1.4: Elicitation Guide Not Mapped
| Location | Current Value | Expected by sectionDataCheck.ts |
|----------|---------------|--------------------------------|
| `supabase/functions/elicitation-engine/index.ts:195` | `'elicitation_guide'` | NOT MAPPED |

**Fix**: Add new section mapping: `elicitation: ['elicitation_guide']`

---

## Category 2: Missing Barrel Export File

### Issue 2.1: `src/lib/warfare/index.ts` Does Not Exist
The warfare library directory contains 15 specialized modules but lacks a barrel export file:
- `betrayalPredictor.ts`
- `miceAnalyzer.ts`
- `semanticWarfareEngine.ts`
- `memeticPropagationEngine.ts`
- `sacredValuesMapper.ts`
- `elicitationTechniques.ts`
- `behavioralAnomalyPatterns.ts`
- `crisisResponsePlaybooks.ts`
- `economicWarfareIndicators.ts`
- `familyProtectionMatrix.ts`
- `lawfareDefensePlaybook.ts`
- `opsecVulnerabilityFramework.ts`
- `reputationDefenseProtocols.ts`
- `socialEngineeringPatterns.ts`
- `technicalCountermeasures.ts`

**Impact**: Requires direct file imports instead of clean `import { X } from '@/lib/warfare'` pattern.

**Fix**: Create `src/lib/warfare/index.ts` with explicit named exports.

---

## Category 3: Missing Component Exports

### Issue 3.1: Warfare Components Index Incomplete
The file `src/components/intelligence/warfare/index.ts` exports only 7 of 19 components:

**Currently Exported (7)**:
```
SemanticWarfarePanel, MICERecruitmentPanel, BetrayalRiskPanel,
SacredValuesPanel, MemeticEngineeringPanel, SyntheticConsensusPanel, ElicitationPanel
```

**Missing Exports (12)**:
```
CognitiveWarfarePanel, ConversationScriptGenerator, CounterIntelDetectionPanel,
DeceptionOperationsPanel, ElicitationSessionRecorder, GottmanHorsemenPanel,
InfluenceNetworkMapper, MemeticPropagationGraph, NarrativeWarfarePanel,
NarrativeWarfareSimulator, ReverseEngineeringPanel, TrustNetworkGraph
```

**Fix**: Add explicit exports for all 12 missing components.

---

## Category 4: Fusion Engine Integration Gaps

### Issue 4.1: Warfare-Specific Engines Not in FusionEngineType
The following warfare engines exist as edge functions but are NOT registered in `FusionEngineType` or `FUSION_ANALYSIS_TYPES`:

| Edge Function | Should Be | Status |
|--------------|-----------|--------|
| `mice-recruitment-analyzer` | `'mice-recruitment'` | NOT IN FusionEngineType |
| `betrayal-likelihood-scorer` | `'betrayal-likelihood'` | NOT IN FusionEngineType |
| `semantic-warfare-engine` | `'semantic-warfare'` | NOT IN FusionEngineType |
| `memetic-propagation-engine` | `'memetic-propagation'` | NOT IN FusionEngineType |
| `sacred-values-mapper` | `'sacred-values'` | NOT IN FusionEngineType |
| `elicitation-engine` | `'elicitation'` | NOT IN FusionEngineType |
| `cognitive-warfare-engine` | `'cognitive-warfare'` | NOT IN FusionEngineType |
| `gottman-relationship-analyzer` | `'gottman-relationship'` | NOT IN FusionEngineType |

**Impact**: These engines cannot be invoked via `FusionService.executeFusion()`, losing DDD compliance.

**Fix**: Add warfare engines to `FusionEngineType` union and `FUSION_ANALYSIS_TYPES` mapping.

---

## Category 5: Dossier Rendering Improvements

### Issue 5.1: MICE Section Renderer Missing
File `src/components/reports/sections/renderers/WarfareSectionRenderers.ts` does not have a dedicated `renderMICE` function. The section mapping exists (`mice: ['mice_recruitment']`) but rendering falls back to generic handler.

**Fix**: Add `renderMICE` function to extract:
- `money_vulnerability` score
- `ideology_alignment` score
- `compromise_material` score
- `ego_needs` score
- `optimal_approach` recommendation

### Issue 5.2: Sacred Values Renderer Missing
No dedicated `renderSacredValues` function exists in WarfareSectionRenderers.ts.

**Fix**: Add `renderSacredValues` function to extract:
- `protection_level` scores
- `value_domain` categories
- `violation_triggers`
- `exploitation_vectors`

### Issue 5.3: Elicitation Section Not Rendered
No section or renderer exists for elicitation guide data.

**Fix**: 
1. Add `elicitation: ['elicitation_guide']` to sectionDataCheck.ts
2. Add `renderElicitation` function to WarfareSectionRenderers.ts

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/reports/utils/sectionDataCheck.ts` | Add 4 missing analysis_type aliases |
| `src/components/intelligence/warfare/index.ts` | Add 12 missing component exports |
| `src/domains/fusion/entities/FusionResult.ts` | Add 8 warfare engine types to union |
| `src/domains/fusion/services/FusionService.ts` | Add warfare mappings to FUSION_ANALYSIS_TYPES and getEdgeFunctionName |
| `src/components/reports/sections/renderers/WarfareSectionRenderers.ts` | Add 3 new render functions |

## Files to Create

| File | Purpose |
|------|---------|
| `src/lib/warfare/index.ts` | Barrel exports for 15 warfare library modules |

---

## Implementation Details

### Phase 1: Fix Analysis Type Mismatches (sectionDataCheck.ts)

Update `ANALYSIS_TYPE_ALIASES` at lines 25-170:

```typescript
// Add to existing aliases
mice: ['mice_recruitment', 'mice_analysis'],
betrayal: ['trauma_exploitation', 'betrayal_likelihood'],
semanticWarfare: ['narrative_control', 'semantic_warfare'],
sacredValues: ['existential_leverage', 'sacred_values'],
elicitation: ['elicitation_guide'],
gottmanHorsemen: ['gottman_relationship'],
```

### Phase 2: Create Warfare Library Barrel (src/lib/warfare/index.ts)

```typescript
/**
 * Warfare Library Index (v9.0)
 * Centralized exports for warfare engines and utilities
 */

// Core Analysis Engines
export * from './betrayalPredictor';
export * from './miceAnalyzer';
export * from './semanticWarfareEngine';
export * from './memeticPropagationEngine';
export * from './sacredValuesMapper';
export * from './elicitationTechniques';

// Defense Frameworks
export * from './opsecVulnerabilityFramework';
export * from './socialEngineeringPatterns';
export * from './lawfareDefensePlaybook';
export * from './reputationDefenseProtocols';
export * from './familyProtectionMatrix';
export * from './crisisResponsePlaybooks';

// Intelligence Patterns
export * from './behavioralAnomalyPatterns';
export * from './economicWarfareIndicators';
export * from './technicalCountermeasures';
```

### Phase 3: Complete Component Exports (warfare/index.ts)

Add explicit exports for all 19 components to ensure tree-shaking efficiency.

### Phase 4: Register Warfare in Fusion Engine

Add to `FusionEngineType` in FusionResult.ts:
```typescript
// Warfare Engines
| 'mice-recruitment'
| 'betrayal-likelihood'
| 'semantic-warfare'
| 'memetic-propagation'
| 'sacred-values'
| 'elicitation'
| 'cognitive-warfare'
| 'gottman-relationship'
```

Add to `FUSION_ANALYSIS_TYPES` in FusionService.ts:
```typescript
'mice-recruitment': 'mice_recruitment',
'betrayal-likelihood': 'betrayal_likelihood',
'semantic-warfare': 'semantic_warfare',
'memetic-propagation': 'memetic_propagation',
'sacred-values': 'sacred_values',
'elicitation': 'elicitation_guide',
'cognitive-warfare': 'cognitive_warfare',
'gottman-relationship': 'gottman_relationship',
```

Add to `getEdgeFunctionName` mapping:
```typescript
'mice-recruitment': 'mice-recruitment-analyzer',
'betrayal-likelihood': 'betrayal-likelihood-scorer',
'semantic-warfare': 'semantic-warfare-engine',
'memetic-propagation': 'memetic-propagation-engine',
'sacred-values': 'sacred-values-mapper',
'elicitation': 'elicitation-engine',
'cognitive-warfare': 'cognitive-warfare-engine',
'gottman-relationship': 'gottman-relationship-analyzer',
```

### Phase 5: Add Missing Dossier Renderers

Add three new renderer functions to WarfareSectionRenderers.ts:
1. `renderMICE` - MICE vulnerability assessment visualization
2. `renderSacredValues` - Sacred values mapping with domain breakdown
3. `renderElicitation` - Elicitation techniques and recommended approaches

---

## Verification Checklist

After implementation, verify:

1. All 8 warfare edge function results appear in dossier PDF
2. All 19 warfare components are importable from `@/components/intelligence/warfare`
3. All 15 warfare library modules are importable from `@/lib/warfare`
4. `FusionService.executeFusion()` can invoke all 8 warfare engines
5. Build completes with zero TypeScript errors
6. Dossier preview renders MICE, Sacred Values, and Elicitation sections

---

## Success Metrics

| Metric | Before | After |
|--------|--------|-------|
| Warfare sections rendering in dossier | 4/8 | 8/8 |
| Component exports from index | 7/19 | 19/19 |
| Warfare engines in FusionService | 0/8 | 8/8 |
| Library barrel exports | 0/15 | 15/15 |
| TypeScript build errors | 0 | 0 |

---

## Total Changes Summary

- **1 new file** to create
- **5 files** to modify
- **~150 lines** of code changes
- **23 issues** resolved
