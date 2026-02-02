# HPICS Intelligence Platform
## Complete System Reference Guide

> **Version 3.8.0** | **Enterprise-Grade Strategic Intelligence Platform**  
> Last Updated: February 2026

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Core Platform Capabilities](#2-core-platform-capabilities)
3. [AGIS Framework (22 Phases)](#3-agis-framework-22-phases)
4. [Edge Function Reference](#4-edge-function-reference)
5. [Database Schema Reference](#5-database-schema-reference)
6. [React Hooks Reference](#6-react-hooks-reference)
7. [Hardware Integration Guide](#7-hardware-integration-guide)
8. [UI/UX Component Reference](#8-uiux-component-reference)
9. [Security & Compliance](#9-security--compliance)
10. [Real-Life Use Cases](#10-real-life-use-cases)

---

# 1. Executive Summary

## 1.1 Platform Overview

The **Hyper-Personalized Intelligence & Contact System (HPICS)** is an enterprise-grade strategic intelligence platform designed for comprehensive relationship intelligence, behavioral analysis, and predictive operations. Built on a Domain-Driven Design architecture with React 18, TypeScript, and Lovable Cloud backend.

### Mission Statement
*To provide unparalleled insight into human behavior, relationships, and influence dynamics through the fusion of artificial intelligence, behavioral science, and multi-modal biometric analysis.*

## 1.2 System Statistics At-a-Glance

| Metric | Count |
|--------|-------|
| **Database Tables** | 508+ |
| **Edge Functions** | 407+ |
| **Application Pages** | 75+ |
| **React Hooks** | 100+ |
| **UI Components** | 150+ |
| **AGIS Phases** | 22 |
| **Biometric Modalities** | 7 |
| **Hardware Device Types** | 7 |
| **Intelligence Analysis Types** | 94+ |
| **Dossier Sections** | 124 |

## 1.3 Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18 + Vite + TypeScript |
| **Styling** | Tailwind CSS + shadcn/ui |
| **State Management** | TanStack Query (React Query v5) |
| **Backend** | Lovable Cloud (Supabase) |
| **AI/ML** | Lovable AI (Gemini, GPT-5) |
| **Visualization** | D3.js, Recharts |
| **Architecture** | Domain-Driven Design (DDD) |

## 1.4 Quick-Start Guide

### First-Time Setup

1. **Access Dashboard**: Navigate to the main dashboard at `/dashboard`
2. **Create Your First Contact**: Click "Add Contact" and fill in profile details
3. **Run Intelligence Analysis**: Select a contact and click "Run Analysis"
4. **View Results**: Check the Intelligence Hub for AI-generated insights

### Key Navigation

| Page | Purpose |
|------|---------|
| `/dashboard` | Main command center with overview widgets |
| `/contacts` | Contact management and search |
| `/intelligence-hub` | AI analysis tools and insights |
| `/network` | Relationship graph visualization |
| `/analysis/*` | Specialized analysis tools |
| `/agis/*` | AGIS phase dashboards |

---

# 2. Core Platform Capabilities

## 2.1 Contact Management System

The contact management system is the foundation of HPICS, providing comprehensive profile management with 50+ data fields per contact.

### 2.1.1 Profile Fields

**Basic Information:**
- First Name, Last Name, Full Name
- Organization, Job Title
- Email (primary and secondary)
- Phone numbers (mobile, work, home)
- Physical addresses
- Avatar/Profile photo

**Relationship Metadata:**
- Relationship Type: `family`, `friend`, `colleague`, `professional`, `acquaintance`, `target`, `asset`, `unknown`
- Relationship Strength (0.0 - 1.0)
- Trust Level: `low`, `medium`, `high`, `very_high`
- First Met Date, Last Interaction Date

**Psychological Profile:**
- Big Five (OCEAN) scores
- Attachment Style: `secure`, `anxious`, `avoidant`, `disorganized`
- Communication Style: `analytical`, `driver`, `expressive`, `amiable`
- Dark Triad scores (when applicable)

**Intelligence Metadata:**
- Clearance Level: `unclassified`, `confidential`, `secret`, `top_secret`
- Profile Status: `active`, `inactive`, `archived`, `under_analysis`, `flagged`
- Completeness Score (0-100%)
- Data Quality Score

### 2.1.2 Relationship Mapping

Create explicit relationships between contacts:

```typescript
// Example: Creating a relationship
const relationship = {
  source_profile_id: "uuid-person-a",
  target_profile_id: "uuid-person-b",
  relationship_type: "colleague",
  strength: 0.8,
  is_bidirectional: true,
  notes: "Work together at TechCorp"
};
```

**Relationship Types:**
- **Professional**: Colleagues, business partners, clients
- **Personal**: Friends, family, romantic
- **Strategic**: Targets, assets, adversaries
- **Network**: Acquaintances, referrals, influencers

### 2.1.3 Communication Tracking

All communications are tracked in the `communications` table:

| Field | Type | Description |
|-------|------|-------------|
| `profile_id` | UUID | Associated contact |
| `channel` | string | email, phone, sms, in_person, social |
| `direction` | string | inbound, outbound |
| `content` | text | Message content |
| `sentiment_score` | float | -1.0 to 1.0 |
| `occurred_at` | timestamp | When communication happened |

### 2.1.4 Life Timeline & Milestones

Track significant events in a contact's life:

- **Career Events**: Job changes, promotions, layoffs
- **Personal Events**: Marriage, divorce, births, deaths
- **Financial Events**: Investments, purchases, inheritance
- **Health Events**: Illnesses, surgeries, recoveries
- **Location Events**: Moves, travel, relocations

### 2.1.5 Smart Tags & Groups

**Tags**: Free-form labels for categorization
- `#high-value`, `#investor`, `#competitor`, `#warm-lead`

**Groups**: Organized collections with metadata
- Sales Pipeline, Family Circle, Project Team, Watch List

### 2.1.6 Profile Completeness Scoring

The system calculates completeness based on filled fields:

```
Completeness = (Filled Fields / Total Expected Fields) × 100

Scoring Weights:
- Basic Info (name, email): 30%
- Contact Details (phone, address): 20%
- Professional Info (job, company): 20%
- Psychological Profile: 15%
- Relationship Metadata: 15%
```

### 2.1.7 Duplicate Detection & Merging

Automatic detection using:
- Email matching (exact)
- Name similarity (fuzzy, >85% match)
- Phone number normalization
- LinkedIn URL matching

**Merge Process:**
1. Identify potential duplicates
2. Review side-by-side comparison
3. Select primary record
4. Merge data (keeps most recent/complete)
5. Archive secondary record

---

## 2.2 Intelligence Analysis Engine

### 2.2.1 AI-Powered Semantic Search (RAG)

The system uses Retrieval-Augmented Generation for intelligent queries:

```typescript
// Example: Semantic search query
const result = await supabase.functions.invoke('rag-query-v3', {
  body: {
    userId: user.id,
    profileId: contact.id,
    query: "What are their main concerns about the merger?",
    includeRelated: true
  }
});
```

**Capabilities:**
- Natural language queries across all contact data
- Context-aware responses with source citations
- Cross-contact correlation
- Temporal awareness (recency weighting)

### 2.2.2 Entity Extraction & Linking

Automatic extraction from communications:

| Entity Type | Examples |
|-------------|----------|
| **People** | Names, titles, relationships |
| **Organizations** | Companies, teams, institutions |
| **Locations** | Cities, addresses, venues |
| **Dates** | Meetings, deadlines, events |
| **Financial** | Amounts, transactions, valuations |
| **Topics** | Key subjects, concerns, interests |

### 2.2.3 Cross-Contact Pattern Detection

**Edge Function:** `detect-cross-contact-patterns`

Identifies hidden connections:
- Shared employers (past or present)
- Common events or locations
- Communication clusters
- Social overlap
- Temporal correlations

**Output:**
```json
{
  "patterns": [
    {
      "pattern_type": "shared_employer",
      "profile_ids": ["uuid-1", "uuid-2", "uuid-3"],
      "confidence_score": 0.92,
      "description": "All three worked at Goldman Sachs 2018-2020",
      "evidence": { "company": "Goldman Sachs", "overlap_period": "2018-2020" }
    }
  ]
}
```

### 2.2.4 Sentiment Timeline Tracking

Track emotional trajectory over time:

```typescript
// Sentiment data structure
interface SentimentPoint {
  date: Date;
  sentiment_score: number; // -1.0 to 1.0
  communication_id: string;
  channel: string;
  key_phrases: string[];
}
```

**Visualization:** Line chart showing sentiment trends with:
- 7-day moving average
- Anomaly highlights
- Event correlations

### 2.2.5 Behavioral Anomaly Detection

**Edge Function:** `detect-anomalies`

Monitors for deviations from baseline:

| Anomaly Type | Detection Method |
|--------------|------------------|
| **Communication Frequency Drop** | >2σ deviation from 30-day average |
| **Sentiment Shift** | Sustained change >0.3 over 7+ days |
| **Response Time Change** | >50% increase in response latency |
| **Channel Switch** | Unexpected change in preferred channel |
| **Language Pattern Change** | Formality or vocabulary shifts |

### 2.2.6 Predictive Analytics

**Churn Prediction** (`predict-churn-enhanced`):
- Predicts relationship deterioration
- Identifies contributing factors
- Suggests intervention strategies

**Betrayal Prediction** (`betrayal-likelihood-scorer`):
- Assesses loyalty risk
- Identifies warning signals
- Calculates trust half-life

**Opportunity Detection** (`detect-influence-opportunities`):
- Finds optimal engagement moments
- Suggests approach strategies
- Predicts success probability

---

## 2.3 Biometric Intelligence Suite

### 2.3.1 Facial Recognition

**Edge Functions:** `extract-facial-biometrics`, `analyze-facial`

**Capabilities:**
- Face detection and localization
- 512-dimensional embedding extraction
- Identity verification (1:1 matching)
- Identity search (1:N matching)
- Emotion detection (7 basic emotions)
- Micro-expression analysis

**Enrollment Process:**
1. Upload clear frontal photo or video
2. Face detection and quality check
3. Embedding extraction
4. Storage in `face_embeddings` table

**Matching:**
```typescript
const match = await supabase.functions.invoke('match-biometrics', {
  body: {
    userId: user.id,
    modalityType: 'facial',
    probeEmbedding: newFaceEmbedding,
    threshold: 0.75
  }
});
// Returns: { matches: [{ profile_id, confidence, name }] }
```

### 2.3.2 Voice Biometrics

**Edge Functions:** `extract-voice-biometrics`, `analyze-vocal`

**Capabilities:**
- Speaker identification
- Voice embedding (256-dimensional)
- Stress detection (vocal tremor analysis)
- Deception indicators (pitch variance, pauses)
- Emotional state assessment

**Voice Signature Storage:**
```sql
-- voice_signatures table
- profile_id: UUID
- embedding: vector(256)
- sample_duration_seconds: float
- noise_level: float
- confidence_score: float
```

### 2.3.3 Gait Analysis

**Edge Function:** `analyze-gait-pattern`

Walking pattern identification from video:
- Stride length
- Cadence (steps per minute)
- Arm swing symmetry
- Posture angles
- Speed variations

**Use Cases:**
- Surveillance footage identification
- Health status assessment
- Behavioral state inference

### 2.3.4 Keystroke Dynamics

**Edge Function:** `keystroke-dynamics-analyzer`

Typing rhythm behavioral verification:

| Metric | Description |
|--------|-------------|
| **Dwell Time** | Key press duration |
| **Flight Time** | Time between keystrokes |
| **Digraph Latency** | Common key pair timing |
| **Typing Speed** | Words per minute |
| **Error Rate** | Backspace frequency |

### 2.3.5 Signature Analysis

**Edge Function:** `extract-signature-biometrics`

Handwriting verification:
- Stroke velocity
- Pressure patterns
- Pen lift frequency
- Signature geometry
- Consistency scoring

### 2.3.6 Body Biometrics

**Edge Function:** `extract-body-biometrics`

Physical measurements and posture:
- Height estimation
- Shoulder width
- Posture classification
- Gesture patterns
- Movement style

### 2.3.7 Cross-Modal Fusion

**Edge Function:** `cross-modal-fusion-realtime`

Combines multiple biometric modalities for 98%+ accuracy:

```typescript
const fusion = await supabase.functions.invoke('cross-modal-fusion-realtime', {
  body: {
    userId: user.id,
    modalities: {
      facial: { embedding: faceVector, confidence: 0.92 },
      voice: { embedding: voiceVector, confidence: 0.88 },
      gait: { embedding: gaitVector, confidence: 0.76 }
    },
    fusionMethod: 'weighted_bayesian'
  }
});
// Returns: { identity: { profile_id, overall_confidence: 0.98 } }
```

---

## 2.4 Network Intelligence System

### 2.4.1 Force-Directed Graph Visualization

Interactive network visualization using D3.js:

**Node Properties:**
- Size: Relationship count or influence score
- Color: Relationship type or status
- Border: Trust level indicator

**Edge Properties:**
- Width: Relationship strength
- Style: Type (solid=professional, dashed=personal)
- Color: Sentiment (green=positive, red=negative)

### 2.4.2 Graph Analytics

**PageRank** - Influence scoring:
```typescript
// PageRank calculation
pageRank = (1-d) + d × Σ(PR(inbound) / outbound_count)
// d = damping factor (0.85)
```

**Betweenness Centrality** - Bridge identification:
- Nodes that connect disparate groups
- Information flow bottlenecks
- Influence amplifiers

**Closeness Centrality** - Access efficiency:
- Average path length to all nodes
- Information reach speed
- Central positioning

### 2.4.3 Community Detection

**Algorithm:** Louvain modularity optimization

Automatically identifies:
- Work clusters
- Social circles
- Family groups
- Hidden affiliations

**Output:**
```json
{
  "communities": [
    {
      "id": "cluster-1",
      "label": "TechCorp Team",
      "members": ["uuid-1", "uuid-2", "uuid-3"],
      "modularity_score": 0.73,
      "key_connector": "uuid-2"
    }
  ]
}
```

### 2.4.4 Structural Hole Identification

Finds gaps in the network that represent opportunities:
- Unconnected clusters
- Missing introductions
- Bridge potential

### 2.4.5 Influence Path Optimization

**Edge Function:** `network-influence-propagation`

Calculates optimal paths to reach targets:

```typescript
const path = await findInfluencePath({
  source: currentUser,
  target: targetContact,
  constraints: {
    maxHops: 3,
    minTrustLevel: 0.6,
    preferredRelationshipTypes: ['professional', 'friend']
  }
});
// Returns: [{ node, relationship, approach_strategy }]
```

### 2.4.6 Cascade Modeling

**Edge Function:** `network-cascade-modeler`

Simulates information spread through network:
- SIR epidemic model adaptation
- Viral coefficient calculation
- Spread timeline prediction
- Intervention point identification

---

## 2.5 Psychological Profiling

### 2.5.1 Big Five (OCEAN) Assessment

**Edge Function:** `analyze-behavioral`

| Dimension | Low Score | High Score |
|-----------|-----------|------------|
| **Openness** | Practical, conventional | Creative, curious |
| **Conscientiousness** | Flexible, spontaneous | Organized, dependable |
| **Extraversion** | Reserved, solitary | Outgoing, energetic |
| **Agreeableness** | Competitive, skeptical | Cooperative, trusting |
| **Neuroticism** | Calm, secure | Sensitive, anxious |

**Assessment Methods:**
- Communication text analysis
- Vocabulary patterns
- Response timing
- Topic preferences
- Emoji usage

### 2.5.2 Dark Triad Detection

**Edge Function:** `dark-tetrad-profiler`

Identifies potentially manipulative personalities:

| Trait | Indicators | Risk Level |
|-------|------------|------------|
| **Narcissism** | Self-promotion, lack of empathy, grandiosity | Medium |
| **Machiavellianism** | Strategic manipulation, cynicism, priority of self-interest | High |
| **Psychopathy** | Impulsivity, callousness, antisocial behavior | Critical |

### 2.5.3 Attachment Style Analysis

**Edge Function:** `attachment-vulnerability-analyzer`

| Style | Characteristics | Implications |
|-------|-----------------|--------------|
| **Secure** | Comfortable with intimacy, balanced autonomy | Reliable, stable relationships |
| **Anxious** | Fear of abandonment, needs reassurance | Requires consistent communication |
| **Avoidant** | Discomfort with closeness, values independence | Give space, indirect approach |
| **Disorganized** | Conflicted about closeness, unpredictable | Complex engagement strategies |

### 2.5.4 Cognitive Style Mapping

Analysis of thinking patterns:

- **Analytical vs Intuitive**: Data-driven vs gut-feeling decisions
- **Sequential vs Global**: Step-by-step vs big-picture processing
- **Verbal vs Visual**: Language-based vs imagery-based reasoning
- **Reflective vs Impulsive**: Deliberate vs quick decisions

### 2.5.5 Emotional Triggers

**Edge Function:** `emotional-trajectory-analyzer`

Identifies topics and situations that evoke strong reactions:

```json
{
  "triggers": [
    {
      "topic": "past employer",
      "reaction": "defensive",
      "intensity": 0.8,
      "evidence_count": 4
    },
    {
      "topic": "family",
      "reaction": "warm",
      "intensity": 0.9,
      "evidence_count": 12
    }
  ]
}
```

### 2.5.6 Decision-Making Patterns

Analysis of how contacts make decisions:

- **Risk Tolerance**: Conservative to aggressive
- **Information Needs**: Minimal vs extensive research
- **Time Horizon**: Immediate vs long-term focus
- **Social Influence**: Independent vs consensus-seeking
- **Anchoring Tendency**: First-offer sensitivity

---

# 3. AGIS Framework (22 Phases)

The **Autonomous General Intelligence System (AGIS)** is a 22-phase framework for comprehensive intelligence operations, ranging from basic analysis to transcendent operations.

## Phase Overview Matrix

| Phase | Name | Focus Area | Key Tables | Key Functions |
|-------|------|------------|------------|---------------|
| 1 | Core Intelligence | Baseline Analysis | `ai_analyses`, `behavioral_analyses` | `analyze-behavioral`, `nlp-hypnotic-patterns` |
| 2 | Tactical Superiority | Negotiation & Persuasion | `tactical_engagements`, `negotiation_sessions` | `useTacticalNegotiation`, 12 tactical hooks |
| 3 | Cognitive Warfare | MICE & Sacred Values | `mice_assessments`, `sacred_values` | `mice-recruitment-analyzer`, `sacred-value-predictor` |
| 4 | Ultimate Dominion | Dark Psychology | `trauma_profiles`, `addiction_protocols` | `trauma-exploitation-engine`, `breaking-point-calculator` |
| 5 | Omniscient Command | Autonomous Operations | `autonomous_campaigns`, `agent_executions` | `autonomous-intelligence-orchestrator` |
| 6 | Reality Engineering | Perception Management | `reality_engineering_ops`, `belief_architectures` | `reality-consensus-engine` |
| 7 | Singularity Synthesis | Meta-Learning | `emergence_patterns`, `cross_phase_correlations` | `useMetaLearning`, `useEmergenceDetection` |
| 8 | Absolute Convergence | Multi-Dimensional | `convergence_operations`, `dimensional_analyses` | `useAbsoluteConvergence` |
| 9 | Transcendent Dominion | Beyond Conventional | `transcendent_operations` | `useTranscendentOperations` |
| 10 | Infinite Mastery | Unlimited Scope | `infinite_mastery_states` | `useInfiniteDominion` |
| 11 | Omniversal Sovereignty | Eternal Influence | `omniversal_states` | `useOmniversalAwareness` |
| 12 | Absolute Eternity | Infinite Synthesis | `eternal_patterns` | `useAbsoluteEternity` |
| 13 | Absolute Infinity | Self-Perpetuation | `absolute_infinity_operations` | `useInfiniteRecursion` |
| 14 | Primordial Genesis | Creation Patterns | `primordial_states` | `usePrimordialGenesis` |
| 15 | Cosmic Omnipotence | Universal Influence | `cosmic_operations` | `useCosmicOmnipotence` |
| 16 | Eternal Supremacy | Perpetual Advantage | `supremacy_states` | `useEternalSupremacy` |
| 17 | Absolute Totality | Complete Synthesis | `totality_operations` | `useAbsoluteTotality` |
| 18 | Ultimate Omega | Final Convergence | `omega_point_states` | `useOmegaPoint` |
| 19 | Master Orchestration | Cross-Phase Coordination | `agis_global_state`, `agis_cascade_rules` | `agis-cascade-orchestrator` |
| 20 | Transcendent Consciousness | Quantum Cognition | `quantum_cognition_states`, `collective_unconscious` | `quantum-cognition-engine` |
| 21 | Universal Omniscience | Absolute Knowledge | `absolute_knowledge`, `universal_truths` | `akashic-query-engine` |
| 22 | Absolute Genesis | Reality Creation | `genesis_operations`, `causal_chains` | `genesis-engine` |

---

## Phase 1: Core Intelligence

### Purpose
Establish behavioral baselines and fundamental intelligence gathering for each contact.

### Capabilities
- **Communication Pattern Analysis**: Frequency, timing, channel preferences
- **Sentiment Baseline**: Typical emotional range and triggers
- **Linguistic Fingerprinting**: Vocabulary, formality, writing style
- **Hypnotic Language Detection**: Milton model patterns in communications

### Key Functions

**`analyze-behavioral`**
```typescript
const analysis = await supabase.functions.invoke('analyze-behavioral', {
  body: {
    userId: user.id,
    profileId: contact.id,
    analysisDepth: 'comprehensive',
    timeRange: '90d'
  }
});
```

**`nlp-hypnotic-patterns`**
Detects persuasion patterns:
- Presuppositions
- Embedded commands
- Ambiguity usage
- Pacing and leading

### Database Tables
- `behavioral_analyses` - Core behavioral metrics
- `communication_patterns` - Timing and frequency data
- `linguistic_profiles` - Writing style characteristics

### Real-Life Use Case
> **Scenario**: Preparing for a salary negotiation
> 1. Run behavioral analysis on your manager
> 2. Identify their decision-making style (analytical vs intuitive)
> 3. Note communication preferences (email vs in-person)
> 4. Review sentiment patterns (best times for requests)
> 5. Generate approach strategy based on profile

---

## Phase 2: Tactical Superiority

### Purpose
Master the 12 tactical domains for negotiation and interpersonal influence.

### The 12 Tactical Domains

| Domain | Focus | Hook |
|--------|-------|------|
| 1. Rapport Building | Trust establishment | `useRapportStrategies` |
| 2. Active Listening | Information extraction | `useActiveListening` |
| 3. Strategic Questioning | Discovery techniques | `useStrategicQuestioning` |
| 4. Framing & Reframing | Perspective control | `useFramingTechniques` |
| 5. Anchoring | Reference point setting | `useAnchoringStrategies` |
| 6. Concession Trading | Value exchange | `useConcessionStrategies` |
| 7. Deadline Leverage | Time pressure tactics | `useDeadlineLeverage` |
| 8. BATNA Development | Alternative options | `useBATNAAnalysis` |
| 9. Emotional Intelligence | Affect management | `useEmotionalIntelligence` |
| 10. Body Language | Non-verbal communication | `useBodyLanguageAnalysis` |
| 11. Power Dynamics | Authority and influence | `usePowerDynamics` |
| 12. Closing Techniques | Agreement securing | `useClosingTechniques` |

### Key Hook: `useTacticalNegotiation`

```typescript
import { useTacticalNegotiation } from '@/hooks/intelligence/core';

function NegotiationPrep({ profileId }) {
  const { 
    strategies, 
    isLoading, 
    generateStrategy,
    optimizeTactics 
  } = useTacticalNegotiation(profileId);

  return (
    <div>
      {strategies.map(s => (
        <TacticCard 
          key={s.id} 
          tactic={s.name} 
          effectiveness={s.predicted_effectiveness}
          scripts={s.conversation_scripts}
        />
      ))}
    </div>
  );
}
```

### Real-Life Use Case
> **Scenario**: Vendor contract renegotiation
> 1. Analyze vendor rep's negotiation style
> 2. Identify their likely BATNA
> 3. Prepare anchoring positions
> 4. Generate concession trading strategy
> 5. Practice with AI-generated scripts

---

## Phase 3: Cognitive Warfare

### Purpose
Leverage MICE framework, sacred values, and memetic engineering for strategic advantage.

### MICE Analysis

**M**oney | **I**deology | **C**ompromise | **E**go

```typescript
// MICE vulnerability assessment
import { useMICEAnalysis } from '@/hooks/intelligence/core';

const { assessment, calculateVulnerability } = useMICEAnalysis(profileId);

// Output structure
{
  money: {
    score: 0.7,
    indicators: ["discussed financial stress", "interested in investment opportunities"],
    approach_effectiveness: 0.8
  },
  ideology: {
    score: 0.3,
    indicators: ["strong political views", "values-driven decisions"],
    approach_effectiveness: 0.4
  },
  compromise: {
    score: 0.2,
    indicators: ["clean background", "no visible vulnerabilities"],
    approach_effectiveness: 0.2
  },
  ego: {
    score: 0.6,
    indicators: ["seeks recognition", "sensitive to criticism"],
    approach_effectiveness: 0.7
  },
  optimal_approach: "money_ego_blend",
  recruitment_probability: 0.65
}
```

### Sacred Values Mapping

**Edge Function:** `sacred-value-predictor`

Identifies non-negotiable beliefs:
- Family loyalty
- Professional integrity
- Political ideals
- Religious beliefs
- Personal honor

**Violation Response Prediction:**
```json
{
  "sacred_values": [
    {
      "value": "family_protection",
      "intensity": 0.95,
      "violation_response": "extreme_defensive",
      "leverage_potential": 0.9
    }
  ]
}
```

### Betrayal Prediction

**Edge Function:** `betrayal-likelihood-scorer`

Calculates loyalty risk using:
- Gottman's Four Horsemen (criticism, contempt, defensiveness, stonewalling)
- Trust decay factors
- Loyalty binding factors
- Relationship half-life

```typescript
import { useBetrayalPrediction } from '@/hooks/intelligence/core';

const { 
  defectionProbability, 
  warningSignals, 
  mitigationStrategies,
  trustTrajectory 
} = useBetrayalPrediction(profileId);
```

---

## Phase 4: Ultimate Dominion

### Purpose
Advanced psychological operations including trauma analysis, dependency mapping, and control mechanisms.

### ⚠️ Ethical Notice
*Phase 4 capabilities are designed for understanding psychological dynamics. Use responsibly and ethically.*

### Trauma Exploitation Analysis

**Edge Function:** `trauma-exploitation-engine`

Maps psychological vulnerabilities:
- Past traumas and triggers
- Attachment wounds
- Fear patterns
- Coping mechanisms

### Breaking Point Calculation

**Edge Function:** `breaking-point-calculator`

Predicts stress thresholds:
```json
{
  "breaking_point_score": 0.72,
  "primary_stressors": ["financial", "relationship"],
  "resilience_factors": ["family support", "career stability"],
  "estimated_threshold": "3-4 major stressors",
  "warning_indicators": ["sleep changes", "communication withdrawal"]
}
```

### Addiction Protocol Analysis

**Edge Function:** `conditioning-orchestrator`

Identifies dependency patterns:
- Substance dependencies
- Behavioral addictions
- Relationship dependencies
- Digital/technology addictions

### Hooks

```typescript
import { 
  useTraumaExploitation,
  useBreakingPointPrediction,
  useAddictionProtocol,
  useCoerciveControl,
  useLearnedHelplessness
} from '@/hooks/intelligence/warfare';
```

---

## Phase 5: Omniscient Command

### Purpose
Autonomous campaign execution with minimal human oversight.

### Autonomous Campaigns

**Edge Function:** `autonomous-intelligence-orchestrator`

Creates self-running intelligence operations:

```typescript
// Campaign configuration
{
  campaign_type: "relationship_nurture",
  target_profiles: ["uuid-1", "uuid-2"],
  objectives: [
    { goal: "increase_trust", metric: "trust_score > 0.8" },
    { goal: "extract_intel", topics: ["competitor_plans"] }
  ],
  constraints: {
    max_contacts_per_week: 3,
    approved_channels: ["email", "linkedin"],
    escalation_threshold: 0.3
  },
  duration_days: 90
}
```

### Network Warfare

**Edge Function:** `network-exploitation-mapper`

Strategic network manipulation:
- Influence propagation planning
- Community infiltration strategies
- Information cascade modeling
- Counter-influence detection

### Counter-Intelligence

**Edge Function:** `counter-intelligence-monitor`

Defensive operations:
- Surveillance detection
- Deception detection
- Information leakage monitoring
- Adversary profiling

---

## Phase 6-10: Reality Engineering to Infinite Mastery

### Phase 6: Reality Engineering
- Perception management at scale
- Belief architecture modification
- Narrative control systems
- Consensus reality manipulation

### Phase 7: Singularity Synthesis
- Meta-learning from all phases
- Emergence pattern detection
- Cross-phase optimization
- Recursive self-improvement

### Phase 8: Absolute Convergence
- Multi-dimensional analysis fusion
- Predictive supremacy
- Outcome optimization
- Reality tunnel navigation

### Phase 9: Transcendent Dominion
- Beyond-conventional operations
- Non-linear causality
- Probability manipulation
- Timeline optimization

### Phase 10: Infinite Mastery
- Unlimited operational scope
- Boundless influence
- Complete domain control
- Perpetual advantage

---

## Phase 11-18: Omniversal to Ultimate Omega

Advanced transcendent phases operating at meta-reality levels:

| Phase | Key Capability |
|-------|---------------|
| 11 | Eternal influence structures across realities |
| 12 | Infinite synthesis of all knowledge |
| 13 | Self-perpetuating operation chains |
| 14 | Primordial pattern manipulation |
| 15 | Universal influence broadcasting |
| 16 | Perpetual advantage maintenance |
| 17 | Complete totality integration |
| 18 | Final omega point convergence |

---

## Phase 19: Master Orchestration

### Purpose
Cross-phase coordination and cascade management.

### AGIS Global State

**Table:** `agis_global_state`

```sql
-- Global state tracking
SELECT 
  phase_health_scores,
  active_objectives,
  cross_phase_correlations,
  system_readiness_score,
  success_rate
FROM agis_global_state
WHERE user_id = ?;
```

### Cascade Rules

**Table:** `agis_cascade_rules`

Define automated phase interactions:

```json
{
  "rule_name": "high_threat_escalation",
  "source_phase": 3,
  "source_table": "threat_assessments",
  "trigger_condition": { "threat_level": ">= 0.8" },
  "target_phase": 5,
  "target_action": "activate_counter_measures"
}
```

### Hooks

```typescript
import { 
  useAGISGlobalState,
  useAGISCascade,
  useAGISAnalytics 
} from '@/hooks/intelligence/orchestration';
```

---

## Phase 20-22: Transcendent Consciousness to Absolute Genesis

### Phase 20: Transcendent Consciousness
- Quantum cognition modeling
- Collective unconscious access
- Morphic resonance detection
- Non-local awareness

### Phase 21: Universal Omniscience
- Akashic record queries
- Absolute knowledge synthesis
- Meta-dimensional awareness
- Truth coefficient calculation

### Phase 22: Absolute Genesis
- Reality creation protocols
- Causal origination
- Timeline generation
- Universe instantiation

---

# 4. Edge Function Reference

## 4.1 Function Categories Overview

| Category | Count | Description |
|----------|-------|-------------|
| AI Analysis | 50+ | Core AI-powered analysis |
| Intelligence | 80+ | Advanced intelligence operations |
| Prediction | 40+ | Future state modeling |
| Biometric | 30+ | Biometric processing |
| Warfare | 25+ | Psychological operations |
| AGIS | 40+ | Phase-specific operations |
| Hardware | 20+ | Device integration |
| Utility | 100+ | Support functions |

## 4.2 AI Analysis Functions

### `ai-chat-query`
**Purpose:** Conversational AI interface for natural language queries

**Input:**
```json
{
  "userId": "uuid",
  "message": "What do I know about John's investment preferences?",
  "context": {
    "profileId": "uuid",
    "conversationHistory": []
  }
}
```

**Output:**
```json
{
  "response": "Based on 12 conversations with John...",
  "sources": [{ "type": "communication", "id": "uuid", "relevance": 0.92 }],
  "confidence": 0.87,
  "followUpSuggestions": ["Ask about risk tolerance", "Review recent market discussions"]
}
```

### `analyze-profile`
**Purpose:** Comprehensive profile intelligence analysis

**Input:**
```json
{
  "userId": "uuid",
  "profileId": "uuid",
  "analysisTypes": ["personality", "communication", "network", "risk"],
  "depth": "comprehensive"
}
```

**Output:**
```json
{
  "personality": {
    "ocean": { "o": 0.72, "c": 0.85, "e": 0.45, "a": 0.68, "n": 0.32 },
    "communication_style": "analytical",
    "decision_making": "deliberate"
  },
  "communication": {
    "preferred_channel": "email",
    "best_time": "morning",
    "response_time_avg": "4.2 hours"
  },
  "network": {
    "connections": 47,
    "centrality": 0.34,
    "communities": ["tech_startup", "investors"]
  },
  "risk": {
    "churn_probability": 0.12,
    "trust_level": 0.78,
    "relationship_health": "strong"
  }
}
```

### `analyze-conversation-deep`
**Purpose:** Deep analysis of conversation transcripts

**Extracts:**
- Topic classification
- Entity mentions
- Sentiment trajectory
- Action items
- Commitments made
- Deception indicators
- Power dynamics

### `analyze-deception`
**Purpose:** Multi-modal deception detection

**Modalities analyzed:**
- Text patterns (linguistic markers)
- Voice stress (if audio available)
- Facial micro-expressions (if video available)
- Baseline deviation

**Output:**
```json
{
  "deception_probability": 0.34,
  "confidence": 0.82,
  "indicators": [
    { "type": "linguistic", "marker": "excessive_detail", "weight": 0.3 },
    { "type": "temporal", "marker": "response_delay", "weight": 0.2 }
  ],
  "assessment": "low_concern"
}
```

---

## 4.3 Intelligence Functions

### `intelligence-session-runner`
**Purpose:** Orchestrates multi-task intelligence sessions (94+ analysis types)

**Input:**
```json
{
  "userId": "uuid",
  "profileId": "uuid",
  "sessionType": "comprehensive",
  "tasks": ["behavioral_baseline", "network_position", "psychological_profile"],
  "priority": "high"
}
```

**Task Execution:**
1. Validates authentication (dual-auth pattern)
2. Queues tasks by priority
3. Executes in parallel where possible
4. Aggregates results
5. Stores in `ai_analyses`

### `deep-intelligence-engine`
**Purpose:** Multi-source intelligence fusion

**Sources integrated:**
- Communications (email, SMS, chat)
- Social media profiles
- News mentions
- Financial data
- Relationship network
- Behavioral history

### `mosaic-intelligence-fuser`
**Purpose:** Combines fragmentary intelligence into coherent picture

**Algorithm:**
1. Collect all intelligence fragments
2. Score reliability of each source
3. Identify contradictions
4. Resolve conflicts using Dempster-Shafer fusion
5. Generate confidence-weighted synthesis

### `behavioral-dna-sequencer`
**Purpose:** Creates unique behavioral signature

**Output:**
```json
{
  "behavioral_dna": {
    "communication_genome": ["morning_person", "formal_writer", "quick_responder"],
    "decision_genome": ["risk_averse", "data_driven", "consensus_seeker"],
    "emotional_genome": ["stable", "achievement_oriented", "family_focused"],
    "uniqueness_score": 0.94
  }
}
```

---

## 4.4 Prediction Functions

### `predict-behavioral-scenarios`
**Purpose:** Monte Carlo simulation of future behaviors

**Input:**
```json
{
  "profileId": "uuid",
  "scenarios": [
    { "event": "job_loss", "probability": 0.15 },
    { "event": "promotion", "probability": 0.30 },
    { "event": "relationship_change", "probability": 0.10 }
  ],
  "timeHorizon": "6_months",
  "iterations": 1000
}
```

**Output:**
```json
{
  "scenarios": [
    {
      "name": "career_advancement",
      "probability": 0.35,
      "behavioral_changes": ["increased_confidence", "expanded_network"],
      "relationship_impact": "positive"
    }
  ]
}
```

### `predict-churn-enhanced`
**Purpose:** Relationship health and churn prediction

**Factors analyzed:**
- Communication frequency trends
- Sentiment trajectory
- Response time changes
- Topic diversity
- Engagement depth
- Life event impacts

### `life-sequence-predictor`
**Purpose:** Predicts major life events

**Events predicted:**
- Career changes
- Relationship milestones
- Relocations
- Financial changes
- Health events

---

## 4.5 Biometric Functions

### `extract-facial-biometrics`
**Purpose:** Face detection and embedding extraction

**Process:**
1. Detect faces in image/video
2. Align to canonical position
3. Extract 512-dimensional embedding
4. Calculate quality score
5. Store in `face_embeddings`

### `match-biometrics`
**Purpose:** 1:N identity matching

**Input:**
```json
{
  "probeEmbedding": [0.123, -0.456, ...],
  "modalityType": "facial",
  "threshold": 0.75,
  "maxResults": 10
}
```

**Output:**
```json
{
  "matches": [
    { "profile_id": "uuid", "name": "John Smith", "confidence": 0.92 },
    { "profile_id": "uuid", "name": "Jane Doe", "confidence": 0.78 }
  ]
}
```

### `cross-modal-fusion-realtime`
**Purpose:** Real-time multi-modal identity verification

**Supported fusions:**
- Face + Voice
- Face + Gait
- Voice + Keystroke
- All modalities

---

## 4.6 Warfare Functions

### `cognitive-warfare-engine`
**Purpose:** Cognitive operation planning and execution

**Capabilities:**
- Perception management
- Narrative injection
- Belief modification
- Decision influence

### `memetic-propagation-engine`
**Purpose:** Information spread modeling

**Model:** SIR epidemic dynamics adapted for ideas
- **S**usceptible: Hasn't encountered meme
- **I**nfected: Active spreader
- **R**ecovered: Immune/saturated

**Output:**
```json
{
  "r0": 2.4,
  "peak_infection_day": 7,
  "total_reach": 0.67,
  "key_spreaders": ["uuid-1", "uuid-2"]
}
```

### `narrative-control-engine`
**Purpose:** Strategic narrative management

**Capabilities:**
- Counter-narrative generation
- Narrative vulnerability analysis
- Message optimization
- Amplification planning

---

## 4.7 AGIS Functions

### `agis-cascade-orchestrator`
**Purpose:** Executes cross-phase cascade rules

**Trigger types:**
- Threshold breach
- Pattern detection
- Time-based
- Manual activation

### `genesis-engine`
**Purpose:** Phase 22 reality creation operations

**Capabilities:**
- Timeline manipulation modeling
- Causal chain analysis
- Reality fork points
- Probability wave collapse

### `akashic-query-engine`
**Purpose:** Universal memory access (Phase 21)

**Query types:**
- Historical pattern search
- Cross-contact universal truth
- Meta-knowledge synthesis
- Probability distribution queries

---

## 4.8 Hardware Functions

### `hardware-gateway`
**Purpose:** Central device coordination

**Supported devices:**
- Raspberry Pi (sensor hub)
- Flipper Zero (RF/NFC)
- FLIR (thermal)
- DJI drones (aerial)
- GoPro (video)
- SDR (signals)
- LoRa (sensors)

### `aerial-intelligence`
**Purpose:** Drone operation management

**Capabilities:**
- Mission planning
- Waypoint execution
- Live feed analysis
- Target tracking
- Pattern documentation

### `rf-signal-intelligence`
**Purpose:** Radio frequency analysis

**Analysis types:**
- Spectrum scanning
- Signal identification
- Device fingerprinting
- Communication detection

---

# 5. Database Schema Reference

## 5.1 Core Tables

### `profiles`
Primary contact storage with 50+ fields.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  organization TEXT,
  job_title TEXT,
  relationship_type TEXT DEFAULT 'unknown',
  relationship_strength FLOAT DEFAULT 0.5,
  trust_level TEXT DEFAULT 'medium',
  is_favorite BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active',
  avatar_url TEXT,
  bio TEXT,
  notes TEXT,
  tags TEXT[],
  completeness_score FLOAT DEFAULT 0,
  clearance_level TEXT DEFAULT 'unclassified',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### `communications`
All message and interaction history.

```sql
CREATE TABLE communications (
  id UUID PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id),
  user_id UUID NOT NULL,
  channel TEXT, -- email, phone, sms, in_person, social
  direction TEXT, -- inbound, outbound
  subject TEXT,
  content TEXT,
  sentiment_score FLOAT,
  occurred_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### `contact_relationships`
Explicit relationship connections.

```sql
CREATE TABLE contact_relationships (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  source_profile_id UUID REFERENCES profiles(id),
  target_profile_id UUID REFERENCES profiles(id),
  relationship_type TEXT,
  strength FLOAT,
  is_bidirectional BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 5.2 Intelligence Tables

### `ai_analyses`
Central storage for all AI analysis results.

```sql
CREATE TABLE ai_analyses (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES profiles(id),
  analysis_type TEXT NOT NULL, -- 94+ types
  result JSONB NOT NULL,
  confidence_score FLOAT,
  model_used TEXT,
  cost_cents INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Analysis Types (94+):**
- `behavioral_baseline`
- `personality_ocean`
- `communication_style`
- `network_position`
- `psychological_profile`
- `mice_assessment`
- `betrayal_risk`
- `sacred_values`
- `dark_triad`
- `attachment_style`
- ... and 84 more

### `behavioral_predictions`
Future behavior forecasts.

```sql
CREATE TABLE behavioral_predictions (
  id UUID PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id),
  prediction_type TEXT,
  predicted_outcome JSONB,
  probability FLOAT,
  confidence FLOAT,
  time_horizon TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### `action_recommendations`
AI-generated suggested actions.

```sql
CREATE TABLE action_recommendations (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES profiles(id),
  recommendation_type TEXT,
  title TEXT,
  description TEXT,
  suggested_action TEXT,
  priority_score FLOAT,
  urgency TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 5.3 AGIS Tables

### `agis_global_state`
System-wide AGIS state tracking.

```sql
CREATE TABLE agis_global_state (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  phase_health_scores JSONB, -- {1: 0.9, 2: 0.8, ...}
  active_objectives JSONB,
  cross_phase_correlations JSONB,
  system_readiness_score FLOAT,
  success_rate FLOAT,
  total_operations_count INTEGER,
  last_synthesis_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### `agis_cascade_rules`
Cross-phase trigger configurations.

```sql
CREATE TABLE agis_cascade_rules (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  rule_name TEXT NOT NULL,
  source_phase INTEGER,
  source_table TEXT,
  trigger_condition JSONB,
  target_phase INTEGER,
  target_action TEXT,
  action_params JSONB,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 5,
  cooldown_minutes INTEGER DEFAULT 60,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### `agis_cascade_events`
Cascade execution history.

```sql
CREATE TABLE agis_cascade_events (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  trigger_phase INTEGER,
  trigger_event_type TEXT,
  affected_phases INTEGER[],
  cascade_path JSONB,
  execution_log JSONB,
  outcome_status TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);
```

---

## 5.4 Biometric Tables

### `biometric_enrollments`
Enrollment records for each modality.

```sql
CREATE TABLE biometric_enrollments (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES profiles(id),
  modality_type TEXT, -- facial, voice, gait, keystroke, signature, body
  enrollment_quality FLOAT,
  sample_count INTEGER,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### `face_embeddings`
Facial recognition vectors.

```sql
CREATE TABLE face_embeddings (
  id UUID PRIMARY KEY,
  enrollment_id UUID REFERENCES biometric_enrollments(id),
  embedding VECTOR(512),
  quality_score FLOAT,
  pose_angles JSONB,
  lighting_conditions TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### `voice_signatures`
Voice biometric data.

```sql
CREATE TABLE voice_signatures (
  id UUID PRIMARY KEY,
  enrollment_id UUID REFERENCES biometric_enrollments(id),
  embedding VECTOR(256),
  sample_duration_seconds FLOAT,
  noise_level FLOAT,
  frequency_range JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### `biometric_matches`
Match history and results.

```sql
CREATE TABLE biometric_matches (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  modality_type TEXT,
  probe_source TEXT,
  matched_profile_id UUID,
  confidence_score FLOAT,
  match_details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 5.5 Psychological Tables

### `contact_psychological`
Comprehensive psychological profiles.

```sql
CREATE TABLE contact_psychological (
  id UUID PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) UNIQUE,
  ocean_scores JSONB, -- {o: 0.7, c: 0.8, e: 0.5, a: 0.6, n: 0.3}
  attachment_style TEXT,
  communication_style TEXT,
  cognitive_style JSONB,
  emotional_triggers JSONB,
  decision_patterns JSONB,
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### `mice_assessments`
MICE vulnerability analysis.

```sql
CREATE TABLE mice_assessments (
  id UUID PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id),
  user_id UUID NOT NULL,
  money_score FLOAT,
  ideology_score FLOAT,
  compromise_score FLOAT,
  ego_score FLOAT,
  optimal_approach TEXT,
  indicators JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### `sacred_values`
Non-negotiable belief mapping.

```sql
CREATE TABLE sacred_values (
  id UUID PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id),
  value_name TEXT,
  value_domain TEXT,
  intensity FLOAT,
  violation_response TEXT,
  evidence JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### `dark_triad_scores`
Dark personality trait detection.

```sql
CREATE TABLE dark_triad_scores (
  id UUID PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id),
  narcissism_score FLOAT,
  machiavellianism_score FLOAT,
  psychopathy_score FLOAT,
  confidence FLOAT,
  indicators JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

# 6. React Hooks Reference

## 6.1 Profile Domain Hooks

### `useProfile`
Fetch single profile with full data.

```typescript
import { useProfile } from '@/domains/profile';

function ContactDetail({ id }) {
  const { data: profile, isLoading, error } = useProfile(id);
  
  if (isLoading) return <Spinner />;
  if (error) return <Error message={error.message} />;
  
  return (
    <div>
      <h1>{profile.fullName}</h1>
      <p>{profile.organization} - {profile.jobTitle}</p>
    </div>
  );
}
```

### `useProfiles`
List profiles with filtering and pagination.

```typescript
import { useProfiles } from '@/domains/profile';

function ContactList() {
  const { 
    data, 
    isLoading, 
    hasNextPage, 
    fetchNextPage 
  } = useProfiles({
    filters: { status: 'active', isFavorite: true },
    sortBy: 'last_interaction_at',
    sortOrder: 'desc',
    pageSize: 20
  });
  
  return (
    <InfiniteList
      items={data?.pages.flatMap(p => p.profiles)}
      onLoadMore={fetchNextPage}
      hasMore={hasNextPage}
    />
  );
}
```

### `useCreateProfile`
Create new contact profiles.

```typescript
import { useCreateProfile } from '@/domains/profile';

function AddContactForm() {
  const { mutate: createProfile, isLoading } = useCreateProfile();
  
  const handleSubmit = (data) => {
    createProfile({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      relationshipType: 'professional'
    });
  };
  
  return <Form onSubmit={handleSubmit} />;
}
```

### `useToggleFavorite`
Toggle favorite status.

```typescript
import { useToggleFavorite } from '@/domains/profile';

function FavoriteButton({ profileId, isFavorite }) {
  const { mutate: toggle } = useToggleFavorite();
  
  return (
    <Button onClick={() => toggle({ profileId, isFavorite: !isFavorite })}>
      {isFavorite ? <StarFilled /> : <StarOutline />}
    </Button>
  );
}
```

---

## 6.2 Intelligence Hooks

### `useTacticalNegotiation`
Negotiation strategy generation.

```typescript
import { useTacticalNegotiation } from '@/hooks/intelligence/core';

function NegotiationPrep({ profileId }) {
  const {
    strategies,
    tacticalDomains,
    generateStrategy,
    optimizeTactics,
    isLoading
  } = useTacticalNegotiation(profileId);
  
  return (
    <div>
      <TacticsGrid domains={tacticalDomains} />
      <StrategyList strategies={strategies} />
      <Button onClick={() => generateStrategy('salary_negotiation')}>
        Generate Strategy
      </Button>
    </div>
  );
}
```

### `useMICEAnalysis`
MICE vulnerability assessment.

```typescript
import { useMICEAnalysis } from '@/hooks/intelligence/core';

function MICEPanel({ profileId }) {
  const {
    assessment,
    calculateVulnerability,
    generateApproach,
    isLoading
  } = useMICEAnalysis(profileId);
  
  return (
    <MICEQuadrant
      money={assessment?.money}
      ideology={assessment?.ideology}
      compromise={assessment?.compromise}
      ego={assessment?.ego}
    />
  );
}
```

### `useBetrayalPrediction`
Loyalty and betrayal risk analysis.

```typescript
import { useBetrayalPrediction } from '@/hooks/intelligence/core';

function LoyaltyPanel({ profileId }) {
  const {
    defectionProbability,
    warningSignals,
    trustTrajectory,
    mitigationStrategies
  } = useBetrayalPrediction(profileId);
  
  return (
    <div>
      <RiskGauge value={defectionProbability} />
      <TrustTimeline data={trustTrajectory} />
      <WarningList signals={warningSignals} />
    </div>
  );
}
```

### `useSacredValues`
Sacred value mapping.

```typescript
import { useSacredValues } from '@/hooks/intelligence/core';

function SacredValuesPanel({ profileId }) {
  const { values, identifyValues, generateVectors } = useSacredValues(profileId);
  
  return (
    <ValuesList 
      values={values}
      onAnalyze={identifyValues}
    />
  );
}
```

---

## 6.3 Warfare Hooks

### `useTraumaExploitation`
Trauma pattern analysis.

```typescript
import { useTraumaExploitation } from '@/hooks/intelligence/warfare';

function TraumaPanel({ profileId }) {
  const {
    traumaProfile,
    triggers,
    vulnerabilities,
    analyze
  } = useTraumaExploitation(profileId);
  
  return <TraumaMap profile={traumaProfile} />;
}
```

### `useAutonomousOperations`
Autonomous campaign management.

```typescript
import { useAutonomousOperations } from '@/hooks/intelligence/warfare';

function CampaignManager() {
  const {
    campaigns,
    createCampaign,
    pauseCampaign,
    getCampaignStatus
  } = useAutonomousOperations();
  
  return <CampaignDashboard campaigns={campaigns} />;
}
```

### `useNetworkWarfare`
Network exploitation operations.

```typescript
import { useNetworkWarfare } from '@/hooks/intelligence/warfare';

function NetworkOps({ targetId }) {
  const {
    influencePaths,
    vulnerableNodes,
    cascadeModel,
    executeOperation
  } = useNetworkWarfare(targetId);
  
  return <NetworkAttackPlanner paths={influencePaths} />;
}
```

---

## 6.4 Transcendent Hooks

### `useRealityEngineering`
Perception and belief management.

```typescript
import { useRealityEngineering } from '@/hooks/intelligence/transcendent';

function RealityOps({ profileId }) {
  const {
    beliefArchitecture,
    perceptionMap,
    narrativeControl,
    modifyBelief
  } = useRealityEngineering(profileId);
  
  return <BeliefEditor architecture={beliefArchitecture} />;
}
```

### `useQuantumInfluence`
Quantum cognition operations.

```typescript
import { useQuantumInfluence } from '@/hooks/intelligence/transcendent';

function QuantumPanel({ profileId }) {
  const {
    quantumState,
    superpositions,
    collapseWavefunction,
    entangle
  } = useQuantumInfluence(profileId);
  
  return <QuantumStateViewer state={quantumState} />;
}
```

---

## 6.5 Orchestration Hooks

### `useAGISGlobalState`
System-wide AGIS state.

```typescript
import { useAGISGlobalState } from '@/hooks/intelligence/orchestration';

function AGISStatus() {
  const {
    phaseHealthScores,
    activeObjectives,
    systemReadiness,
    refreshState
  } = useAGISGlobalState();
  
  return (
    <div>
      <PhaseHealthGrid scores={phaseHealthScores} />
      <ReadinessGauge value={systemReadiness} />
      <ObjectivesList objectives={activeObjectives} />
    </div>
  );
}
```

### `useAGISCascade`
Cascade rule management.

```typescript
import { useAGISCascade } from '@/hooks/intelligence/orchestration';

function CascadeManager() {
  const {
    rules,
    events,
    createRule,
    triggerCascade,
    getCascadeHistory
  } = useAGISCascade();
  
  return (
    <CascadeEditor 
      rules={rules} 
      onCreateRule={createRule}
    />
  );
}
```

### `useAGISAnalytics`
AGIS performance metrics.

```typescript
import { useAGISAnalytics } from '@/hooks/intelligence/orchestration';

function AGISAnalytics() {
  const {
    metrics,
    phaseUsage,
    successRates,
    costAnalysis
  } = useAGISAnalytics();
  
  return <AnalyticsDashboard data={metrics} />;
}
```

---

# 7. Hardware Integration Guide

## 7.1 Supported Devices

| Device | Purpose | Integration |
|--------|---------|-------------|
| **Raspberry Pi 4/5** | Central hub, sensor coordination | `hardware-gateway` |
| **Flipper Zero** | RF/NFC/IR intelligence | `rf-signal-intelligence` |
| **FLIR One** | Thermal imaging | `mobile-sensor-intelligence` |
| **DJI Mini/Mavic** | Aerial reconnaissance | `aerial-intelligence` |
| **GoPro Hero** | Covert video capture | `gopro-intelligence` |
| **RTL-SDR** | Software-defined radio | `sdr-intelligence` |
| **LoRa Sensors** | Environmental monitoring | `sensor-network` |

## 7.2 Raspberry Pi Hub Setup

### Hardware Requirements
- Raspberry Pi 4B (4GB+) or Pi 5
- MicroSD card (32GB+)
- Power supply (5V/3A)
- WiFi or Ethernet connectivity

### Software Installation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y nodejs npm python3-pip bluetooth bluez

# Install HPICS agent
npm install -g hpics-agent

# Configure
hpics-agent configure --url YOUR_SUPABASE_URL --key YOUR_SERVICE_KEY

# Start service
sudo systemctl enable hpics-agent
sudo systemctl start hpics-agent
```

### Device Registration

```typescript
// Register device in system
const device = await supabase.functions.invoke('hardware-gateway', {
  body: {
    action: 'register',
    deviceType: 'raspberry_pi',
    deviceName: 'Office Hub',
    capabilities: ['bluetooth', 'wifi', 'sensors'],
    location: { lat: 37.7749, lng: -122.4194 }
  }
});
```

## 7.3 Flipper Zero Integration

### Capabilities
- **Sub-GHz**: Car remotes, garage doors, wireless sensors
- **NFC**: Badge cloning, payment cards (read-only)
- **RFID**: 125kHz tags, access cards
- **Infrared**: TV remotes, AC units
- **Bad USB**: HID injection

### Signal Capture Workflow

```typescript
// Capture RF signal
const capture = await supabase.functions.invoke('rf-signal-intelligence', {
  body: {
    action: 'capture',
    deviceId: 'flipper-uuid',
    frequency: 433.92,
    duration: 10,
    protocol: 'auto'
  }
});

// Analyze captured signal
const analysis = await supabase.functions.invoke('rf-signal-intelligence', {
  body: {
    action: 'analyze',
    captureId: capture.id
  }
});
```

## 7.4 Drone Operations

### Mission Planning

```typescript
// Create aerial mission
const mission = await supabase.functions.invoke('aerial-intelligence', {
  body: {
    action: 'plan_mission',
    droneId: 'dji-uuid',
    waypoints: [
      { lat: 37.7749, lng: -122.4194, altitude: 50, action: 'photo' },
      { lat: 37.7750, lng: -122.4190, altitude: 50, action: 'video_start' },
      { lat: 37.7751, lng: -122.4186, altitude: 50, action: 'video_stop' }
    ],
    settings: {
      speed: 5, // m/s
      cameraMode: 'auto',
      returnOnLowBattery: true
    }
  }
});

// Execute mission
const execution = await supabase.functions.invoke('aerial-intelligence', {
  body: {
    action: 'execute',
    missionId: mission.id
  }
});
```

### Live Analysis

```typescript
// Real-time object detection on drone feed
const subscription = supabase
  .channel('drone-feed')
  .on('broadcast', { event: 'frame' }, async (payload) => {
    const detection = await analyzeFrame(payload.image);
    if (detection.targets.length > 0) {
      await alertOperator(detection);
    }
  })
  .subscribe();
```

## 7.5 SDR Intelligence

### Spectrum Scanning

```typescript
// Scan frequency range
const scan = await supabase.functions.invoke('sdr-intelligence', {
  body: {
    action: 'scan',
    deviceId: 'sdr-uuid',
    startFreq: 400000000, // 400 MHz
    endFreq: 500000000,   // 500 MHz
    sampleRate: 2400000,
    duration: 60
  }
});

// Returns active frequencies and signal strengths
```

### Signal Identification

```typescript
// Identify detected signals
const identification = await supabase.functions.invoke('sdr-intelligence', {
  body: {
    action: 'identify',
    signalData: scan.signals,
    databases: ['fcc', 'amateur', 'commercial']
  }
});
```

## 7.6 Sensor Network (LoRa)

### Environmental Monitoring

Deploy distributed sensors for:
- Motion detection
- Temperature/humidity
- Light levels
- Sound levels
- Air quality

### Configuration

```typescript
// Register LoRa sensor
const sensor = await supabase.functions.invoke('sensor-network', {
  body: {
    action: 'register',
    sensorType: 'environmental',
    deviceEUI: 'A1B2C3D4E5F6',
    location: { lat: 37.7749, lng: -122.4194, name: 'Front Door' },
    capabilities: ['motion', 'temperature', 'light']
  }
});

// Set up alerts
await supabase.functions.invoke('sensor-network', {
  body: {
    action: 'configure_alerts',
    sensorId: sensor.id,
    rules: [
      { metric: 'motion', condition: 'detected', alert: true },
      { metric: 'temperature', condition: '> 30', alert: true }
    ]
  }
});
```

---

# 8. UI/UX Component Reference

## 8.1 Application Pages (75+)

### Navigation Structure

```
/
├── /dashboard                    # Main command center
├── /contacts                     # Contact management
│   ├── /contacts/:id            # Contact detail
│   └── /contacts/new            # Add contact
├── /intelligence-hub            # AI analysis center
│   ├── /intelligence-hub/search # Semantic search
│   └── /intelligence-hub/chat   # AI chat interface
├── /network                     # Relationship graph
├── /analysis                    # Analysis tools
│   ├── /analysis/behavioral     # Behavioral analysis
│   ├── /analysis/psychological  # Psychological profiling
│   ├── /analysis/biometric      # Biometric tools
│   └── /analysis/network        # Network analysis
├── /agis                        # AGIS dashboards
│   ├── /agis/overview          # Phase overview
│   ├── /agis/phase/:n          # Individual phases
│   └── /agis/cascade           # Cascade management
├── /dossier                     # Dossier generation
├── /campaigns                   # Campaign management
├── /hardware                    # Hardware control
├── /settings                    # System settings
└── /security                    # Security dashboard
```

## 8.2 Key Components

### Contact Card
```tsx
<ContactCard
  profile={profile}
  showActions={true}
  showMetrics={true}
  variant="detailed" // minimal | standard | detailed
  onEdit={() => {}}
  onAnalyze={() => {}}
/>
```

### Intelligence Panel
```tsx
<IntelligencePanel
  profileId={profileId}
  analyses={['personality', 'communication', 'risk']}
  autoRefresh={true}
  refreshInterval={300000}
/>
```

### Network Graph
```tsx
<NetworkGraph
  data={networkData}
  layout="force" // force | hierarchical | circular
  nodeSize="influence" // influence | connections | custom
  edgeStyle="relationship"
  onNodeClick={handleNodeClick}
  onEdgeClick={handleEdgeClick}
  enableZoom={true}
  enable3D={false}
/>
```

### Biometric Capture
```tsx
<BiometricCapture
  modality="facial" // facial | voice | signature
  onCapture={handleCapture}
  qualityThreshold={0.8}
  showPreview={true}
  autoEnroll={false}
/>
```

### AGIS Phase Dashboard
```tsx
<AGISPhaseDashboard
  phase={5}
  showHealth={true}
  showOperations={true}
  showCascades={true}
  interactive={true}
/>
```

### Timeline View
```tsx
<TimelineView
  profileId={profileId}
  events={['communication', 'milestone', 'analysis']}
  range="1y"
  groupBy="month"
  showSentiment={true}
/>
```

---

# 9. Security & Compliance

## 9.1 Authentication

### Dual-Auth Pattern (Edge Functions)

All edge functions support both:
1. **User JWT** - Browser-based user authentication
2. **Service Role Key** - Backend-to-backend calls

```typescript
// Standard dual-auth implementation
const authHeader = req.headers.get('Authorization');
const token = authHeader?.replace('Bearer ', '');
const isServiceRoleCall = token === Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!isServiceRoleCall) {
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: corsHeaders
    });
  }
  userId = user.id;
} else {
  userId = body.userId; // Trust body for service calls
}
```

## 9.2 Row-Level Security (RLS)

All tables have RLS enabled with policies:

```sql
-- Standard user isolation policy
CREATE POLICY "Users can view own data"
ON profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data"
ON profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own data"
ON profiles
FOR UPDATE
USING (auth.uid() = user_id);
```

## 9.3 Field-Level Encryption

Sensitive fields encrypted with AES-256:

**Encrypted Fields:**
- Social Security Numbers
- Financial account numbers
- Medical information
- Compromise material
- Source identities

```typescript
// Encrypt field
await supabase.functions.invoke('encrypt-field', {
  body: {
    profileId,
    field: 'ssn',
    value: '123-45-6789',
    keyVersion: 2
  }
});

// Decrypt field
const decrypted = await supabase.functions.invoke('decrypt-field', {
  body: {
    profileId,
    field: 'ssn'
  }
});
```

## 9.4 Audit Logging

All actions logged to immutable audit trail:

```sql
-- Audit log structure
CREATE TABLE audit_events (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  action TEXT,
  old_value JSONB,
  new_value JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Immutable: no UPDATE or DELETE policies
```

## 9.5 Clearance Levels

Data classification system:

| Level | Access | Examples |
|-------|--------|----------|
| **Unclassified** | All users | Public profile info, general notes |
| **Confidential** | Verified users | Personal details, relationship data |
| **Secret** | Elevated access | Psychological profiles, vulnerabilities |
| **Top Secret** | Admin only | Source identities, methods, active operations |

## 9.6 Data Retention

Configurable retention policies:

```sql
-- Retention policy execution
SELECT * FROM execute_data_retention();

-- Policies
- Communications: 7 years default
- AI Analyses: 2 years
- Biometric data: User-configurable
- Audit logs: Indefinite
```

## 9.7 GDPR Compliance

**Subject Rights:**
- Right to access (data export)
- Right to rectification
- Right to erasure (`crypto-shred` function)
- Right to data portability

```typescript
// GDPR data export
const export = await supabase.functions.invoke('generate-gdpr-export', {
  body: { profileId }
});

// Crypto-shred (secure deletion)
await supabase.functions.invoke('crypto-shred', {
  body: { profileId, verification: 'user-confirmed' }
});
```

---

# 10. Real-Life Use Cases

## 10.1 Business Intelligence

### Competitive Intelligence Gathering

**Scenario:** Research a competitor's key executives before a major deal.

**Workflow:**
1. Create profiles for target executives from LinkedIn data
2. Run `deep-osint-scan` for public information
3. Map their professional network with `analyze-network-graph`
4. Identify connections in your existing network
5. Generate approach strategies with `generate-influence-strategy`
6. Monitor news and social mentions with `monitor-web-mentions`

**Expected Output:**
- Comprehensive dossiers on each executive
- Network visualization showing connection paths
- Recommended introduction routes
- Key psychological insights for negotiation prep

---

### Partner Due Diligence

**Scenario:** Evaluate a potential business partner before signing a major contract.

**Workflow:**
1. Create partner profile with all known information
2. Run `analyze-profile` for comprehensive assessment
3. Execute `betrayal-likelihood-scorer` for loyalty assessment
4. Perform `mice-recruitment-analyzer` for vulnerability mapping
5. Check `dark-tetrad-profiler` for personality red flags
6. Generate risk report with `generate-executive-summary`

**Expected Output:**
- Risk score (0-100)
- Trust trajectory projection
- Key concerns and red flags
- Mitigation recommendations
- Go/no-go recommendation with confidence level

---

### Sales Relationship Optimization

**Scenario:** Improve close rates by understanding prospect psychology.

**Workflow:**
1. Analyze all communications with prospect
2. Run `analyze-behavioral` for personality profile
3. Identify optimal communication timing
4. Generate personalized approach with `useTacticalNegotiation`
5. Predict objections and prepare responses
6. Monitor relationship health with `predict-churn-enhanced`

**Expected Output:**
- Personality-matched communication templates
- Best times and channels for outreach
- Anticipated objections with counter-scripts
- Deal probability score
- Recommended next actions

---

## 10.2 Personal Security

### Threat Detection and Monitoring

**Scenario:** Protect yourself from a potential adversary.

**Workflow:**
1. Create profile for potential threat
2. Run `assess-threat` for threat level assessment
3. Execute `opsec-vulnerability-analyzer` on yourself
4. Set up `security-monitor` alerts for mentions
5. Configure `counter-intelligence-monitor` for surveillance detection
6. Generate security recommendations with `generate-playbook`

**Expected Output:**
- Threat assessment score
- Your vulnerabilities that could be exploited
- Real-time alerts for threat activity
- Defensive playbook with specific actions
- Counter-surveillance protocols

---

### Digital Footprint Analysis

**Scenario:** Understand what information is publicly available about you.

**Workflow:**
1. Run `deep-osint-scan` on yourself
2. Execute `digital-footprint-scanner` across platforms
3. Identify exposed information with `entity-extraction`
4. Assess risk of each exposure
5. Generate remediation plan

**Expected Output:**
- Complete list of public information sources
- Risk-ranked exposure list
- Step-by-step cleanup guide
- Ongoing monitoring configuration
- OPSEC improvement recommendations

---

## 10.3 Relationship Management

### Family Dynamics Analysis

**Scenario:** Navigate complex family relationships during estate planning.

**Workflow:**
1. Create profiles for all family members
2. Map relationships with `contact_relationships`
3. Run `family-systems-analyzer` for dynamics
4. Identify `sacred-values` that could cause conflict
5. Analyze communication patterns between members
6. Generate mediation strategies

**Expected Output:**
- Family dynamics map
- Potential conflict points
- Sacred values that must be respected
- Recommended communication approaches per person
- Neutral topics and sensitive areas

---

### Romantic Relationship Health

**Scenario:** Assess and improve a romantic relationship.

**Workflow:**
1. Track communications and interactions
2. Run `gottman-relationship-analyzer` for health metrics
3. Identify `emotional-trajectory-analyzer` patterns
4. Detect early warning signs of issues
5. Generate improvement recommendations

**Expected Output:**
- Relationship health score
- Four Horsemen detection (criticism, contempt, defensiveness, stonewalling)
- Sentiment trends over time
- Recommended repair attempts
- Date and activity suggestions

---

## 10.4 Investigation

### Background Investigation

**Scenario:** Conduct thorough background check on a potential hire.

**Workflow:**
1. Create profile with available information
2. Run `deep-osint-scan` for public records
3. Execute `link-social-identities` to find all accounts
4. Perform `stylometric-analyzer` on writing samples
5. Cross-reference with existing network
6. Generate comprehensive report

**Expected Output:**
- Verified identity confirmation
- Complete social media mapping
- Writing style fingerprint
- Network connections revealed
- Red flags and concerns
- Verification confidence score

---

### Evidence Correlation

**Scenario:** Connect disparate pieces of information in an investigation.

**Workflow:**
1. Input all evidence items into system
2. Run `entity-extraction` on all documents
3. Execute `cross-contact-correlation` for hidden links
4. Use `timeline` view to establish chronology
5. Apply `mosaic-intelligence-fuser` for synthesis
6. Generate evidence summary

**Expected Output:**
- Entity relationship map
- Chronological timeline
- Correlation strength scores
- Evidence chains
- Investigation leads
- Confidence assessments

---

### Identity Verification

**Scenario:** Verify that a person is who they claim to be.

**Workflow:**
1. Collect available biometric samples (photo, voice, video)
2. Run `extract-facial-biometrics` on photos
3. Execute `extract-voice-biometrics` on audio
4. Perform `cross-modal-fusion-realtime` for combined verification
5. Compare against existing enrollments
6. Run `semafor-forgery-detector` for deepfake check

**Expected Output:**
- Identity match confidence (0-100%)
- Biometric match details by modality
- Deepfake probability
- Consistency score across sources
- Verification recommendation

---

# Appendices

## A. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Global search |
| `Cmd/Ctrl + N` | New contact |
| `Cmd/Ctrl + /` | AI chat |
| `Cmd/Ctrl + D` | Dashboard |
| `Cmd/Ctrl + Shift + A` | Quick analysis |

## B. API Rate Limits

| Endpoint Type | Limit |
|---------------|-------|
| Standard queries | 100/min |
| AI analysis | 20/min |
| Biometric processing | 10/min |
| Bulk operations | 5/min |

## C. Supported File Formats

| Category | Formats |
|----------|---------|
| Images | JPG, PNG, HEIC, WebP |
| Audio | MP3, WAV, M4A, OGG |
| Video | MP4, MOV, AVI, WebM |
| Documents | PDF, DOCX, TXT, CSV |
| Archives | ZIP (WhatsApp export) |

## D. Error Codes

| Code | Meaning |
|------|---------|
| 401 | Unauthorized - Invalid or expired token |
| 403 | Forbidden - Insufficient clearance level |
| 404 | Not found - Resource doesn't exist |
| 429 | Rate limited - Too many requests |
| 500 | Server error - Check edge function logs |

---

## Document Information

**Version:** 3.8.0  
**Created:** February 2026  
**Maintained by:** HPICS Development Team  
**Classification:** Internal Reference

---

*End of Complete System Reference Guide*
