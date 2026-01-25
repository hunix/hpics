
# v6.0 Full Intelligence Package Pipeline Expansion Plan
## 40 → 49 Tasks Integration

---

## Executive Summary

This plan adds the **9 new v5.0/v6.0 fusion engines** to the Full Intelligence Package generation pipeline, expanding from 40 to 49 tasks. All implementations follow DDD patterns, correct database schema references, and ensure complete interconnection across the system.

---

## Database Schema Validation

All table/column references verified against production schema:

| Table | Verified Columns |
|-------|------------------|
| `ai_analyses` | `id`, `user_id`, `profile_id`, `analysis_type`, `result`, `generated_at` |
| `trust_trajectories` | `half_life_days`, `decay_rate`, `projected_critical_date`, `reinforcement_urgency` (v6.0 added) |
| `behavioral_anomalies` | `is_zero_day`, `novelty_score`, `matched_known_patterns` (v6.0 added) |
| `opsec_assessments` | `id`, `user_id`, `profile_id`, `assessment_type`, `overall_score`, `exposure_vectors`, `recommendations` |
| `deception_analyses` | `id`, `profile_id`, `deception_score`, `cross_modal_conflicts` |
| `betrayal_predictions` | `trust_score`, `defection_probability`, `loyalty_indicators`, `gottman_horsemen` |
| `psychological_profiles` | `cognitive_profile`, `dark_triad`, `behavioral_predictions` |
| `communications` | `profile_id`, `sentiment_score`, `occurred_at`, `content` |
| `behavioral_baselines` | `baseline_type`, `baseline_data`, `confidence_score` |

---

## Phase 1: Backend Task Registry Expansion

### 1.1 Update `intelligence-session-runner` Edge Function

**File:** `supabase/functions/intelligence-session-runner/index.ts`

Add 9 new tasks to `INTELLIGENCE_TASKS` array (lines 11-65):

```typescript
// NEW: Advanced Fusion Intelligence (Priority 8) - 4 v5.0 tasks
{ name: 'Biometric-Behavioral Fusion', edgeFunction: 'biometric-behavioral-fusion', analysisType: 'biometric_behavioral_fusion', category: 'fusion', priority: 8, complexity: 'complex' },
{ name: 'Geospatial-Communication Fusion', edgeFunction: 'geospatial-communication-fusion', analysisType: 'geospatial_communication_fusion', category: 'fusion', priority: 8, complexity: 'complex' },
{ name: 'Financial-Document Synthesis', edgeFunction: 'financial-document-synthesis', analysisType: 'financial_document_synthesis', category: 'fusion', priority: 8, complexity: 'standard' },
{ name: 'Calendar Pattern Analyzer', edgeFunction: 'calendar-pattern-analyzer', analysisType: 'calendar_pattern', category: 'fusion', priority: 8, complexity: 'standard' },

// NEW: Advanced Intelligence Systems (Priority 9) - 5 v6.0 tasks
{ name: 'Relationship Half-Life', edgeFunction: 'relationship-half-life-calculator', analysisType: 'relationship_half_life', category: 'intelligence', priority: 9, complexity: 'complex' },
{ name: 'Automated Red Team', edgeFunction: 'automated-red-team-engine', analysisType: 'automated_red_team', category: 'warfare', priority: 9, complexity: 'extreme' },
{ name: 'Multi-Party Deception', edgeFunction: 'multi-party-deception-detector', analysisType: 'multi_party_deception', category: 'warfare', priority: 9, complexity: 'extreme' },
{ name: 'Zero-Day Anomaly', edgeFunction: 'zero-day-anomaly-detector', analysisType: 'zero_day_anomaly', category: 'intelligence', priority: 9, complexity: 'complex' },
{ name: 'Hypergame Theory', edgeFunction: 'hypergame-theory-engine', analysisType: 'hypergame_theory', category: 'intelligence', priority: 9, complexity: 'extreme' },
```

**Total Tasks:** 40 + 9 = **49 tasks**

---

### 1.2 Update Frontend Hook: `useIntelligenceGeneration.ts`

**File:** `src/components/reports/hooks/useIntelligenceGeneration.ts`

Add 9 new tasks to `ALL_INTELLIGENCE_TASKS` array (after line 171):

```typescript
// NEW: Advanced Fusion Intelligence (Priority 8) - 4 v5.0 tasks
{ name: 'Biometric-Behavioral Fusion', edgeFunction: 'biometric-behavioral-fusion', analysisType: 'biometric_behavioral_fusion', required: false, category: 'fusion', priority: 8 },
{ name: 'Geospatial-Communication Fusion', edgeFunction: 'geospatial-communication-fusion', analysisType: 'geospatial_communication_fusion', required: false, category: 'fusion', priority: 8 },
{ name: 'Financial-Document Synthesis', edgeFunction: 'financial-document-synthesis', analysisType: 'financial_document_synthesis', required: false, category: 'fusion', priority: 8 },
{ name: 'Calendar Pattern Analyzer', edgeFunction: 'calendar-pattern-analyzer', analysisType: 'calendar_pattern', required: false, category: 'fusion', priority: 8 },

// NEW: Advanced Intelligence Systems (Priority 9) - 5 v6.0 tasks
{ name: 'Relationship Half-Life', edgeFunction: 'relationship-half-life-calculator', analysisType: 'relationship_half_life', required: false, category: 'fusion', priority: 9 },
{ name: 'Automated Red Team', edgeFunction: 'automated-red-team-engine', analysisType: 'automated_red_team', required: false, category: 'warfare', priority: 9 },
{ name: 'Multi-Party Deception', edgeFunction: 'multi-party-deception-detector', analysisType: 'multi_party_deception', required: false, category: 'warfare', priority: 9 },
{ name: 'Zero-Day Anomaly', edgeFunction: 'zero-day-anomaly-detector', analysisType: 'zero_day_anomaly', required: false, category: 'fusion', priority: 9 },
{ name: 'Hypergame Theory', edgeFunction: 'hypergame-theory-engine', analysisType: 'hypergame_theory', required: false, category: 'fusion', priority: 9 },
```

Update version comment to v5.3.0:
```typescript
/**
 * Intelligence Generation Hook v5.3.0
 * Handles pre-generation of intelligence data before PDF export
 * 
 * v5.3.0: Added 9 new v5.0/v6.0 fusion engines (49 total tasks)
 * v5.2.0: Synced 40 tasks with backend intelligence-session-runner
 */
```

---

## Phase 2: ANALYSIS_TYPE_ALIASES Update

### 2.1 Update `sectionDataCheck.ts`

**File:** `src/components/reports/utils/sectionDataCheck.ts`

Add new aliases for v5.0/v6.0 sections (after line 100):

```typescript
// v5.0 Data Fusion Sections
biometricFusion: ['biometric_behavioral_fusion', 'behavioral_dna'],
calendarIntelligence: ['calendar_pattern', 'vulnerability_window'],
geospatialCommunication: ['geospatial_communication_fusion', 'network_exploitation'],
financialDocumentSynthesis: ['financial_document_synthesis', 'economic_warfare'],

// v6.0 Advanced Intelligence Sections
relationshipHalfLife: ['relationship_half_life', 'relationship_trajectory'],
redTeamAssessment: ['automated_red_team', 'opsec_assessment'],
multiPartyDeception: ['multi_party_deception', 'enhanced_deception_detection'],
zeroDayAnomalies: ['zero_day_anomaly', 'behavioral_baseline'],
hypergameAnalysis: ['hypergame_theory', 'behavioral_prediction'],
```

Add new section checks (after line 205):

```typescript
// v5.0 Data Fusion sections
biometricFusion: () => !!(data.biometricFusionData?.length),
calendarIntelligence: () => !!(data.calendarIntelligenceData?.length),
geospatialCommunication: () => !!(data.geospatialCommunicationData?.length),
financialDocumentSynthesis: () => !!(data.financialDocumentSynthesisData?.length),

// v6.0 Advanced Intelligence sections
relationshipHalfLife: () => !!(data.relationshipHalfLifeData?.length),
redTeamAssessment: () => !!(data.automatedRedTeamData?.length),
multiPartyDeception: () => !!(data.multiPartyDeceptionData?.length),
zeroDayAnomalies: () => !!(data.zeroDayAnomalyData?.length),
hypergameAnalysis: () => !!(data.hypergameTheoryData?.length),
```

---

## Phase 3: Library Enhancements

### 3.1 Enhance Game Theory Engine

**File:** `src/lib/intelligence/gameTheoryEngine.ts`

Add hypergame modeling interfaces and functions (after line 426):

```typescript
// ============== HYPERGAME THEORY EXTENSIONS (v6.0) ==============

export interface HypergameLevel {
  level: number;
  perceiver: string;
  perceivedGame: StrategicInteraction;
  beliefs: Map<string, number>; // Beliefs about other players' strategies
}

export interface PerceptionGap {
  dimension: 'game_type' | 'strategy_space' | 'payoffs' | 'player_rationality';
  ourView: unknown;
  theirLikelyView: unknown;
  divergence: number; // 0-1
  exploitability: number; // 0-1
}

export interface HypergameAnalysis {
  levels: HypergameLevel[];
  perceptionGaps: PerceptionGap[];
  exploitableAsymmetries: string[];
  informationAdvantages: string[];
  informationVulnerabilities: string[];
  optimalDeceptionStrategies: string[];
}

/**
 * Analyze hypergame where players have different perceptions of the game
 */
export function analyzeHypergame(
  ourView: StrategicInteraction,
  theirLikelyView: StrategicInteraction,
  cognitiveProfile: Record<string, number>
): HypergameAnalysis {
  const levels: HypergameLevel[] = [];
  const perceptionGaps: PerceptionGap[] = [];
  const exploitableAsymmetries: string[] = [];
  
  // Level 0: Our perception
  levels.push({
    level: 0,
    perceiver: 'us',
    perceivedGame: ourView,
    beliefs: new Map(),
  });
  
  // Level 1: Their perception
  levels.push({
    level: 1,
    perceiver: 'them',
    perceivedGame: theirLikelyView,
    beliefs: new Map(),
  });
  
  // Detect game type mismatch
  if (ourView.game_type !== theirLikelyView.game_type) {
    perceptionGaps.push({
      dimension: 'game_type',
      ourView: ourView.game_type,
      theirLikelyView: theirLikelyView.game_type,
      divergence: 1.0,
      exploitability: 0.8,
    });
    exploitableAsymmetries.push(`They think this is ${theirLikelyView.game_type} but it's actually ${ourView.game_type}`);
  }
  
  // Detect strategy space mismatch
  const ourStrategies = ourView.strategies_per_player[0]?.length || 0;
  const theirViewStrategies = theirLikelyView.strategies_per_player[0]?.length || 0;
  if (ourStrategies !== theirViewStrategies) {
    perceptionGaps.push({
      dimension: 'strategy_space',
      ourView: ourStrategies,
      theirLikelyView: theirViewStrategies,
      divergence: Math.abs(ourStrategies - theirViewStrategies) / Math.max(ourStrategies, theirViewStrategies),
      exploitability: 0.6,
    });
    exploitableAsymmetries.push('Hidden strategies available that opponent is unaware of');
  }
  
  // Analyze cognitive biases for exploitation
  const biasExploits: string[] = [];
  if (cognitiveProfile.overconfidence > 0.6) {
    biasExploits.push('Exploit overconfidence with unexpected defection');
  }
  if (cognitiveProfile.loss_aversion > 0.7) {
    biasExploits.push('Frame options to emphasize potential losses');
  }
  if (cognitiveProfile.anchoring > 0.5) {
    biasExploits.push('Set initial anchor points to bias negotiations');
  }
  
  return {
    levels,
    perceptionGaps,
    exploitableAsymmetries,
    informationAdvantages: exploitableAsymmetries,
    informationVulnerabilities: [], // Would require reverse analysis
    optimalDeceptionStrategies: biasExploits,
  };
}

/**
 * Calculate perception gap exploitability score
 */
export function calculateGapExploitability(gaps: PerceptionGap[]): number {
  if (gaps.length === 0) return 0;
  
  const weights: Record<string, number> = {
    game_type: 0.4,
    strategy_space: 0.3,
    payoffs: 0.2,
    player_rationality: 0.1,
  };
  
  let totalScore = 0;
  let totalWeight = 0;
  
  for (const gap of gaps) {
    const weight = weights[gap.dimension] || 0.1;
    totalScore += gap.exploitability * weight;
    totalWeight += weight;
  }
  
  return totalWeight > 0 ? totalScore / totalWeight : 0;
}
```

---

### 3.2 Enhance Betrayal Predictor Library

**File:** `src/lib/warfare/betrayalPredictor.ts`

Add half-life calculation functions (after line 371):

```typescript
// ============== TRUST HALF-LIFE EXTENSIONS (v6.0) ==============

export interface HalfLifeProjection {
  currentTrust: number;
  halfLifeDays: number;
  decayRate: number;
  decayCurve: Array<{ date: string; trust: number }>;
  criticalDate: string | null;
  reinforcementActions: string[];
  urgency: 'immediate' | 'soon' | 'scheduled' | 'none';
}

// Default half-lives by relationship type (in days)
export const RELATIONSHIP_HALF_LIVES: Record<string, number> = {
  professional: 14,
  personal: 30,
  intimate: 60,
  strategic_asset: 7,
  casual: 21,
  family: 90,
  competitor: 5,
};

/**
 * Calculate trust half-life based on relationship type and interaction history
 */
export function calculateTrustHalfLife(
  relationshipType: keyof typeof RELATIONSHIP_HALF_LIVES,
  interactionHistory: Array<{ date: string; type: 'positive' | 'negative' | 'neutral' }>,
  currentTrust: number
): HalfLifeProjection {
  const baseHalfLife = RELATIONSHIP_HALF_LIVES[relationshipType] || 21;
  
  // Adjust half-life based on interaction quality ratio
  const positiveCount = interactionHistory.filter(i => i.type === 'positive').length;
  const negativeCount = interactionHistory.filter(i => i.type === 'negative').length;
  const total = interactionHistory.length || 1;
  
  const qualityRatio = (positiveCount - negativeCount) / total;
  const adjustedHalfLife = baseHalfLife * (1 + qualityRatio * 0.5); // ±50% adjustment
  
  // Calculate decay rate (exponential decay constant)
  const decayRate = Math.LN2 / adjustedHalfLife;
  
  // Project decay curve for 90 days
  const decayCurve = projectTrustDecay(currentTrust, adjustedHalfLife, 90);
  
  // Find critical date (trust < 0.3)
  const criticalPoint = decayCurve.find(p => p.trust < 0.3);
  const criticalDate = criticalPoint?.date || null;
  
  // Determine urgency and actions
  const daysUntilCritical = criticalDate 
    ? Math.ceil((new Date(criticalDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  
  let urgency: HalfLifeProjection['urgency'] = 'none';
  const reinforcementActions: string[] = [];
  
  if (daysUntilCritical !== null) {
    if (daysUntilCritical <= 7) {
      urgency = 'immediate';
      reinforcementActions.push('Schedule urgent in-person meeting');
      reinforcementActions.push('Provide unexpected value/gift');
      reinforcementActions.push('Address any outstanding grievances');
    } else if (daysUntilCritical <= 21) {
      urgency = 'soon';
      reinforcementActions.push('Increase communication frequency');
      reinforcementActions.push('Plan shared activity or project');
    } else if (daysUntilCritical <= 45) {
      urgency = 'scheduled';
      reinforcementActions.push('Schedule regular check-ins');
      reinforcementActions.push('Maintain positive interaction ratio');
    }
  }
  
  return {
    currentTrust,
    halfLifeDays: Math.round(adjustedHalfLife),
    decayRate,
    decayCurve,
    criticalDate,
    reinforcementActions,
    urgency,
  };
}

/**
 * Project trust decay over time using exponential decay model
 * Formula: T(t) = T₀ × (0.5)^(t/h) where h = half-life in days
 */
export function projectTrustDecay(
  initialTrust: number,
  halfLifeDays: number,
  projectionDays: number
): Array<{ date: string; trust: number }> {
  const curve: Array<{ date: string; trust: number }> = [];
  const now = new Date();
  
  for (let day = 0; day <= projectionDays; day += 1) {
    const futureDate = new Date(now);
    futureDate.setDate(futureDate.getDate() + day);
    
    // Exponential decay formula
    const trust = initialTrust * Math.pow(0.5, day / halfLifeDays);
    
    curve.push({
      date: futureDate.toISOString().split('T')[0],
      trust: Math.max(0, Math.round(trust * 1000) / 1000), // Round to 3 decimals
    });
  }
  
  return curve;
}

/**
 * Calculate reinforcement effectiveness
 */
export function calculateReinforcementImpact(
  currentTrust: number,
  reinforcementType: 'positive_interaction' | 'shared_experience' | 'mutual_investment' | 'crisis_support',
  relationshipType: keyof typeof RELATIONSHIP_HALF_LIVES
): { newTrust: number; halfLifeExtension: number } {
  const impactFactors: Record<string, { trustBoost: number; halfLifeExtension: number }> = {
    positive_interaction: { trustBoost: 0.05, halfLifeExtension: 2 },
    shared_experience: { trustBoost: 0.10, halfLifeExtension: 5 },
    mutual_investment: { trustBoost: 0.15, halfLifeExtension: 10 },
    crisis_support: { trustBoost: 0.25, halfLifeExtension: 20 },
  };
  
  const impact = impactFactors[reinforcementType] || { trustBoost: 0.02, halfLifeExtension: 1 };
  
  return {
    newTrust: Math.min(1.0, currentTrust + impact.trustBoost),
    halfLifeExtension: impact.halfLifeExtension,
  };
}
```

---

## Phase 4: Type Definitions Update

### 4.1 Update `ExtendedDossierData` Type

**File:** `src/components/reports/sections/renderers/types.ts`

Add new data fields for v5.0/v6.0 sections:

```typescript
// v5.0 Data Fusion fields
biometricFusionData?: unknown[];
calendarIntelligenceData?: unknown[];
geospatialCommunicationData?: unknown[];
financialDocumentSynthesisData?: unknown[];

// v6.0 Advanced Intelligence fields (already added)
relationshipHalfLifeData?: unknown[];
automatedRedTeamData?: unknown[];
multiPartyDeceptionData?: unknown[];
zeroDayAnomalyData?: unknown[];
hypergameTheoryData?: unknown[];
```

---

## Phase 5: Renderers Export Update

### 5.1 Update Renderers Index

**File:** `src/components/reports/sections/renderers/index.ts`

Ensure all v5.0/v6.0 renderers are properly exported:

```typescript
// v5.0 Fusion Section Renderers
export {
  renderBiometricFusion,
  renderCalendarIntelligence,
  renderGeospatialCommunication,
  renderFinancialDocumentSynthesis,
} from './FusionSectionRenderers';

// v6.0 Advanced Intelligence Renderers
export {
  renderRelationshipHalfLife,
  renderRedTeamAssessment,
  renderMultiPartyDeception,
  renderZeroDayAnomalies,
  renderHypergameAnalysis,
  advancedIntelligenceSectionRenderers,
} from './AdvancedIntelligenceRenderers';
```

---

## Phase 6: Version Management

### 6.1 Update App Version

**File:** `src/lib/appVersion.ts`

Increment version to v3.9.50 to trigger cache clearing:

```typescript
export const APP_VERSION = '3.9.50';

// Add to FORCE_CLEAR_VERSIONS if breaking changes
export const FORCE_CLEAR_VERSIONS = ['3.9.33', '3.9.40', '3.9.50'];
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/intelligence-session-runner/index.ts` | Add 9 tasks to INTELLIGENCE_TASKS array (lines 11-65) |
| `src/components/reports/hooks/useIntelligenceGeneration.ts` | Add 9 tasks to ALL_INTELLIGENCE_TASKS, update version |
| `src/components/reports/utils/sectionDataCheck.ts` | Add 9 new ANALYSIS_TYPE_ALIASES + section checks |
| `src/lib/intelligence/gameTheoryEngine.ts` | Add HypergameAnalysis interfaces and analyzeHypergame function |
| `src/lib/warfare/betrayalPredictor.ts` | Add HalfLifeProjection, calculateTrustHalfLife, projectTrustDecay |
| `src/components/reports/sections/renderers/types.ts` | Add 9 new data fields to ExtendedDossierData |
| `src/components/reports/sections/renderers/index.ts` | Ensure all v5.0/v6.0 renderers exported |
| `src/lib/appVersion.ts` | Increment to v3.9.50 |

---

## Implementation Order

1. **Update backend task registry** (`intelligence-session-runner`)
2. **Update frontend task definitions** (`useIntelligenceGeneration.ts`)
3. **Update ANALYSIS_TYPE_ALIASES** (`sectionDataCheck.ts`)
4. **Enhance gameTheoryEngine.ts** with hypergame functions
5. **Enhance betrayalPredictor.ts** with half-life functions
6. **Update type definitions** (`types.ts`)
7. **Update renderers export** (`index.ts`)
8. **Increment app version** and deploy

---

## Expected Outcomes

After implementation:

1. **Full Intelligence Package** expands from 40 → 49 tasks
2. **All 9 new engines** auto-execute during "Generate Full Intelligence" workflow
3. **83 dossier sections** fully populated with new analysis types
4. **Proper persistence** via upsert to `ai_analyses` table with unique `analysis_type` keys
5. **Export-ready** with PDF renderers for all new sections
6. **Library enhancements** provide client-side hypergame and half-life calculations
7. **Session recovery** works for all 49 tasks via `useIntelligenceSession`

---

## Verification Checklist

- [ ] Backend INTELLIGENCE_TASKS has 49 entries
- [ ] Frontend ALL_INTELLIGENCE_TASKS has 49 entries (synced)
- [ ] ANALYSIS_TYPE_ALIASES includes all 9 new analysis types
- [ ] checkSectionHasData includes all 9 new section IDs
- [ ] ExtendedDossierData type includes all 9 new data fields
- [ ] All renderers exported from index.ts
- [ ] App version incremented
- [ ] All edge functions have health check support
- [ ] All analysis types use upsert with onConflict
