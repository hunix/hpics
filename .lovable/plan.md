

# Video/Screening Analysis: Full Audit & Gap Analysis Plan

## Part 1: Current Implementation Inventory

### What We Have

**Video Analysis Pipeline (4 analysis types):**
- `analyze-behavioral` — Personality indicators, decision-making style
- `analyze-facial` — Micro-expressions, emotional timeline, stress indicators
- `analyze-body-language` — Posture, gestures, comfort, rapport signals
- `analyze-vocal` — Speech patterns, stress points, hesitation markers

**Session orchestration** via `useAnalysisSession.tsx` — sequential job runner with pause/resume/skip/retry, cost tracking, DB persistence.

**Client-side libraries (12 analyzers):**
- `deceptionAnalyzer.ts` — Multimodal deception (facial, vocal, linguistic, behavioral)
- `multimodalFusionEngine.ts` — Late-fusion architecture across 4 modalities
- `cognitiveLoadAnalyzer.ts` — Response latency, linguistic complexity, error patterns
- `microExpressionAnalyzer.ts` — FACS-based AU detection, Duchenne markers, asymmetry
- `pupillometryAnalyzer.ts` — Pupil dilation for cognitive load/deception
- `voiceStressAnalyzer.ts` — F0, jitter, shimmer, HNR, micro-tremor, formant shifts
- `hrvInference.ts` — Non-contact rPPG heart rate variability
- `gaitAnalyzer.ts` — Accelerometer-based walking pattern identification
- `audioBurstAnalyzer.ts` — Hilbert transform mental state prediction
- `interviewerBiasDetector.ts` — Leading questions, coercion patterns
- `keystrokeDynamics.ts` — Typing pattern biometrics
- `signatureAnalyzer.ts` — Handwriting analysis

**Edge functions (biometric-router, 30 routes):**
- Face extraction, multi-view, gaze, pupillometry, microexpression, deepfake detection, subvocalization, etc.

**Edge functions (analysis-router, 50+ routes):**
- Forensic statement analysis (SCAN/CBCA/reality monitoring), behavioral DNA, deception detection, dark tetrad, etc.

---

## Part 2: Bugs & Flaws Found

### Bug 1: `useAnalysisSession.start()` Stale Session Reference (Critical)

**File:** `src/hooks/useAnalysisSession.tsx` (lines 300-307)

```typescript
const start = useCallback(async () => {
  let currentSession = session;  // Captured from closure
  if (!currentSession) {
    const sessionId = await createSession();
    if (!sessionId) return;
    currentSession = session; // BUG: still reads stale closure value
  }
  if (!currentSession) return; // Always exits here for new sessions
```

After `createSession()` calls `setSession(newSession)`, `session` in the closure is still `null`. The `start` function exits immediately for every new session. The user must click "Start" twice.

**Fix:** `createSession` should return the session object, or use a ref.

### Bug 2: Model Key Not Passed to Edge Functions

**File:** `src/hooks/useAnalysisSession.tsx` (line 211-218)

The `runJob` function invokes edge functions but never sends `job.modelKey` in the body. The biometric-router defaults to `gemini-2.5-flash` regardless of user selection.

**Fix:** Add `model: job.modelKey` to the request body.

### Bug 3: Completion Status Uses Stale State

**File:** `src/hooks/useAnalysisSession.tsx` (lines 347-358)

After the loop, `const updatedSession = session` again captures the stale closure. The final DB update writes incorrect status/duration/cost.

**Fix:** Use a ref or compute final state from the `setSession` updater.

### Bug 4: Physiological Functions Return Hardcoded Values

**File:** `src/lib/deception/multimodalFusionEngine.ts` (lines 1091-1116)

`calculateGSRMetrics`, `calculateRespirationMetrics`, and `analyzeThermal` return hardcoded placeholder values (e.g., `breathingRate: 12`, `nasalTemperature: 33`). Any analysis using physiological modality produces meaningless results.

**Fix:** Either implement actual computation from the input arrays, or mark the physiological modality as "unavailable" and exclude it from fusion weights.

### Bug 5: `generateDeceptionTimeline` Returns Single Placeholder Entry

**File:** `src/lib/deception/multimodalFusionEngine.ts` (line 1143-1151)

Returns a single `[{timestamp:0, content:'Analysis start'}]` entry regardless of input. The timeline visualization is always empty.

### Bug 6: Edge Function Prompts Are Generic

**File:** `supabase/functions/biometric-router/index.ts` (lines 65-67)

The prompts for `analyze-facial`, `analyze-vocal`, and `body-language` are single sentences like "Comprehensive facial analysis." They lack structured output schemas, scientific frameworks, or scoring rubrics. The AI produces inconsistent JSON shapes across invocations.

---

## Part 3: Gap Analysis vs. State of the Art

### Research Findings (2025-2026)

| Technique | Source | Status in HPICS |
|-----------|--------|-----------------|
| **CBCA (Criteria-Based Content Analysis)** — 19 criteria scoring | SVA forensic standard (Steller & Köhnken 1989), meta-analysis 2024 | Route exists (`/forensic-statement`) but uses generic AI prompt, no structured 19-criteria scoring |
| **SUE (Strategic Use of Evidence)** — Evidence disclosure timing analysis | Granhag & Hartwig 2015; Jang et al. 2025 | **Missing entirely** |
| **Reality Monitoring (RM)** — Perceptual vs cognitive detail ratio | Johnson & Raye 1981; field validation 2024 | Referenced in forensic-statement prompt text but not scored separately |
| **PEACE Model Compliance Scoring** — Planning, Engage, Account, Closure, Evaluate | UK College of Policing standard | **Missing entirely** |
| **Multimodal MLLM Deception Benchmark** | arXiv:2511.16221 (Nov 2025) — Multi-party interaction analysis | **Missing** — our system only analyzes 1-on-1 |
| **INTU-AI Digitalization** | MDPI Applied Sciences (2025) — structured interrogation digitization | Partially covered by session system |
| **PolygrAI Features** | Commercial competitor (2025-2026) | We lack: Interview Generator, Recurring Interviews, Campaign bulk-send |
| **Deceptio.ai** | Commercial competitor (2025) | We lack: real-time audio stream deception scoring |
| **Temporal Congruence Analysis** | Cross-checking statement timelines against known events | **Missing** |
| **Cognitive Interview (CI)** — Fisher & Geiselman enhanced protocol | KUBARK + declassified DoD "Educing Information" (ISB Phase 1) | **Missing as structured protocol** |
| **KUBARK Personality Classification** | Declassified CIA 1963 — 9 interrogatee personality types | **Missing** — could map to our psychological profiling |
| **Autonomic Nervous System Multi-channel Fusion** | Patent US20240071412A1 + LegalEye 2025 | Interfaces exist but functions return hardcoded values |
| **Deepfake-Aware Authentication** | PolygrAI TrueLens (2026) | Route exists but uses generic prompt |
| **Multi-party Deception Detection** | Already have `multi-party-deception-detector` edge function | Exists but not wired into Video Analysis page |

---

## Part 4: Implementation Plan

### Batch 1: Fix Critical Bugs in Analysis Session (1 file)

**File:** `src/hooks/useAnalysisSession.tsx`

1. Fix stale closure in `start()` — have `createSession` return the session object and use it directly
2. Pass `model: job.modelKey` in edge function invocation body
3. Fix stale state in completion status update — use `sessionRef` pattern
4. These 3 bugs mean the entire Video Analysis page is effectively broken for first-time session starts

### Batch 2: Fix Placeholder Physiological Functions (1 file)

**File:** `src/lib/deception/multimodalFusionEngine.ts`

1. Implement actual GSR metrics from input array (mean, peak detection, tonic/phasic decomposition)
2. Implement respiration rate from input array (zero-crossing detection)
3. Implement thermal analysis from 2D array (region averaging, event detection)
4. Build real `generateDeceptionTimeline` from modality results — sample at configurable intervals, aggregate per-modality scores at each point
5. If input arrays are empty, set modality confidence to 0 and exclude from fusion

### Batch 3: Enrich Edge Function Prompts with Scientific Frameworks (2 files)

**Files:** `supabase/functions/biometric-router/index.ts`, `supabase/functions/analysis-router/index.ts`

1. Replace generic facial analysis prompt with structured schema: FACS AU codes, 7 basic + 15 compound emotions, Duchenne marker, asymmetry score, temporal micro-expression timeline
2. Replace generic vocal analysis prompt with schema: F0 baseline/deviation, jitter/shimmer, speech rate timeline, pause analysis, filler density, formant stress indicators
3. Replace generic body language prompt with schema: posture openness score, gesture frequency, self-adaptors, illustrators, regulators, proxemic shifts, gaze aversion events
4. Enrich forensic-statement prompt with explicit CBCA 19-criteria scoring rubric and Reality Monitoring 8-criteria scoring

### Batch 4: Add Missing Scientific Protocols (3 new files + 2 edge routes)

1. **New library:** `src/lib/deception/sueAnalyzer.ts` — Strategic Use of Evidence analyzer
   - Evidence disclosure timing optimization
   - Statement-evidence consistency scoring
   - Counter-interrogation strategy detection

2. **New library:** `src/lib/deception/cbcaScorer.ts` — Structured CBCA/RM/SVA scorer
   - 19 CBCA criteria with individual scores (0-2 scale per Steller & Köhnken)
   - 8 Reality Monitoring criteria
   - Validity Checklist (11 items)
   - Composite credibility score with confidence interval

3. **New library:** `src/lib/interview/peaceModelScorer.ts` — PEACE model compliance scorer
   - 5-phase scoring (Planning, Engage & Explain, Account, Closure, Evaluate)
   - Cognitive Interview technique detection (context reinstatement, report everything, reverse order, change perspective)
   - Coercion vs. rapport ratio

4. **New edge routes** in analysis-router:
   - `/sue-analysis` — SUE technique analysis and evidence timing
   - `/peace-scoring` — PEACE model compliance assessment

### Batch 5: Wire Multi-party Detection & Add Interview Generator (2 files)

1. Add `multi_party` as a 5th AnalysisType in `useAnalysisSession.tsx` and wire it to the existing `multi-party-deception-detector` edge function
2. Add interview question generator to Video Analysis page — using profile psychological data to generate targeted questions (similar to PolygrAI's Interview Generator feature)

### Batch 6: Add Temporal Congruence & KUBARK Classification (2 new files)

1. **New library:** `src/lib/deception/temporalCongruenceAnalyzer.ts`
   - Cross-reference statement timestamps against known event data
   - Flag temporal impossibilities and inconsistencies
   - Generate timeline visualization data

2. **New library:** `src/lib/interview/kubarkClassifier.ts`
   - Classify subject into KUBARK personality types (orderly-obstinate, optimistic, greedy-demanding, anxious-self-centered, etc.)
   - Map to recommended approach strategies from declassified manual
   - Output approach recommendations per classification

---

**Total: ~12 files changed/created, 6 batches. Priority order: Batch 1 (session bugs) is critical — nothing works correctly without it.**

