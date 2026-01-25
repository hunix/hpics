
# Comprehensive Data Fusion & Intelligence Gap Resolution Plan

## Executive Summary

This plan addresses **6 critical intelligence gaps** identified in the platform where collected data is either siloed or underutilized. Implementation will create 4 new fusion engines, enhance 3 existing engines, and add 2 new dossier sections.

---

## Gap Analysis Summary

| Gap | Data Source | Current State | Impact |
|-----|-------------|---------------|--------|
| 1. Biometric-Behavioral Fusion | `interaction_biometrics` (HRV, stress) | Stored but not correlated with deception analysis | Missing triple-point verification |
| 2. Geospatial-Communication Correlation | `movement_routes`, `location_history` | Exists in isolation from comms timestamps | No spatial-temporal intelligence |
| 3. Financial Document Integration | `document_insights.amounts_found` | OCR extracts data but `financial-intelligence-scan` ignores it | Incomplete wealth assessment |
| 4. Calendar Pattern Analysis | `synced_calendar_events` | Used in UI widgets only | Not feeding Pattern-of-Life or Vulnerability Windows |
| 5. Handwriting/Gait Synthesis | `gait_profiles`, `handwriting_samples` | Standalone enrollments | No behavioral correlation |
| 6. Cross-Modal Deception Enhancement | Voice + Facial + Behavioral | Partial integration | Missing physiological stress correlation |

---

## Implementation Architecture

```text
┌─────────────────────────────────────────────────────────────────────┐
│                    NEW FUSION ENGINES (4)                           │
├─────────────────────────────────────────────────────────────────────┤
│  1. biometric-behavioral-fusion     │  HRV + Voice + Facial        │
│  2. geospatial-communication-fusion │  Routes + Comms timestamps   │
│  3. financial-document-synthesis    │  OCR amounts → wealth tier   │
│  4. calendar-pattern-analyzer       │  Events → PoL + Vuln Windows │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                 ENHANCED EXISTING ENGINES (3)                       │
├─────────────────────────────────────────────────────────────────────┤
│  • behavioral-dna-sequencer     → Add biometric signals            │
│  • financial-intelligence-scan  → Ingest document_insights         │
│  • vulnerability-window-detector → Add calendar event awareness    │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    DOSSIER INTEGRATION (2)                          │
├─────────────────────────────────────────────────────────────────────┤
│  • useDossierData.ts         → Fetch new fusion results            │
│  • Section Renderers         → 2 new PDF sections                  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: New Edge Functions (4 Functions)

### 1.1 `biometric-behavioral-fusion` Edge Function

**Purpose:** Correlate wearable HRV/stress data with voice stress and facial micro-expressions for triple-point deception verification.

**Data Sources:**
- `interaction_biometrics` (HRV, stress_level, heart_rate)
- `ai_analyses` where `analysis_type = 'vocal'`
- `ai_analyses` where `analysis_type = 'facial'`
- `behavioral_analyses`

**Output Schema:**
```json
{
  "triplePointVerification": {
    "physiologicalStress": 0.0-1.0,
    "vocalStress": 0.0-1.0,
    "facialStress": 0.0-1.0,
    "combinedDeceptionScore": 0.0-1.0,
    "convergenceLevel": "aligned|partial|contradictory"
  },
  "stressCorrelationTimeline": [],
  "deceptionAlerts": []
}
```

**Storage:** `ai_analyses` with `analysis_type = 'biometric_behavioral_fusion'`

---

### 1.2 `geospatial-communication-fusion` Edge Function

**Purpose:** Correlate target locations with communication timestamps to identify where they communicate from and detect location-based anomalies.

**Data Sources:**
- `movement_routes` (routes with timestamps)
- `location_history` (raw GPS)
- `communications` (message timestamps)
- `messages` via `conversations`

**Output Schema:**
```json
{
  "communicationHotspots": [
    {
      "location": {"lat": 0, "lng": 0, "name": ""},
      "communicationFrequency": 0,
      "typicalMessageTypes": [],
      "anomaliesDetected": []
    }
  ],
  "spatialCommunicationPatterns": [],
  "locationBasedVulnerabilities": []
}
```

**Storage:** `ai_analyses` with `analysis_type = 'geospatial_communication_fusion'`

---

### 1.3 `financial-document-synthesis` Edge Function

**Purpose:** Aggregate OCR-extracted financial data from documents into the wealth assessment pipeline.

**Data Sources:**
- `document_insights` (amounts_found, financial_data)
- `extracted_documents` (currency_amounts)
- `financial_intelligence` (existing wealth tier)

**Output Schema:**
```json
{
  "documentBasedEvidence": {
    "totalAmountsExtracted": [],
    "incomeIndicators": [],
    "expensePatterns": [],
    "assetMentions": []
  },
  "wealthTierAdjustment": {
    "currentTier": 0,
    "suggestedTier": 0,
    "confidence": 0.0-1.0,
    "evidenceBasis": []
  }
}
```

**Storage:** Updates `financial_intelligence` table + `ai_analyses` with `analysis_type = 'financial_document_synthesis'`

---

### 1.4 `calendar-pattern-analyzer` Edge Function

**Purpose:** Derive power dynamics, availability patterns, and vulnerability indicators from calendar event analysis.

**Data Sources:**
- `synced_calendar_events` (meetings, attendees)
- `contact_life_milestones` (anniversaries, holidays)
- `contact_interaction_notes` (interaction timestamps)

**Output Schema:**
```json
{
  "meetingPatterns": {
    "averageMeetingsPerWeek": 0,
    "peakMeetingDays": [],
    "peakMeetingHours": [],
    "meetingLoadIndicator": "light|moderate|heavy"
  },
  "powerDynamicsIndicators": [],
  "availabilityWindows": [],
  "upcomingVulnerabilityTriggers": []
}
```

**Storage:** `ai_analyses` with `analysis_type = 'calendar_pattern_analysis'`

---

## Phase 2: Enhance Existing Engines (3 Functions)

### 2.1 Enhance `behavioral-dna-sequencer`

**Changes:**
- Add query for `interaction_biometrics` (last 90 days)
- Include HRV patterns, stress trends in context data
- Add new section in prompt: "BIOMETRIC BEHAVIORAL SIGNALS"

**Files Modified:**
- `supabase/functions/behavioral-dna-sequencer/index.ts`

---

### 2.2 Enhance `financial-intelligence-scan`

**Changes:**
- Add query for `document_insights` where `profile_id` matches
- Extract `amounts_found` and `financial_data` fields
- Include in AI prompt context: "DOCUMENT-BASED FINANCIAL EVIDENCE"

**Files Modified:**
- `supabase/functions/financial-intelligence-scan/index.ts`

---

### 2.3 Enhance `vulnerability-window-detector`

**Changes:**
- Add query for `synced_calendar_events` (upcoming 30 days)
- Identify high-stress periods (many meetings) and low-activity periods
- Add "CALENDAR-BASED VULNERABILITY INDICATORS" to prompt

**Files Modified:**
- `supabase/functions/vulnerability-window-detector/index.ts`

---

## Phase 3: Dossier Integration

### 3.1 Update `useDossierData.ts`

**Add New Data Fetches (Batch 10):**
```typescript
// Batch 10: New Fusion Engine Results
const [
  biometricBehavioralFusion,
  geospatialCommunicationFusion,
  financialDocumentSynthesis,
  calendarPatternAnalysis,
] = await Promise.all([
  supabase.from('ai_analyses').select('*').eq('profile_id', profileId)
    .eq('analysis_type', 'biometric_behavioral_fusion').limit(1),
  supabase.from('ai_analyses').select('*').eq('profile_id', profileId)
    .eq('analysis_type', 'geospatial_communication_fusion').limit(1),
  supabase.from('ai_analyses').select('*').eq('profile_id', profileId)
    .eq('analysis_type', 'financial_document_synthesis').limit(1),
  supabase.from('ai_analyses').select('*').eq('profile_id', profileId)
    .eq('analysis_type', 'calendar_pattern_analysis').limit(1),
]);
```

**Files Modified:**
- `src/components/reports/hooks/useDossierData.ts`

---

### 3.2 Add New Section Renderers

**New Sections:**
1. `renderBiometricFusion` - Triple-point verification visualization
2. `renderCalendarIntelligence` - Meeting patterns and availability

**Files Modified:**
- `src/components/reports/sections/renderers/FusionSectionRenderers.ts`
- `src/components/reports/sections/renderers/index.ts`
- `src/components/reports/sections/sectionDefinitions.ts`

---

## Phase 4: Update FUSION_ANALYSIS_TYPES Registry

**File:** `src/domains/fusion/repositories/IFusionRepository.ts`

**Add Mappings:**
```typescript
export const FUSION_ANALYSIS_TYPES: Record<FusionEngineType, string> = {
  // ... existing
  'biometric-behavioral': 'biometric_behavioral_fusion',
  'geospatial-communication': 'geospatial_communication_fusion',
  'financial-document': 'financial_document_synthesis',
  'calendar-pattern': 'calendar_pattern_analysis',
};
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/biometric-behavioral-fusion/index.ts` | New engine |
| `supabase/functions/geospatial-communication-fusion/index.ts` | New engine |
| `supabase/functions/financial-document-synthesis/index.ts` | New engine |
| `supabase/functions/calendar-pattern-analyzer/index.ts` | New engine |

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/behavioral-dna-sequencer/index.ts` | Add biometrics query |
| `supabase/functions/financial-intelligence-scan/index.ts` | Add document_insights query |
| `supabase/functions/vulnerability-window-detector/index.ts` | Add calendar events query |
| `src/components/reports/hooks/useDossierData.ts` | Add Batch 10 queries |
| `src/components/reports/sections/renderers/FusionSectionRenderers.ts` | Add 2 renderers |
| `src/components/reports/sections/renderers/index.ts` | Export new renderers |
| `src/components/reports/sections/sectionDefinitions.ts` | Add 2 new sections |
| `src/domains/fusion/repositories/IFusionRepository.ts` | Add type mappings |
| `src/domains/fusion/entities/FusionResult.ts` | Add new engine types |

---

## Expected Outcomes

After implementation:

1. **Triple-Point Deception Verification** - Wearable stress + voice + facial convergence scoring
2. **Spatial-Temporal Intelligence** - Know WHERE targets communicate, not just when
3. **Enhanced Wealth Assessment** - OCR-extracted amounts automatically update wealth tier
4. **Calendar-Aware Vulnerability Windows** - Meeting load and event-triggered susceptibility
5. **74 → 76 Dossier Sections** - Two new intelligence sections in PDF exports
6. **10 → 14 Intelligence Completeness Sources** - Higher completeness scores when data is present

---

## Implementation Order

1. Create 4 new edge functions (parallel)
2. Update FUSION_ANALYSIS_TYPES registry
3. Enhance 3 existing engines (parallel)
4. Update useDossierData.ts
5. Add section renderers
6. Deploy and test health checks
