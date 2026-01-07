# AI Intelligence Enhancement Roadmap

## Current State Analysis

### ✅ Working Well
- `ai_usage_logs` table with comprehensive tracking
- `useAIConfirmation` hook for client-side cost estimation
- `AI_MODEL_PRICING` in `aiPricing.ts` for cost calculation
- ~38 edge functions using Lovable AI Gateway

### 🔴 Critical Gaps Identified

1. **Inconsistent Token Logging**: Not all edge functions update `ai_usage_logs` with actual tokens
2. **No Server-Side Unified Wrapper**: Each function implements AI calls independently
3. **Missing Gemini 3 Pro/Flash Models**: Latest models not in pricing table
4. **No RAG Implementation**: Document embeddings exist but not used for retrieval
5. **No Prompt Library**: Prompts embedded in functions, not centralized

---

## Enhancement Opportunity 1: Unified AI Logging Wrapper

### Goal
100% token tracking across all 50+ edge functions with zero code duplication.

### Implementation Plan

**New File: `supabase/functions/_shared/ai-client.ts`**
```typescript
interface AIRequestOptions {
  model?: string;
  messages: Array<{ role: string; content: string }>;
  userId: string;
  functionName: string;
  profileId?: string;
  temperature?: number;
  maxTokens?: number;
}

interface AIResponse {
  content: string;
  inputTokens: number;
  outputTokens: number;
  costCents: number;
  responseTimeMs: number;
}

export async function callAI(options: AIRequestOptions): Promise<AIResponse> {
  const startTime = Date.now();
  const model = options.model || 'google/gemini-2.5-flash';
  
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      max_completion_tokens: options.maxTokens,
    }),
  });
  
  const data = await response.json();
  const responseTimeMs = Date.now() - startTime;
  
  // Extract usage from response
  const usage = data.usage || {};
  const inputTokens = usage.prompt_tokens || 0;
  const outputTokens = usage.completion_tokens || 0;
  
  // Calculate cost
  const costCents = calculateCost(model, inputTokens, outputTokens);
  
  // Log to ai_usage_logs
  await logUsage({
    userId: options.userId,
    functionName: options.functionName,
    model,
    inputTokens,
    outputTokens,
    costCents,
    responseTimeMs,
    profileId: options.profileId,
    status: 'completed',
  });
  
  return {
    content: data.choices?.[0]?.message?.content || '',
    inputTokens,
    outputTokens,
    costCents,
    responseTimeMs,
  };
}
```

### Migration Steps
1. Create shared AI client
2. Update all 38 edge functions to use shared client
3. Remove duplicate logging code
4. Add automatic error logging

---

## Enhancement Opportunity 2: Model Tier Selection

### Goal
Dynamic model selection based on task complexity, budget, and user preferences.

### Implementation Plan

**New File: `supabase/functions/_shared/model-selector.ts`**
```typescript
type TaskComplexity = 'simple' | 'moderate' | 'complex' | 'expert';

interface ModelSelection {
  model: string;
  displayName: string;
  estimatedCostPer1k: number;
}

const MODEL_TIERS = {
  // Speed tier (fast, cheap)
  speed: ['google/gemini-2.5-flash-lite', 'openai/gpt-5-nano'],
  // Balanced tier (default)
  balanced: ['google/gemini-2.5-flash', 'openai/gpt-5-mini'],
  // Quality tier (best results)
  quality: ['google/gemini-2.5-pro', 'openai/gpt-5'],
  // Next-gen tier (bleeding edge)
  nextgen: ['google/gemini-3-pro-preview', 'openai/gpt-5'],
};

export function selectModel(
  taskType: string,
  complexity: TaskComplexity,
  userPreference?: string
): ModelSelection {
  // If user has explicit preference, use it
  if (userPreference && isValidModel(userPreference)) {
    return getModelInfo(userPreference);
  }
  
  // Auto-select based on task
  const taskModelMap: Record<string, string> = {
    'behavioral-analysis': 'quality',
    'facial-analysis': 'quality',
    'quick-summary': 'speed',
    'gift-suggestions': 'balanced',
    'milestone-detection': 'balanced',
    'network-analysis': 'quality',
    'dossier-generation': 'nextgen',
  };
  
  const tier = taskModelMap[taskType] || 'balanced';
  return getModelInfo(MODEL_TIERS[tier][0]);
}
```

### Features
- User can override in settings
- Per-function model preferences stored in `ai_model_preferences`
- Automatic fallback if preferred model unavailable

---

## Enhancement Opportunity 3: RAG Implementation

### Goal
Enable AI to retrieve relevant context from stored documents, messages, and analyses.

### Implementation Plan

**Database Changes:**
- `document_embeddings` table already exists
- Add vector search function

**New Edge Function: `supabase/functions/rag-query/index.ts`**
```typescript
// 1. Generate embedding for query
// 2. Search document_embeddings for similar content
// 3. Build context from top-K results
// 4. Include context in AI prompt
// 5. Return AI response with citations
```

**Use Cases:**
1. **Meeting Briefing**: Pull relevant past conversations
2. **Dossier Generation**: Include document excerpts
3. **Gift Suggestions**: Reference past gift preferences
4. **Behavioral Analysis**: Compare against historical patterns

### Integration Points
- `generate-briefing` - Add RAG for conversation context
- `generate-dossier` - Include document references
- `analyze-behavioral` - Historical pattern comparison
- Search in message templates

---

## Enhancement Opportunity 4: Prompt Library

### Goal
Centralized, versioned, testable prompts for all AI functions.

### Implementation Plan

**New File: `supabase/functions/_shared/prompts/index.ts`**
```typescript
export const PROMPTS = {
  behavioral_analysis: {
    v1: {
      system: `You are an expert behavioral analyst...`,
      template: (data: BehavioralData) => `Analyze the following behavioral patterns...`,
    },
  },
  gift_suggestions: {
    v1: {
      system: `You are a thoughtful gift recommendation expert...`,
      template: (profile: Profile, occasion: string) => `...`,
    },
  },
  // ... all prompts
};

export function getPrompt(type: string, version?: string) {
  const prompt = PROMPTS[type];
  return version ? prompt[version] : prompt[Object.keys(prompt).pop()];
}
```

**Database Table: `prompt_versions`**
- Track prompt performance
- A/B test prompts
- Rollback capability

---

## Enhancement Opportunity 5: Cost Dashboard

### Goal
Real-time AI cost visibility with budgets, alerts, and optimization suggestions.

### Implementation Plan

**New Component: `src/components/ai/AICostDashboard.tsx`**
- Daily/weekly/monthly spending charts
- Per-function cost breakdown
- Model usage distribution
- Cost projection based on trends
- Budget alerts (already in `ai_budget_settings`)

**New Metrics:**
- Average cost per contact
- Cost per analysis type
- Token efficiency ratios
- Model selection patterns

---

## Untapped Potential 1: Cross-Modal Correlation

### Goal
Correlate insights across voice, facial, behavioral, and text analysis.

### Implementation Plan

**New Edge Function: `supabase/functions/cross-modal-synthesis/index.ts`**
```typescript
// Inputs: profileId
// 1. Fetch vocal_analyses, facial_analyses, behavioral_analyses
// 2. Identify patterns that appear across modalities
// 3. Calculate confidence boost for corroborated findings
// 4. Detect contradictions (e.g., happy voice, sad face)
// 5. Generate unified personality synthesis
```

**Use Cases:**
- Detect deception (voice stress + facial micro-expressions)
- Validate personality assessments
- Build comprehensive behavioral baseline
- Identify emotional triggers

---

## Untapped Potential 2: Network Graph ML

### Goal
Apply graph algorithms and ML to relationship network.

### Implementation Plan

**New Capabilities:**
1. **Community Detection**: Identify clusters using Louvain algorithm
2. **Influence Propagation**: Model how influence spreads
3. **Bridge Detection**: Find key connectors between groups
4. **Churn Prediction**: Use graph features for prediction
5. **Introduction Optimization**: Maximize network value

**Implementation:**
- Use D3-force for visualization (already present)
- Add server-side graph analysis with NetworkX patterns
- Store computed graph metrics

---

## Untapped Potential 3: Predictive Churn Model

### Goal
Predict which relationships are at risk before they decay.

### Implementation Plan

**Features for Model:**
- Days since last contact
- Communication frequency trend
- Sentiment trajectory
- Response time changes
- Relationship score history
- Life milestone proximity

**New Edge Function: `supabase/functions/predict-churn/index.ts`**
- Calculate risk score 0-100
- Provide time-to-churn estimate
- Suggest intervention actions
- Track prediction accuracy

---

## Untapped Potential 4: Auto-Enrichment Pipeline

### Goal
Automatically enrich profiles and trigger analyses when new data arrives.

### Implementation Plan

**Database Triggers:**
```sql
-- When new message arrives
CREATE TRIGGER on_message_insert
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION queue_enrichment(NEW.conversation_id);

-- When new media uploaded
CREATE TRIGGER on_media_insert
AFTER INSERT ON media
FOR EACH ROW
EXECUTE FUNCTION queue_analysis(NEW.id);
```

**Queue Processing:**
- Use `bulk_operation_queue` table
- Background job processes queue
- Rate limiting for cost control
- Priority based on relationship importance

---

## Implementation Priority

### Phase 1 (Week 1-2)
1. ✅ Unified AI Logging Wrapper
2. ✅ Update aiPricing.ts with Gemini 3 models

### Phase 2 (Week 3-4)
3. Model Tier Selection
4. Prompt Library foundation

### Phase 3 (Week 5-6)
5. Cost Dashboard UI
6. RAG for briefings

### Phase 4 (Week 7-8)
7. Cross-Modal Correlation
8. Predictive Churn Model

### Phase 5 (Week 9-10)
9. Network Graph ML
10. Auto-Enrichment Pipeline

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Token tracking coverage | ~60% | 100% |
| Average cost per analysis | Unknown | -20% |
| Prompt reuse rate | 0% | 80% |
| Cross-modal insights | 0 | 5 per contact |
| Churn prediction accuracy | N/A | 75% |
| Auto-enrichment rate | 0% | 50% |
