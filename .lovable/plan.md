
# HPICS Revolutionary Enhancement Suite - Completion Plan
## Comprehensive Implementation of All Missing Components

---

## Overview

This plan addresses the complete implementation of all remaining components from the approved Revolutionary Enhancement Suite plan. The work is organized into 4 parallel tracks that can be executed efficiently.

---

## Track 1: Missing Core Libraries (6 files)

### 1.1 Game Theory Suite (NEW DIRECTORY: `src/lib/gameTheory/`)

| File | Purpose | Key Features |
|------|---------|--------------|
| `hypergameEngine.ts` | Level-N belief modeling when adversaries play "different games" | ASP solver simulation, perception gap analysis, Strong/Weak HNE computation |
| `bayesianPersuader.ts` | Optimal information disclosure strategies | Trust-constrained persuasion, sequential online persuasion, signal design |
| `quantumGameSimulator.ts` | Quantum-like decision models for strategic interactions | EWL/Meyer schemes, "miracle moves", entangled strategy simulation |
| `index.ts` | Barrel exports | Type-safe exports for all engines |

### 1.2 Linguistics Extensions (2 files in `src/lib/linguistics/`)

| File | Purpose | Key Features |
|------|---------|--------------|
| `llmDetectionEngine.ts` | Distinguish human vs. LLM-generated text | Burrows' Delta clustering, model fingerprinting, perplexity analysis |
| `crossLanguageDeception.ts` | Culture-specific deception markers | 10+ language support, culture-weighted feature extraction |

### 1.3 Deception Extensions (1 file in `src/lib/deception/`)

| File | Purpose | Key Features |
|------|---------|--------------|
| `cognitiveLoadAnalyzer.ts` | Measure mental effort during deception | Response latency, linguistic complexity under load, concurrent task errors |

---

## Track 2: Missing React Hooks (2 files)

### 2.1 `src/hooks/intelligence/useStylemetricAnalysis.ts`

Wraps the existing `stylometricAnalyzer.ts` library for React consumption.

**Features**:
- `analyzeText(text)` - Returns stylometric features
- `compareAuthorship(text, profileId)` - Match against known writing samples
- `detectLLM(text)` - Check for AI-generated content
- Caches results in `ai_analyses` table

### 2.2 `src/hooks/intelligence/useHypergameTheory.ts`

Interfaces with the new Game Theory suite and existing `hypergame-theory-engine` edge function.

**Features**:
- `modelHypergame(players, perceivedGames)` - Compute HNE
- `findPerceptionGaps(profileIds)` - Identify exploitable belief differences
- `simulateQuantumGame(scenario)` - Run quantum game simulations
- Persists to `ai_analyses` with `analysis_type: 'hypergame'`

---

## Track 3: Missing UI Components (4 files)

### 3.1 `src/components/intelligence/enhancement/StylemetryAnalyzer.tsx`

**Layout**:
- Text input area (paste or file upload)
- Real-time feature extraction display
- Authorship comparison panel
- LLM detection indicator with confidence
- Historical comparison timeline

### 3.2 `src/components/intelligence/enhancement/MemoryExploitationPanel.tsx`

**Layout**:
- Reconsolidation window timeline visualization
- Suggestibility profile radar chart
- Intervention timing recommendations
- Memory anchor status indicators
- Integration with existing `memory-reconsolidation-engine`

### 3.3 `src/components/intelligence/enhancement/HypergameVisualizer.tsx`

**Layout**:
- Multi-level game tree visualization (Level 0 → Level N)
- Perception gap heatmap
- Nash equilibrium indicators
- Strategy simulation controls
- Belief divergence metrics

### 3.4 `src/components/intelligence/enhancement/CollectiveBehaviorMonitor.tsx`

**Layout**:
- Information cascade simulation controls
- Epidemic model selector (SI/SIR/IC/LT)
- Network contagion visualization
- Panic propagation timeline
- Super-spreader identification panel

---

## Track 4: Edge Functions (8 functions)

All functions follow the Enterprise Edge Function Standard with:
- CORS headers + OPTIONS preflight
- GET-based health check (`?healthCheck=1`)
- Dual auth (JWT for users, service role for backend)
- Explicit `instanceof Error` guards
- Result persistence to appropriate tables

### 4.1 `multimodal-deception-analyzer`

**Purpose**: Fuse text/audio/visual signals for deception scoring  
**Model**: `google/gemini-2.5-pro` (multimodal)  
**Persists to**: `deception_analyses` table

```typescript
// Input
{
  profileId: string;
  text?: string;
  audioUrl?: string;
  videoUrl?: string;
  modalities: ('text' | 'audio' | 'visual')[];
}
// Output
{
  deceptionProbability: number;
  confidence: number;
  modalityScores: Record<string, number>;
  fusedMarkers: DeceptionMarker[];
  cognitiveLoadScore: number;
}
```

### 4.2 `stylometric-fingerprinter`

**Purpose**: Extract layered authorship signatures  
**Model**: Local computation + `google/gemini-3-flash-preview` for semantic layers  
**Persists to**: `ai_analyses` with `analysis_type: 'stylometric'`

### 4.3 `hypergame-solver`

**Purpose**: Compute Hypergame Nash Equilibria  
**Model**: `google/gemini-2.5-pro` for belief modeling  
**Persists to**: `ai_analyses` with `analysis_type: 'hypergame'`

### 4.4 `digital-twin-generator`

**Purpose**: Create HDTwin from profile data  
**Model**: `google/gemini-2.5-flash`  
**Persists to**: `digital_twins` table

### 4.5 `cascade-predictor`

**Purpose**: Predict viral spread and blast radius  
**Model**: Local GNN simulation  
**Persists to**: `network_intelligence` table

### 4.6 `cognitive-warfare-planner`

**Purpose**: Generate reflexive control payloads  
**Model**: `openai/gpt-5` (highest accuracy for sensitive operations)  
**Persists to**: `cognitive_operations` table

### 4.7 `quantum-decision-modeler`

**Purpose**: Apply Quantum Bayesian Networks to predictions  
**Model**: Local computation  
**Persists to**: `quantum_decision_states` table

### 4.8 `dark-tetrad-profiler`

**Purpose**: Score dark personality traits  
**Model**: `google/gemini-3-flash-preview` with structured output  
**Persists to**: `ai_analyses` with `analysis_type: 'dark_tetrad'`

---

## Track 5: Dashboard Page & Navigation

### 5.1 New Page: `src/pages/EnhancementSuite.tsx`

A unified dashboard page at `/enhancement-suite` that provides access to all Enhancement Suite tools.

**Layout**:
```text
+--------------------------------------------------+
|  Enhancement Suite                    [Status]   |
+--------------------------------------------------+
|  Quick Actions                                   |
|  [Cognitive Warfare] [Deception] [Digital Twin]  |
|  [Dark Psych] [Quantum] [Network] [Stylometry]   |
|  [Memory] [Hypergame] [Collective]               |
+--------------------------------------------------+
|  Tabs:                                           |
|  [Cognitive] [Deception] [Psychology] [Network]  |
|  [Game Theory] [Collective] [Digital Twins]      |
+--------------------------------------------------+
|                                                  |
|  < Active Tab Content - Renders Selected Panel > |
|                                                  |
+--------------------------------------------------+
|  Recent Analysis Results (cross-suite)           |
+--------------------------------------------------+
```

**Tab Mapping**:
| Tab | Components Rendered |
|-----|---------------------|
| Cognitive | CognitiveWarfarePanel |
| Deception | DeceptionFusionDashboard, StylemetryAnalyzer |
| Psychology | DarkPsychologyScanner, MemoryExploitationPanel |
| Network | NetworkIntelligenceGraph |
| Game Theory | QuantumDecisionPanel, HypergameVisualizer |
| Collective | CollectiveBehaviorMonitor |
| Digital Twins | DigitalTwinManager |

### 5.2 Navigation Updates

**File**: `src/lib/navigationConfig.ts`

Add new navigation item:
```typescript
{
  id: 'enhancement-suite',
  title: 'Enhancement Suite',
  url: '/enhancement-suite',
  icon: Atom, // or Sparkles
  description: 'Revolutionary 50+ AI intelligence engines',
  badge: 'new',
  category: 'intelligence',
  requiredRole: 'analyst',
  keywords: ['enhancement', 'cognitive', 'warfare', 'deception', 'quantum', 'digital twin', 'dark psych', 'network', 'hypergame'],
}
```

### 5.3 Route Registration

**File**: `src/App.tsx`

Add lazy import and route:
```typescript
const EnhancementSuite = lazyWithRetry(() => import("./pages/EnhancementSuite"));

// In Routes:
<Route path="/enhancement-suite" element={<EnhancementSuite />} />
```

---

## File Summary

### New Files to Create (25 total)

| Track | Files |
|-------|-------|
| Libraries | 7 files (`src/lib/gameTheory/*`, `src/lib/linguistics/*`, `src/lib/deception/*`) |
| Hooks | 2 files (`src/hooks/intelligence/use*.ts`) |
| Components | 4 files (`src/components/intelligence/enhancement/*`) |
| Edge Functions | 8 functions (`supabase/functions/*/index.ts`) |
| Pages | 1 file (`src/pages/EnhancementSuite.tsx`) |
| Config Updates | 3 files (navigation, app routes, enhancement index) |

### Files to Modify (3 total)

| File | Change |
|------|--------|
| `src/lib/navigationConfig.ts` | Add enhancement-suite nav item |
| `src/App.tsx` | Add lazy import + route |
| `src/components/intelligence/enhancement/index.ts` | Add 4 new component exports |
| `src/hooks/intelligence/enhancement/index.ts` | Add 2 new hook exports |
| `supabase/config.toml` | Add 8 new function configurations |

---

## Implementation Order

### Phase A: Foundation (Parallel)
1. Create `src/lib/gameTheory/` directory with all 4 files
2. Create `src/lib/linguistics/llmDetectionEngine.ts`
3. Create `src/lib/linguistics/crossLanguageDeception.ts`
4. Create `src/lib/deception/cognitiveLoadAnalyzer.ts`

### Phase B: Hooks (Depends on Phase A)
1. Create `useStylemetricAnalysis.ts`
2. Create `useHypergameTheory.ts`
3. Update `enhancement/index.ts` exports

### Phase C: Edge Functions (Parallel with Phase B)
1. Create all 8 edge functions with health checks
2. Update `supabase/config.toml`

### Phase D: UI Components (Depends on Phase B)
1. Create StylemetryAnalyzer.tsx
2. Create MemoryExploitationPanel.tsx
3. Create HypergameVisualizer.tsx
4. Create CollectiveBehaviorMonitor.tsx
5. Update component index exports

### Phase E: Integration (Depends on Phase D)
1. Create EnhancementSuite.tsx page
2. Update navigationConfig.ts
3. Update App.tsx routes

---

## Technical Specifications

### Edge Function Template

All edge functions follow this structure:
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ 
      ok: true, 
      function: 'function-name', 
      timestamp: Date.now() 
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const body = await req.json();
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Normalize parameters (snake_case and camelCase)
    const profileId = body.profileId || body.profile_id;
    const userId = body.userId || body.user_id;

    // ... implementation ...

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[function-name] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

### Hook Template

All hooks follow DDD patterns:
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useFeatureName(profileId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['feature-key', profileId],
    queryFn: async () => { /* fetch logic */ },
    enabled: !!user,
  });

  const mutation = useMutation({
    mutationFn: async (input) => {
      return supabase.functions.invoke('edge-function', { body: input });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-key'] });
    }
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    mutate: mutation.mutateAsync,
    isMutating: mutation.isPending,
  };
}
```

---

## Estimated Effort

| Track | Files | Complexity |
|-------|-------|------------|
| Libraries | 7 | Medium-High |
| Hooks | 2 | Medium |
| Edge Functions | 8 | High |
| UI Components | 4 | Medium |
| Page + Navigation | 3 | Low |

**Total**: 25 new files, 3 modified files

---

## Success Criteria

1. All 8 edge functions respond to health checks
2. All hooks successfully query/mutate data
3. All UI components render without errors
4. Enhancement Suite page accessible at `/enhancement-suite`
5. Navigation item appears in sidebar under "Intelligence" category
6. Build completes with zero TypeScript errors
