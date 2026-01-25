
# Advanced Intelligence & Warfare Capabilities - v6.0 Implementation Plan

## Executive Summary

This plan implements **5 advanced intelligence systems** that represent the next evolution of the platform's capabilities. Each system fills a critical gap identified during the audit and integrates seamlessly with existing DDD patterns, fusion engines, and the 78-section dossier.

---

## Systems to Implement

| System | Purpose | Storage Strategy |
|--------|---------|------------------|
| 1. Relationship Half-Life Calculator | Trust decay modeling with exponential decay curves | `trust_trajectories` + `ai_analyses` |
| 2. Automated Red Team (ART) Engine | Self-OPSEC simulation and attack surface analysis | `opsec_assessments` + `ai_analyses` |
| 3. Multi-Party Deception Detection | Collusion and coordinated deception across contacts | `deception_analyses` + `ai_analyses` |
| 4. Zero-Day Anomaly Detector | Novel behavioral pattern detection | `behavioral_anomalies` + `ai_analyses` |
| 5. Hypergame Theory Engine | Multi-level strategic modeling with asymmetric information | `ai_analyses` (new type) |

---

## Architecture Overview

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                        NEW INTELLIGENCE ENGINES (5)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  1. relationship-half-life-calculator  │  Trust decay curves & thresholds  │
│  2. automated-red-team-engine          │  Self-attack simulation           │
│  3. multi-party-deception-detector     │  Collusion detection              │
│  4. zero-day-anomaly-detector          │  Novel pattern recognition        │
│  5. hypergame-theory-engine            │  Asymmetric strategic modeling    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                         INTEGRATION LAYERS                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  • New Fusion Types (FUSION_ANALYSIS_TYPES mapping)                         │
│  • Game Theory Library Enhancements (hypergame support)                     │
│  • Betrayal Predictor Integration (half-life curves)                        │
│  • Counter-Intelligence Monitor Enhancement (ART findings)                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                      DOSSIER INTEGRATION (5 New Sections)                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  • renderRelationshipHalfLife    │  Trust decay visualization              │
│  • renderRedTeamAssessment       │  Attack surface findings                │
│  • renderMultiPartyDeception     │  Collusion network map                  │
│  • renderZeroDayAnomalies        │  Novel pattern alerts                   │
│  • renderHypergameAnalysis       │  Strategic game state visualization     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: New Edge Functions (5 Functions)

### 1.1 `relationship-half-life-calculator` Edge Function

**Purpose:** Calculate trust decay curves using exponential decay models with configurable half-lives based on relationship type and interaction history.

**Data Sources:**
- `trust_trajectories` (existing 180-day trajectory data)
- `betrayal_predictions` (defection probability, loyalty indicators)
- `contact_interaction_notes` (positive/negative interaction counts)
- `communications` (message frequency and sentiment)

**Algorithm:**
- Half-life formula: `T(t) = T₀ × (0.5)^(t/h)` where h = half-life in days
- Half-life varies by relationship type:
  - Professional: 14 days
  - Personal: 30 days
  - Intimate: 60 days
  - Strategic asset: 7 days

**Output Schema:**
```json
{
  "currentTrustLevel": 0.0-1.0,
  "decayRate": 0.0-1.0,
  "halfLifeDays": number,
  "projectedTrustAt30Days": 0.0-1.0,
  "projectedTrustAt90Days": 0.0-1.0,
  "criticalThresholdDate": "ISO-date when trust drops below 0.3",
  "reinforcementNeeded": {
    "urgency": "immediate|soon|scheduled|none",
    "suggestedActions": string[],
    "daysUntilCritical": number
  },
  "decayCurve": [
    { "date": "ISO-date", "projectedTrust": 0.0-1.0 }
  ]
}
```

**Storage:** 
- Updates `trust_trajectories` with decay projections
- Saves to `ai_analyses` with `analysis_type = 'relationship_half_life'`

---

### 1.2 `automated-red-team-engine` Edge Function

**Purpose:** Simulate attacks against the user's own OPSEC posture by analyzing how an adversary would approach exploitation using the user's own data.

**Data Sources:**
- `opsec_assessments` (current vulnerabilities)
- `digital_footprint_items` (exposure points)
- `profiles` (the user's own profile for self-assessment)
- `social_engineering_incidents` (historical attack patterns)

**Simulated Attack Vectors:**
1. Social Engineering (phishing susceptibility)
2. Open Source Intelligence (OSINT) exposure
3. Digital Footprint Exploitation
4. Relationship Mapping (who knows who)
5. Communication Pattern Analysis
6. Physical Security Gaps

**Output Schema:**
```json
{
  "overallVulnerabilityScore": 0-100,
  "attackVectors": [
    {
      "vector": "social_engineering|osint|digital|relationship|communication|physical",
      "exploitability": "trivial|easy|moderate|difficult|expert",
      "attackPath": string[],
      "requiredResources": "low|medium|high",
      "potentialImpact": "critical|high|medium|low",
      "mitigationSteps": string[],
      "timeToExploit": "minutes|hours|days|weeks"
    }
  ],
  "simulatedAttackNarratives": [
    {
      "scenario": string,
      "steps": string[],
      "successProbability": 0.0-1.0,
      "detectability": "low|medium|high"
    }
  ],
  "prioritizedRecommendations": string[],
  "comparisonToBaseline": {
    "improvement": number,
    "newVulnerabilities": number,
    "resolvedVulnerabilities": number
  }
}
```

**Storage:**
- Updates `opsec_assessments` with red team findings
- Saves to `ai_analyses` with `analysis_type = 'automated_red_team'`

---

### 1.3 `multi-party-deception-detector` Edge Function

**Purpose:** Detect coordinated deception or collusion across multiple contacts by correlating timing, content, and behavioral patterns.

**Data Sources:**
- `deception_analyses` (individual deception scores)
- `communications` (message timing and content)
- `contact_relationships` (who knows who)
- `ai_analyses` where `analysis_type = 'cross_modal_deception'`
- `behavioral_anomalies` (synchronized anomalies)

**Detection Patterns:**
1. **Synchronized Messaging:** Multiple contacts messaging about the same topic within a short window
2. **Story Alignment:** Similar narratives from supposedly independent sources
3. **Coordinated Omissions:** Multiple contacts avoiding the same topics
4. **Behavioral Synchronization:** Matching stress/deception patterns during same period
5. **Network Clustering:** Hidden connections revealed through communication patterns

**Output Schema:**
```json
{
  "collusionNetworks": [
    {
      "networkId": "uuid",
      "participants": ["profileId1", "profileId2"],
      "collusionType": "story_alignment|coordinated_approach|information_compartmentalization|joint_manipulation",
      "evidenceStrength": 0.0-1.0,
      "firstDetected": "ISO-date",
      "keyIndicators": string[],
      "communicationOverlap": {
        "temporalAlignment": 0.0-1.0,
        "contentSimilarity": 0.0-1.0,
        "topicOverlap": string[]
      }
    }
  ],
  "isolatedDeceiversCount": number,
  "networkVisualizationData": {
    "nodes": [{ "id": string, "deceptionScore": number }],
    "edges": [{ "source": string, "target": string, "weight": number }]
  },
  "recommendedInterrogationOrder": string[],
  "informationCompartmentalizationMap": Record<string, string[]>
}
```

**Storage:**
- Saves to `ai_analyses` with `analysis_type = 'multi_party_deception'`

---

### 1.4 `zero-day-anomaly-detector` Edge Function

**Purpose:** Detect novel behavioral patterns that don't match any known baseline or historical pattern, indicating potential new threats or opportunities.

**Data Sources:**
- `behavioral_baselines` (established normal patterns)
- `behavioral_anomalies` (historical anomalies for comparison)
- `communications` (recent patterns)
- `contact_observations` (behavioral notes)
- `interaction_biometrics` (physiological patterns)

**Detection Algorithm:**
1. Compare current behavior against all known baselines
2. Compare against historical anomaly patterns
3. If deviation is significant AND doesn't match any known anomaly type → Zero-Day
4. Use isolation forest algorithm for unsupervised anomaly detection
5. Calculate novelty score based on distance from all known patterns

**Output Schema:**
```json
{
  "zeroDayAnomalies": [
    {
      "anomalyId": "uuid",
      "profileId": "uuid",
      "detectedAt": "ISO-date",
      "noveltyScore": 0.0-1.0,
      "description": string,
      "affectedDomains": ["communication", "behavioral", "financial", "social"],
      "baselineDeviations": [
        { "baseline": string, "deviation": number, "direction": "above|below" }
      ],
      "potentialInterpretations": string[],
      "urgency": "critical|high|medium|low",
      "recommendedActions": string[],
      "similarHistoricalPatterns": []
    }
  ],
  "overallNoveltyLevel": "unprecedented|rare|uncommon|normal",
  "environmentalFactors": string[],
  "falsePositiveProbability": 0.0-1.0,
  "escalationRequired": boolean
}
```

**Storage:**
- Creates records in `behavioral_anomalies` with `is_zero_day = true`
- Saves to `ai_analyses` with `analysis_type = 'zero_day_anomaly'`

---

### 1.5 `hypergame-theory-engine` Edge Function

**Purpose:** Model strategic interactions where players have different perceptions of the game being played (asymmetric information warfare).

**Data Sources:**
- `ai_analyses` with game theory results
- `mice_assessments` (motivation/vulnerability mapping)
- `psychological_profiles` (cognitive biases)
- `betrayal_predictions` (defection modeling)
- Existing `gameTheoryEngine.ts` library

**Hypergame Concepts:**
1. **Level-0:** What game I think we're playing
2. **Level-1:** What game you think we're playing
3. **Level-2:** What game I think you think we're playing
4. **Level-N:** Recursive modeling of beliefs about beliefs

**Output Schema:**
```json
{
  "hypergameAnalysis": {
    "ourPerception": {
      "gameType": string,
      "ourStrategies": string[],
      "theirStrategies": string[],
      "perceivedNashEquilibrium": string
    },
    "theirLikelyPerception": {
      "gameType": string,
      "theirStrategies": string[],
      "ourStrategies": string[],
      "theirPerceivedNashEquilibrium": string
    },
    "perceptionGap": {
      "gameTypeMismatch": boolean,
      "strategySpaceMismatch": boolean,
      "payoffMismatch": boolean,
      "exploitabilityScore": 0.0-1.0
    }
  },
  "strategicRecommendations": [
    {
      "strategy": string,
      "exploitsGap": boolean,
      "riskLevel": "low|medium|high",
      "expectedOutcome": string,
      "counterMoves": string[]
    }
  ],
  "informationAdvantages": string[],
  "informationVulnerabilities": string[],
  "optimalDeceptionStrategies": string[],
  "signalingSuggestions": string[]
}
```

**Storage:**
- Saves to `ai_analyses` with `analysis_type = 'hypergame_theory'`

---

## Phase 2: Database Schema Updates

### 2.1 New Columns for Existing Tables

**`trust_trajectories` table - Add:**
```sql
ALTER TABLE trust_trajectories ADD COLUMN IF NOT EXISTS 
  half_life_days numeric,
  decay_rate numeric,
  projected_critical_date date,
  reinforcement_urgency text;
```

**`behavioral_anomalies` table - Add:**
```sql
ALTER TABLE behavioral_anomalies ADD COLUMN IF NOT EXISTS 
  is_zero_day boolean DEFAULT false,
  novelty_score numeric,
  matched_known_patterns jsonb DEFAULT '[]'::jsonb;
```

---

## Phase 3: Domain Layer Updates

### 3.1 Update FusionEngineType

**File:** `src/domains/fusion/entities/FusionResult.ts`

Add new engine types:
```typescript
export type FusionEngineType = 
  | 'temporal-fusion-transformer'
  // ... existing types ...
  | 'calendar-pattern'
  // New v6.0 engines
  | 'relationship-half-life'
  | 'automated-red-team'
  | 'multi-party-deception'
  | 'zero-day-anomaly'
  | 'hypergame-theory';
```

### 3.2 Update FUSION_ANALYSIS_TYPES

**File:** `src/domains/fusion/repositories/IFusionRepository.ts`

Add mappings:
```typescript
export const FUSION_ANALYSIS_TYPES: Record<FusionEngineType, string> = {
  // ... existing ...
  'relationship-half-life': 'relationship_half_life',
  'automated-red-team': 'automated_red_team',
  'multi-party-deception': 'multi_party_deception',
  'zero-day-anomaly': 'zero_day_anomaly',
  'hypergame-theory': 'hypergame_theory',
};
```

### 3.3 Enhance Game Theory Library

**File:** `src/lib/intelligence/gameTheoryEngine.ts`

Add hypergame modeling functions:
```typescript
export interface HypergameLevel {
  level: number;
  perceiver: string;
  perceivedGame: StrategicInteraction;
}

export interface HypergameAnalysis {
  levels: HypergameLevel[];
  perceptionGaps: PerceptionGap[];
  exploitableAsymmetries: string[];
}

export function analyzeHypergame(
  ourView: StrategicInteraction,
  theirLikelyView: StrategicInteraction,
  cognitiveProfile: Record<string, number>
): HypergameAnalysis;
```

### 3.4 Enhance Betrayal Predictor Library

**File:** `src/lib/warfare/betrayalPredictor.ts`

Add half-life calculation functions:
```typescript
export interface HalfLifeProjection {
  currentTrust: number;
  halfLifeDays: number;
  decayCurve: Array<{ date: string; trust: number }>;
  criticalDate: string | null;
  reinforcementActions: string[];
}

export function calculateTrustHalfLife(
  relationshipType: 'professional' | 'personal' | 'intimate' | 'strategic',
  interactionHistory: InteractionEvent[],
  currentTrust: number
): HalfLifeProjection;

export function projectTrustDecay(
  initialTrust: number,
  halfLifeDays: number,
  projectionDays: number
): Array<{ date: string; trust: number }>;
```

---

## Phase 4: Dossier Integration

### 4.1 Update useDossierData.ts

**File:** `src/components/reports/hooks/useDossierData.ts`

Add to DossierDataResult interface:
```typescript
// New v6.0 Intelligence fields
relationshipHalfLifeData: any[];
automatedRedTeamData: any[];
multiPartyDeceptionData: any[];
zeroDayAnomalyData: any[];
hypergameTheoryData: any[];
```

Add Batch 11 queries:
```typescript
// Batch 11: Advanced Intelligence Engine Results (v6.0)
const [
  relationshipHalfLifeData,
  automatedRedTeamData,
  multiPartyDeceptionData,
  zeroDayAnomalyData,
  hypergameTheoryData,
] = await Promise.all([
  supabase.from('ai_analyses').select('*').eq('profile_id', profileId)
    .eq('analysis_type', 'relationship_half_life').limit(1),
  supabase.from('ai_analyses').select('*').eq('profile_id', profileId)
    .eq('analysis_type', 'automated_red_team').limit(1),
  supabase.from('ai_analyses').select('*').eq('profile_id', profileId)
    .eq('analysis_type', 'multi_party_deception').limit(1),
  supabase.from('ai_analyses').select('*').eq('profile_id', profileId)
    .eq('analysis_type', 'zero_day_anomaly').limit(1),
  supabase.from('ai_analyses').select('*').eq('profile_id', profileId)
    .eq('analysis_type', 'hypergame_theory').limit(1),
]);
```

### 4.2 New Section Renderers

**File:** `src/components/reports/sections/renderers/AdvancedIntelligenceRenderers.ts` (NEW)

Create 5 new renderers:
1. `renderRelationshipHalfLife` - Trust decay curve visualization with critical threshold
2. `renderRedTeamAssessment` - Attack vector matrix and exploitation paths
3. `renderMultiPartyDeception` - Collusion network visualization
4. `renderZeroDayAnomalies` - Novel pattern alert cards
5. `renderHypergameAnalysis` - Strategic perception gap visualization

### 4.3 Update Section Definitions

**File:** `src/components/reports/sections/sectionDefinitions.ts`

Add 5 new sections:
```typescript
// ============== ADVANCED INTELLIGENCE SECTIONS (v6.0) ==============
{ id: 'relationshipHalfLife', label: 'Relationship Half-Life Analysis', icon: Clock, enabled: true, category: 'analysis' },
{ id: 'redTeamAssessment', label: 'Automated Red Team Assessment', icon: Shield, enabled: true, category: 'warfare' },
{ id: 'multiPartyDeception', label: 'Multi-Party Deception Network', icon: Users, enabled: true, category: 'warfare' },
{ id: 'zeroDayAnomalies', label: 'Zero-Day Anomaly Detection', icon: AlertTriangle, enabled: true, category: 'analysis' },
{ id: 'hypergameAnalysis', label: 'Hypergame Strategic Analysis', icon: Brain, enabled: true, category: 'intelligence' },
```

---

## Phase 5: UI Integration

### 5.1 Enhanced Counter-Intelligence Dashboard

Update `/defense-grid` to include:
- Red Team findings panel
- Multi-party deception network visualization
- Zero-day anomaly alerts

### 5.2 Trust Trajectory Enhancements

Update trust visualization components to show:
- Half-life decay curves
- Critical threshold warnings
- Reinforcement action recommendations

### 5.3 Strategic Intelligence Panel

Create new component for hypergame visualization:
- Perception gap diagrams
- Strategy recommendation cards
- Information advantage indicators

---

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/relationship-half-life-calculator/index.ts` | Trust decay modeling |
| `supabase/functions/automated-red-team-engine/index.ts` | Self-OPSEC simulation |
| `supabase/functions/multi-party-deception-detector/index.ts` | Collusion detection |
| `supabase/functions/zero-day-anomaly-detector/index.ts` | Novel pattern detection |
| `supabase/functions/hypergame-theory-engine/index.ts` | Asymmetric game modeling |
| `src/components/reports/sections/renderers/AdvancedIntelligenceRenderers.ts` | New PDF renderers |

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/config.toml` | Register 5 new edge functions |
| `src/domains/fusion/entities/FusionResult.ts` | Add 5 new FusionEngineType values |
| `src/domains/fusion/repositories/IFusionRepository.ts` | Add FUSION_ANALYSIS_TYPES mappings |
| `src/domains/fusion/services/FusionService.ts` | Add engine → function mappings |
| `src/lib/intelligence/gameTheoryEngine.ts` | Add hypergame analysis functions |
| `src/lib/warfare/betrayalPredictor.ts` | Add half-life calculation functions |
| `src/components/reports/hooks/useDossierData.ts` | Add Batch 11 + interface fields |
| `src/components/reports/sections/renderers/index.ts` | Export new renderers |
| `src/components/reports/sections/sectionDefinitions.ts` | Add 5 new sections |

---

## Expected Outcomes

After implementation:

1. **Relationship Half-Life Calculator**
   - Predictive trust decay with exponential curves
   - Critical threshold warnings before trust collapse
   - Actionable reinforcement recommendations

2. **Automated Red Team Engine**
   - Self-attack simulation revealing exploitation paths
   - Prioritized vulnerability mitigation
   - OPSEC improvement tracking over time

3. **Multi-Party Deception Detection**
   - Collusion network identification
   - Coordinated manipulation detection
   - Optimal interrogation ordering

4. **Zero-Day Anomaly Detector**
   - Novel threat pattern recognition
   - Reduced false positive rate through isolation forest
   - Unprecedented behavior alerts

5. **Hypergame Theory Engine**
   - Asymmetric information exploitation
   - Strategic perception gap analysis
   - Optimal deception strategy recommendations

6. **Dossier Expansion**
   - 78 → 83 sections (5 new intelligence sections)
   - Enhanced fusion template with all new engines

---

## Implementation Order

1. Create database migrations for new columns
2. Create 5 new edge functions (parallel)
3. Update domain layer types and mappings
4. Enhance gameTheoryEngine.ts and betrayalPredictor.ts libraries
5. Update useDossierData.ts with Batch 11
6. Create AdvancedIntelligenceRenderers.ts
7. Update sectionDefinitions.ts and renderers/index.ts
8. Deploy and test health checks
9. Update Fusion Command Center UI
