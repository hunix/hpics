# HPICS Use Case Playbooks
> Step-by-Step Scenario Guides for Real-World Operations

---

## Table of Contents

1. [Business Intelligence](#1-business-intelligence)
2. [Personal Security](#2-personal-security)
3. [Relationship Management](#3-relationship-management)
4. [Investigation & Verification](#4-investigation--verification)
5. [Negotiation & Influence](#5-negotiation--influence)
6. [Network Operations](#6-network-operations)
7. [Biometric Operations](#7-biometric-operations)
8. [Autonomous Campaigns](#8-autonomous-campaigns)

---

# 1. Business Intelligence

## Playbook 1.1: Competitive Intelligence Gathering

### Objective
Build comprehensive intelligence profiles on competitor executives before a major business engagement.

### Prerequisites
- Target executive names and basic information
- LinkedIn access for profile data
- Company association context

### Step-by-Step Execution

#### Step 1: Initial Profile Creation
```typescript
// Create profiles for each target
const profile = await createProfile({
  firstName: 'John',
  lastName: 'Smith',
  organization: 'Competitor Corp',
  jobTitle: 'VP of Sales',
  relationshipType: 'professional',
  tags: ['competitor', 'vp-level', 'sales']
});
```

**Manual Steps:**
1. Navigate to `/contacts/new`
2. Fill in known information
3. Add relevant tags for filtering

#### Step 2: OSINT Enrichment
```typescript
// Run deep OSINT scan
await supabase.functions.invoke('deep-osint-scan', {
  body: {
    userId,
    profileId: profile.id,
    sources: ['linkedin', 'news', 'social', 'public_records'],
    depth: 'comprehensive'
  }
});
```

**What This Finds:**
- Social media profiles across platforms
- News mentions and press releases
- Public speaking engagements
- Patent filings and publications
- Board memberships and affiliations

#### Step 3: Network Mapping
```typescript
// Analyze their professional network
await supabase.functions.invoke('analyze-network-graph', {
  body: {
    userId,
    profileId: profile.id,
    depth: 2, // Two degrees of separation
    includeInferred: true
  }
});
```

**Output:**
- Direct connections
- Shared connections with your network
- Potential introduction paths
- Network influence score

#### Step 4: Psychological Profiling
```typescript
// Generate behavioral analysis
await supabase.functions.invoke('analyze-behavioral', {
  body: {
    userId,
    profileId: profile.id,
    analysisTypes: ['personality', 'communication_style', 'decision_patterns']
  }
});
```

**Output:**
- OCEAN personality scores
- Preferred communication channels
- Decision-making style
- Risk tolerance assessment

#### Step 5: Generate Approach Strategy
```typescript
// Create tailored approach
const strategy = await supabase.functions.invoke('generate-influence-strategy', {
  body: {
    userId,
    profileId: profile.id,
    objective: 'establish_business_relationship',
    constraints: ['professional', 'non-aggressive']
  }
});
```

**Deliverables:**
- Recommended first contact approach
- Talking points tailored to their interests
- Potential objections and responses
- Optimal timing recommendations

### Expected Timeline
- Step 1-2: 1 hour
- Step 3-4: 2-3 hours (processing time)
- Step 5: 30 minutes

### Success Metrics
- Profile completeness > 70%
- Identified connection path to target
- Generated actionable approach strategy

---

## Playbook 1.2: Partner Due Diligence

### Objective
Thoroughly vet a potential business partner before signing a significant agreement.

### Risk Assessment Framework

#### Step 1: Comprehensive Profile Build
```typescript
// Create detailed partner profile
const partner = await createProfile({
  firstName: 'Sarah',
  lastName: 'Johnson',
  organization: 'Partner LLC',
  jobTitle: 'CEO',
  relationshipType: 'professional',
  tags: ['potential-partner', 'due-diligence']
});
```

#### Step 2: Background Verification
```typescript
// Run identity and background checks
await supabase.functions.invoke('comprehensive-contact-scan', {
  body: {
    userId,
    profileId: partner.id,
    checkTypes: [
      'identity_verification',
      'corporate_history',
      'litigation_search',
      'media_sentiment',
      'financial_indicators'
    ]
  }
});
```

**Red Flags to Watch:**
- Inconsistent employment history
- Undisclosed litigation
- Negative press patterns
- Corporate dissolution history
- Bankruptcy filings

#### Step 3: Loyalty & Trust Assessment
```typescript
// Assess betrayal risk
const loyalty = await supabase.functions.invoke('betrayal-likelihood-scorer', {
  body: { userId, profileId: partner.id }
});

// Check trust trajectory
const trust = await supabase.functions.invoke('relationship-half-life-calculator', {
  body: { userId, profileId: partner.id }
});
```

**Output Interpretation:**
| Score | Risk Level | Recommendation |
|-------|------------|----------------|
| 0-20% | Low | Proceed with standard agreements |
| 20-40% | Moderate | Include protective clauses |
| 40-60% | Elevated | Consider additional guarantees |
| 60%+ | High | Recommend against partnership |

#### Step 4: Dark Triad Screening
```typescript
// Check for problematic personality traits
const darkTraits = await supabase.functions.invoke('dark-tetrad-profiler', {
  body: { userId, profileId: partner.id }
});
```

**Warning Thresholds:**
- Narcissism > 0.7: Ego conflicts likely
- Machiavellianism > 0.7: May prioritize self-interest
- Psychopathy > 0.5: Significant concern

#### Step 5: Generate Due Diligence Report
```typescript
// Compile comprehensive report
await supabase.functions.invoke('generate-intelligence-dossier', {
  body: {
    userId,
    profileId: partner.id,
    sections: [
      'executive_summary',
      'background_verification',
      'psychological_profile',
      'risk_assessment',
      'network_analysis',
      'recommendations'
    ]
  }
});
```

### Decision Matrix

| Factor | Weight | Score | Weighted |
|--------|--------|-------|----------|
| Background clean | 25% | 0-100 | × |
| Trust score | 20% | 0-100 | × |
| Personality fit | 15% | 0-100 | × |
| Network reputation | 15% | 0-100 | × |
| Financial stability | 15% | 0-100 | × |
| Communication style | 10% | 0-100 | × |
| **Total** | 100% | | **Go/No-Go** |

**Threshold:** Score > 70 = Proceed, 50-70 = Caution, <50 = Decline

---

# 2. Personal Security

## Playbook 2.1: Threat Detection & Monitoring

### Objective
Identify and monitor potential threats to personal or family safety.

### Step 1: Threat Profile Creation
```typescript
const threat = await createProfile({
  firstName: 'Unknown',
  lastName: 'Threat',
  relationshipType: 'adversary',
  status: 'under_analysis',
  tags: ['threat', 'monitoring']
});
```

**Information to Gather:**
- Any identifying information
- Known associates
- Behavioral patterns observed
- Communication attempts
- Physical sightings

### Step 2: Threat Assessment
```typescript
// Run threat analysis
const assessment = await supabase.functions.invoke('assess-threat', {
  body: {
    userId,
    profileId: threat.id,
    threatTypes: ['physical', 'cyber', 'reputational', 'financial']
  }
});
```

**Threat Levels:**
| Level | Score | Response |
|-------|-------|----------|
| Minimal | 0-2 | Monitor only |
| Low | 2-4 | Increase awareness |
| Moderate | 4-6 | Active countermeasures |
| High | 6-8 | Professional security consultation |
| Critical | 8-10 | Immediate action required |

### Step 3: Self-Vulnerability Assessment
```typescript
// Analyze your own vulnerabilities
await supabase.functions.invoke('opsec-vulnerability-analyzer', {
  body: {
    userId,
    targetType: 'self',
    domains: ['digital', 'physical', 'social', 'financial']
  }
});
```

**Check List:**
- [ ] Social media privacy settings
- [ ] Address visibility in public records
- [ ] Digital footprint exposure
- [ ] Routine predictability
- [ ] Family member exposure

### Step 4: Set Up Monitoring
```typescript
// Configure continuous monitoring
await supabase.functions.invoke('security-monitor', {
  body: {
    userId,
    profileId: threat.id,
    monitorTypes: ['social_media', 'news', 'public_records', 'dark_web'],
    alertThreshold: 'low',
    notificationChannel: 'push'
  }
});
```

### Step 5: Generate Security Playbook
```typescript
// Create personalized security protocol
await supabase.functions.invoke('generate-playbook', {
  body: {
    userId,
    playbookType: 'personal_security',
    threatProfile: threat.id,
    includeFamily: true
  }
});
```

**Playbook Contents:**
- Daily security checklist
- Emergency contact protocols
- Safe routes and locations
- Communication security guidelines
- Escalation procedures

---

## Playbook 2.2: Digital Footprint Audit

### Objective
Discover and assess all publicly available information about yourself.

### Step 1: Comprehensive OSINT Self-Scan
```typescript
// Create self-profile for analysis
const selfProfile = await createProfile({
  firstName: 'Your',
  lastName: 'Name',
  email: 'your@email.com',
  relationshipType: 'asset', // Use for self
  tags: ['self-audit']
});

// Run deep scan
await supabase.functions.invoke('digital-footprint-scanner', {
  body: {
    userId,
    profileId: selfProfile.id,
    searchTerms: [
      'Your Name',
      'your@email.com',
      'phone number',
      'former addresses'
    ]
  }
});
```

### Step 2: Social Media Mapping
```typescript
// Find all linked accounts
await supabase.functions.invoke('link-social-identities', {
  body: {
    userId,
    profileId: selfProfile.id,
    platforms: ['linkedin', 'twitter', 'facebook', 'instagram', 'tiktok', 'reddit']
  }
});
```

### Step 3: Risk Assessment per Finding
```typescript
// Categorize each finding
const findings = await supabase.functions.invoke('categorize-exposure', {
  body: { userId, profileId: selfProfile.id }
});
```

**Risk Categories:**
| Category | Example | Risk | Action |
|----------|---------|------|--------|
| Address | Home on whitepages | High | Request removal |
| Phone | Listed in directory | Medium | Consider changing |
| Email | On breach lists | High | Change + 2FA |
| Photos | Location metadata | Medium | Strip metadata |
| Employment | Public resume | Low | Review content |

### Step 4: Remediation Plan
```typescript
// Generate cleanup checklist
await supabase.functions.invoke('generate-remediation-plan', {
  body: {
    userId,
    profileId: selfProfile.id,
    priorityOrder: 'risk_level'
  }
});
```

**Sample Output:**
1. **Immediate (24h):** Request removal from data brokers
2. **Short-term (1 week):** Update privacy settings on all platforms
3. **Medium-term (1 month):** Monitor for new exposures
4. **Ongoing:** Regular re-scans every 90 days

---

# 3. Relationship Management

## Playbook 3.1: Family Dynamics Navigation

### Objective
Understand and navigate complex family relationships, especially during high-stakes situations (estate planning, family business decisions).

### Step 1: Family Profile Creation
Create profiles for each family member with relationship links.

```typescript
// Create family member profiles
const members = ['Dad', 'Mom', 'Sister', 'Brother', 'Uncle'];
for (const member of members) {
  await createProfile({
    firstName: member,
    relationshipType: 'family',
    tags: ['family', 'estate-planning']
  });
}

// Create relationship links
await createRelationship({
  sourceId: dadId,
  targetId: momId,
  type: 'spouse',
  strength: 0.9
});
```

### Step 2: Family Systems Analysis
```typescript
// Analyze family dynamics
await supabase.functions.invoke('family-systems-analyzer', {
  body: {
    userId,
    familyMemberIds: [dadId, momId, sisterId, brotherId],
    analysisType: 'comprehensive'
  }
});
```

**Output:**
- Family hierarchy map
- Alliance structures
- Conflict patterns
- Communication flow
- Power dynamics

### Step 3: Sacred Values Mapping
```typescript
// Identify non-negotiables for each person
for (const memberId of familyMemberIds) {
  await supabase.functions.invoke('sacred-value-predictor', {
    body: { userId, profileId: memberId }
  });
}
```

**Use This For:**
- Avoiding triggering statements
- Finding common ground
- Predicting conflict points
- Crafting unifying messages

### Step 4: Communication Strategy
```typescript
// Generate tailored approach for each member
const strategies = await supabase.functions.invoke('generate-family-communication-plan', {
  body: {
    userId,
    familyMemberIds,
    objective: 'estate_planning_consensus'
  }
});
```

### Step 5: Mediation Preparation
```typescript
// Prepare for difficult conversations
await supabase.functions.invoke('generate-meeting-prep', {
  body: {
    userId,
    participantIds: familyMemberIds,
    meetingType: 'family_mediation',
    objective: 'reach_agreement'
  }
});
```

---

## Playbook 3.2: Relationship Health Monitoring

### Objective
Continuously monitor and maintain health of key relationships.

### Step 1: Configure Tracking
```typescript
// Set up relationship health monitoring
await supabase.functions.invoke('behavioral-baseline-monitor', {
  body: {
    userId,
    profileIds: importantContactIds,
    metrics: ['communication_frequency', 'sentiment', 'response_time'],
    alertOnAnomaly: true
  }
});
```

### Step 2: Regular Health Checks
```typescript
// Weekly health assessment
const health = await supabase.functions.invoke('gottman-relationship-analyzer', {
  body: {
    userId,
    profileId: partnerId,
    timeframe: '7d'
  }
});
```

**Health Indicators:**
| Metric | Healthy | Warning | Critical |
|--------|---------|---------|----------|
| Positive:Negative ratio | >5:1 | 3-5:1 | <3:1 |
| Response time | <2h | 2-8h | >24h |
| Initiation balance | 40-60% | 30-40% | <30% |
| Four Horsemen present | None | 1-2 | 3-4 |

### Step 3: Intervention Triggers
```typescript
// Set up automatic intervention suggestions
await supabase.functions.invoke('generate-churn-intervention', {
  body: {
    userId,
    profileId,
    interventionType: 'proactive'
  }
});
```

**Auto-Suggestions:**
- "You haven't connected with [Name] in 14 days"
- "Sentiment trending negative - consider reaching out"
- "Birthday coming up - gift suggestions ready"

---

# 4. Investigation & Verification

## Playbook 4.1: Background Investigation

### Objective
Conduct thorough background investigation on an individual.

### Step 1: Information Aggregation
```typescript
// Compile all available information
await supabase.functions.invoke('aggregate-contact-intelligence', {
  body: {
    userId,
    profileId: targetId,
    sources: ['manual_input', 'osint', 'social', 'public_records']
  }
});
```

### Step 2: Identity Verification
```typescript
// Verify claimed identity
const verification = await supabase.functions.invoke('entity-resolution-engine', {
  body: {
    userId,
    profileId: targetId,
    verificationLevel: 'high'
  }
});
```

**Verification Checks:**
- Name consistency across sources
- Photo matching across platforms
- Address history validation
- Employment history verification
- Education credentials check

### Step 3: Criminal & Litigation Search
```typescript
// Search public records
await supabase.functions.invoke('deep-osint-scan', {
  body: {
    userId,
    profileId: targetId,
    sources: ['court_records', 'news_archives', 'regulatory_filings']
  }
});
```

### Step 4: Social Network Analysis
```typescript
// Map their network
await supabase.functions.invoke('analyze-network-deep', {
  body: {
    userId,
    profileId: targetId,
    depth: 2,
    analyzeTypes: ['professional', 'personal', 'financial']
  }
});
```

**Look For:**
- Known associates with red flags
- Connections to competitors
- Hidden affiliations
- Pattern of relationship failures

### Step 5: Generate Investigation Report
```typescript
// Compile final report
await supabase.functions.invoke('generate-intelligence-dossier', {
  body: {
    userId,
    profileId: targetId,
    template: 'background_investigation',
    classification: 'confidential'
  }
});
```

---

## Playbook 4.2: Identity Verification with Biometrics

### Objective
Verify someone's identity using multi-modal biometric analysis.

### Step 1: Biometric Sample Collection
```typescript
// Enroll reference biometrics
const enrollment = await supabase.functions.invoke('extract-facial-biometrics', {
  body: {
    userId,
    profileId: targetId,
    imageUrl: referencePhotoUrl,
    enrollmentType: 'reference'
  }
});
```

### Step 2: Cross-Reference Verification
```typescript
// Match against probe sample
const match = await supabase.functions.invoke('match-biometrics', {
  body: {
    userId,
    probeEmbedding: newPhotoEmbedding,
    modalityType: 'facial',
    threshold: 0.80
  }
});
```

### Step 3: Multi-Modal Fusion (Higher Confidence)
```typescript
// Combine multiple modalities
const fusion = await supabase.functions.invoke('cross-modal-fusion-realtime', {
  body: {
    userId,
    modalities: {
      facial: { embedding: faceVector, confidence: 0.92 },
      voice: { embedding: voiceVector, confidence: 0.88 }
    }
  }
});
// Combined confidence: 0.98+
```

### Step 4: Deepfake Detection
```typescript
// Verify authenticity
const authentic = await supabase.functions.invoke('semafor-forgery-detector', {
  body: {
    userId,
    mediaUrl: videoUrl,
    checkTypes: ['deepfake', 'face_swap', 'audio_splice']
  }
});
```

### Verification Confidence Levels

| Method | Confidence | Use Case |
|--------|------------|----------|
| Single photo | 70-85% | Initial screening |
| Multiple photos | 85-92% | Standard verification |
| Face + Voice | 92-97% | High-value transactions |
| Full multi-modal | 97-99% | Critical security |

---

# 5. Negotiation & Influence

## Playbook 5.1: Negotiation Preparation

### Objective
Prepare comprehensive strategy for a high-stakes negotiation.

### Step 1: Counterpart Analysis
```typescript
// Deep analysis of negotiating counterpart
await supabase.functions.invoke('analyze-profile', {
  body: {
    userId,
    profileId: counterpartId,
    analysisTypes: [
      'personality',
      'negotiation_style',
      'decision_patterns',
      'risk_tolerance'
    ]
  }
});
```

### Step 2: Tactical Domain Assessment
```typescript
// Apply 12 tactical domains
import { useTacticalNegotiation } from '@/hooks/intelligence/core';

const {
  strategies,
  tacticalDomains,
  generateStrategy
} = useTacticalNegotiation(counterpartId);

// Get tailored tactics
await generateStrategy({
  negotiationType: 'salary',
  yourPosition: 'seeking_raise',
  theirLikelyPosition: 'budget_constraints'
});
```

### Step 3: BATNA Analysis
```typescript
// Assess alternatives for both sides
await supabase.functions.invoke('analyze-negotiation-batna', {
  body: {
    userId,
    profileId: counterpartId,
    scenario: 'contract_renewal',
    yourBATNA: ['competitor_offer', 'current_terms'],
    estimateTheirBATNA: true
  }
});
```

### Step 4: Script Generation
```typescript
// Generate conversation scripts
const scripts = await supabase.functions.invoke('generate-message-templates', {
  body: {
    userId,
    profileId: counterpartId,
    context: 'negotiation',
    scenarios: [
      'opening_position',
      'objection_handling',
      'value_proposition',
      'closing_attempt'
    ]
  }
});
```

### Step 5: Simulation & Practice
Review generated strategies and practice key scenarios:

| Phase | Your Move | Their Likely Response | Your Counter |
|-------|-----------|----------------------|--------------|
| Opening | Anchor high | Push back | Justify with data |
| Middle | Trade concession | Accept/Counter | Secure commitment |
| Closing | Create urgency | Delay/Accept | Alternative deadline |

---

## Playbook 5.2: Influence Campaign Design

### Objective
Design and execute a strategic influence operation on a target individual.

### Step 1: Target Profiling
```typescript
// Comprehensive psychological profile
await supabase.functions.invoke('deep-psychological-analysis', {
  body: {
    userId,
    profileId: targetId,
    depth: 'maximum'
  }
});
```

### Step 2: MICE Vulnerability Assessment
```typescript
// Identify approach vectors
const mice = await supabase.functions.invoke('mice-recruitment-analyzer', {
  body: { userId, profileId: targetId }
});

// Optimal approach based on highest score
const approach = mice.optimal_approach; // e.g., 'ego_flattery'
```

### Step 3: Influence Path Planning
```typescript
// If indirect approach needed, find path
await supabase.functions.invoke('network-influence-propagation', {
  body: {
    userId,
    targetId,
    influenceType: 'indirect',
    maxHops: 3
  }
});
```

### Step 4: Campaign Execution Plan
```typescript
// Generate phased campaign
await supabase.functions.invoke('influence-campaign-optimizer', {
  body: {
    userId,
    targetId,
    objective: 'secure_investment',
    timeline: '90_days',
    constraints: ['professional', 'legal']
  }
});
```

**Campaign Phases:**
1. **Awareness (Days 1-14):** Establish presence in their network
2. **Interest (Days 15-30):** Demonstrate value alignment
3. **Evaluation (Days 31-60):** Provide social proof
4. **Decision (Days 61-90):** Create opportunity and urgency

---

# 6. Network Operations

## Playbook 6.1: Network Expansion Strategy

### Objective
Strategically grow your network to reach specific targets or opportunities.

### Step 1: Current Network Analysis
```typescript
// Analyze existing network structure
const network = await supabase.functions.invoke('analyze-network-graph', {
  body: {
    userId,
    includeStrength: true,
    calculateMetrics: ['centrality', 'clustering', 'reach']
  }
});
```

### Step 2: Gap Identification
```typescript
// Find structural holes and missing connections
const gaps = await supabase.functions.invoke('suggest-network-growth', {
  body: {
    userId,
    targetIndustries: ['tech', 'finance'],
    targetLevels: ['executive', 'founder'],
    growthObjective: 'reach_optimization'
  }
});
```

### Step 3: Path to Target Planning
```typescript
// If specific target in mind
const path = await supabase.functions.invoke('network-exploitation-mapper', {
  body: {
    userId,
    targetProfileId: targetId,
    pathConstraints: {
      maxHops: 3,
      minRelationshipStrength: 0.6,
      preferWarmIntros: true
    }
  }
});
```

### Step 4: Introduction Requests
```typescript
// Generate introduction requests
await supabase.functions.invoke('suggest-introductions', {
  body: {
    userId,
    targetProfileId: targetId,
    introRequestTemplates: true
  }
});
```

---

## Playbook 6.2: Information Cascade Planning

### Objective
Plan strategic dissemination of information through a network.

### Step 1: Network Topology Analysis
```typescript
// Identify key spreaders
const spreaders = await supabase.functions.invoke('social-graph-predictor', {
  body: {
    userId,
    predictionType: 'influence_spread',
    messageType: 'information'
  }
});
```

### Step 2: Cascade Simulation
```typescript
// Model information spread
const simulation = await supabase.functions.invoke('network-cascade-modeler', {
  body: {
    userId,
    seedNodes: [spreader1Id, spreader2Id],
    message: 'product_launch_announcement',
    modelType: 'SIR' // Susceptible-Infected-Recovered
  }
});
```

### Step 3: Optimization
```typescript
// Find optimal seed set
const optimal = await supabase.functions.invoke('influence-propagation-engine', {
  body: {
    userId,
    objective: 'maximize_reach',
    budget: 5, // Number of seeds
    targetAudience: ['investors', 'media']
  }
});
```

---

# 7. Biometric Operations

## Playbook 7.1: Multi-Modal Identification

### Objective
Identify an individual using multiple biometric modalities.

### Step 1: Collect Available Samples
```typescript
// Process all available modalities
const samples = {};

// Facial from photo
if (photoAvailable) {
  samples.facial = await supabase.functions.invoke('extract-facial-biometrics', {
    body: { userId, imageUrl: photoUrl }
  });
}

// Voice from audio
if (audioAvailable) {
  samples.voice = await supabase.functions.invoke('extract-voice-biometrics', {
    body: { userId, audioUrl }
  });
}

// Gait from video
if (videoAvailable) {
  samples.gait = await supabase.functions.invoke('analyze-gait-pattern', {
    body: { userId, videoUrl }
  });
}
```

### Step 2: Individual Modality Search
```typescript
// Search each modality
const results = {};
for (const [modality, embedding] of Object.entries(samples)) {
  results[modality] = await supabase.functions.invoke('match-biometrics', {
    body: {
      userId,
      modalityType: modality,
      probeEmbedding: embedding.vector,
      threshold: 0.70,
      maxResults: 5
    }
  });
}
```

### Step 3: Cross-Modal Fusion
```typescript
// Combine for highest confidence
const fused = await supabase.functions.invoke('cross-modal-fusion-realtime', {
  body: {
    userId,
    modalities: samples,
    fusionMethod: 'dempster_shafer'
  }
});
```

### Step 4: Identity Confirmation
```
Confidence Matrix:
| Modality | Match | Confidence |
|----------|-------|------------|
| Facial   | John  | 89%        |
| Voice    | John  | 82%        |
| Gait     | John  | 71%        |
| FUSED    | John  | 97%        |
```

---

## Playbook 7.2: Deception Detection Analysis

### Objective
Analyze media for signs of deception or manipulation.

### Step 1: Multi-Modal Input
```typescript
// Analyze video interview for deception
const analysis = await supabase.functions.invoke('multimodal-deception-analyzer', {
  body: {
    userId,
    mediaUrl: interviewVideoUrl,
    analysisTypes: ['facial', 'vocal', 'linguistic', 'behavioral']
  }
});
```

### Step 2: Baseline Comparison
```typescript
// Compare against established baseline
const comparison = await supabase.functions.invoke('behavioral-baseline-monitor', {
  body: {
    userId,
    profileId: speakerId,
    probeMedia: interviewVideoUrl,
    comparisonType: 'deception_deviation'
  }
});
```

### Step 3: Indicator Analysis
```
Deception Indicators Detected:
| Indicator | Timestamp | Confidence | Type |
|-----------|-----------|------------|------|
| Gaze aversion | 2:34 | 78% | Facial |
| Pitch increase | 2:35 | 82% | Vocal |
| Increased blink rate | 2:33-2:38 | 71% | Facial |
| Verbal hedging | 2:36 | 85% | Linguistic |

Overall Assessment: Elevated deception probability (0.73) at timestamp 2:33-2:40
Topic discussed: "Previous employer departure"
```

---

# 8. Autonomous Campaigns

## Playbook 8.1: Long-Term Relationship Nurture

### Objective
Set up autonomous campaign to maintain and strengthen key relationships.

### Step 1: Campaign Configuration
```typescript
// Create nurture campaign
const campaign = await supabase.functions.invoke('autonomous-intelligence-orchestrator', {
  body: {
    userId,
    action: 'create_campaign',
    campaignConfig: {
      name: 'Key Investor Nurture',
      campaignType: 'relationship_maintenance',
      targetProfileIds: investorIds,
      objectives: [
        { goal: 'maintain_engagement', metric: 'monthly_touchpoint' },
        { goal: 'increase_trust', metric: 'trust_score > 0.8' }
      ],
      constraints: {
        maxContactsPerWeek: 2,
        approvedChannels: ['email', 'linkedin'],
        contentApprovalRequired: true
      },
      duration: '180_days'
    }
  }
});
```

### Step 2: Content Strategy
```typescript
// Configure content generation
await supabase.functions.invoke('autonomous-intelligence-orchestrator', {
  body: {
    action: 'configure_content',
    campaignId: campaign.id,
    contentTypes: [
      { type: 'industry_insights', frequency: 'biweekly' },
      { type: 'personal_milestone', trigger: 'birthday_anniversary' },
      { type: 'relevant_introduction', trigger: 'opportunity_detected' }
    ]
  }
});
```

### Step 3: Monitoring & Adjustment
```typescript
// Set up monitoring
await supabase.functions.invoke('autonomous-intelligence-orchestrator', {
  body: {
    action: 'configure_monitoring',
    campaignId: campaign.id,
    metrics: ['engagement_rate', 'sentiment_trend', 'response_rate'],
    alertThresholds: {
      engagement_drop: 0.3,
      negative_sentiment: 0.2
    },
    autoAdjust: true
  }
});
```

### Step 4: Review & Iterate
```typescript
// Weekly campaign review
const review = await supabase.functions.invoke('autonomous-intelligence-orchestrator', {
  body: {
    action: 'get_campaign_report',
    campaignId: campaign.id,
    reportType: 'weekly_summary'
  }
});
```

---

## Playbook 8.2: Intelligence Monitoring Operation

### Objective
Continuous monitoring and intelligence gathering on targets of interest.

### Step 1: Monitoring Campaign Setup
```typescript
const monitoring = await supabase.functions.invoke('autonomous-intelligence-orchestrator', {
  body: {
    userId,
    action: 'create_campaign',
    campaignConfig: {
      name: 'Competitor Executive Watch',
      campaignType: 'intelligence_gathering',
      targetProfileIds: competitorExecIds,
      objectives: [
        { goal: 'detect_job_changes', alert: true },
        { goal: 'track_public_statements', analyze: true },
        { goal: 'monitor_network_changes', report: 'weekly' }
      ],
      sources: ['linkedin', 'news', 'social', 'company_filings'],
      analysisFrequency: 'daily'
    }
  }
});
```

### Step 2: Alert Configuration
```typescript
// Configure real-time alerts
await supabase.functions.invoke('process-alert-rules', {
  body: {
    campaignId: monitoring.id,
    rules: [
      {
        name: 'Job Change Detection',
        condition: 'job_title_change OR company_change',
        action: 'immediate_alert',
        channels: ['push', 'email']
      },
      {
        name: 'Negative Press',
        condition: 'news_sentiment < -0.5',
        action: 'alert_with_analysis',
        channels: ['push']
      }
    ]
  }
});
```

### Step 3: Intelligence Synthesis
```typescript
// Configure periodic intelligence reports
await supabase.functions.invoke('generate-scheduled-reports', {
  body: {
    campaignId: monitoring.id,
    reportTypes: [
      { type: 'daily_brief', time: '08:00', format: 'push' },
      { type: 'weekly_intel_summary', day: 'monday', format: 'email' }
    ]
  }
});
```

---

# Appendix: Quick Reference Checklists

## Pre-Analysis Checklist
- [ ] Profile created with all available information
- [ ] Relationship type correctly set
- [ ] Tags applied for categorization
- [ ] Connected to relevant groups
- [ ] Basic OSINT scan completed

## Security Operation Checklist
- [ ] Threat assessment completed
- [ ] Self-vulnerability analysis done
- [ ] Monitoring configured
- [ ] Playbook generated
- [ ] Emergency contacts updated

## Negotiation Prep Checklist
- [ ] Counterpart fully profiled
- [ ] Personality analysis reviewed
- [ ] BATNA analyzed (both sides)
- [ ] Scripts generated
- [ ] Tactics prioritized

## Campaign Launch Checklist
- [ ] Objectives clearly defined
- [ ] Target profiles complete
- [ ] Constraints configured
- [ ] Monitoring enabled
- [ ] Escalation rules set

---

*HPICS Playbooks v3.8.0 | For operational use*
