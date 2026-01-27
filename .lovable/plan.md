

# Comprehensive Codebase Audit Report
## Issues, Race Conditions, Memory Leaks, DB Mismatches & Edge Function Errors

---

## Executive Summary

After a thorough audit, I identified **18 actionable issues** across 5 categories:

| Category | Critical | High | Medium | Total |
|----------|----------|------|--------|-------|
| Database Column Mismatches (`media` table) | 2 | 0 | 0 | 2 |
| Database Column Mismatches (`communications` table) | 5 | 0 | 0 | 5 |
| Race Conditions / Memory Leaks | 0 | 5 | 0 | 5 |
| Missing Cleanup on Unmount | 0 | 1 | 0 | 1 |
| Security Linter Warnings | 0 | 0 | 2 | 2 |
| **TOTAL** | **7** | **6** | **2** | **18** |

---

## Category 1: Database Column Mismatches - `media` Table (CRITICAL)

### Issue 1.1: `execute-face-scan-job` uses non-existent `media_type` column
**File**: `supabase/functions/execute-face-scan-job/index.ts:100`
**Problem**: `.in("media_type", ["image", "photo"])` - column doesn't exist
**Fix**: Change to `.ilike('mime_type', 'image/%')`

### Issue 1.2: `gopro-intelligence` inserts into 3 non-existent columns
**File**: `supabase/functions/gopro-intelligence/index.ts:245-250`
**Problems**: 
- `media_type` → doesn't exist (remove or skip)
- `thumbnail_path` → should be `thumbnail_url`
- `metadata` → doesn't exist on `media` table

**Fix**: Update insert to use correct columns only

---

## Category 2: Database Column Mismatches - `communications` Table (CRITICAL)

### Issue 2.1: `communication_date` vs `occurred_at` (5 locations)
The `communications` table uses `occurred_at`, NOT `communication_date`.

| File | Line | Fix |
|------|------|-----|
| `src/components/reports/hooks/useDossierData.ts` | 198 | `communication_date` → `occurred_at` |
| `supabase/functions/relationship-half-life-calculator/index.ts` | 132 | `communication_date` → `occurred_at` |
| `supabase/functions/automated-red-team-engine/index.ts` | 102 | `communication_date` → `occurred_at` |
| `supabase/functions/multi-party-deception-detector/index.ts` | 99 | `communication_date` → `occurred_at` |
| `supabase/functions/hypergame-theory-engine/index.ts` | 155 | `communication_date` → `occurred_at` |

---

## Category 3: Race Conditions / Memory Leaks (HIGH)

### Issue 3.1: `BehavioralEconomicsPanel` lacks mount check
**File**: `src/components/intelligence/BehavioralEconomicsPanel.tsx:31-35`
**Problem**: `loadProfile(profileId).then(setProfile)` without mount guard
**Fix**: Add `isMountedRef` and check before `setProfile`

### Issue 3.2: `AttachmentVulnerabilityPanel` lacks mount check
**File**: `src/components/intelligence/AttachmentVulnerabilityPanel.tsx:68-72`
**Problem**: `.then(setVulnerabilityStatus)` without mount guard
**Fix**: Add `isMountedRef` pattern

### Issue 3.3: `useAutoAggregateOnCompletion` missing mount check in async callback
**File**: `src/hooks/useAutoAggregateOnCompletion.ts:37-108`
**Problem**: `aggregateIntelligence` executes after 2-second timeout without verifying component is still mounted. Can trigger toast and state updates post-unmount.
**Fix**: Add `isMountedRef` and check before all state updates and toasts

### Issue 3.4: `GaitCapturePanel` missing cleanup on unmount
**File**: `src/components/biometrics/GaitCapturePanel.tsx`
**Problem**: If component unmounts while `isCapturing=true`, the `devicemotion` listener and `intervalRef` are not cleaned up.
**Fix**: Add cleanup `useEffect` that calls `stopCapture` on unmount

### Issue 3.5: `Install.tsx` setTimeout cleanup race
**File**: `src/pages/Install.tsx:62`
**Problem**: `setTimeout(() => clearInterval(checkInterval), 5000)` - timeout ref not cleared on unmount
**Fix**: Store timeout in ref and clear in cleanup function

---

## Category 4: Security Linter Warnings (MEDIUM)

### Issue 4.1: Function Search Path Mutable
Some database functions don't set `search_path`, potentially allowing schema injection attacks.

### Issue 4.2: Permissive RLS Policies  
Some tables use `USING (true)` for UPDATE/DELETE/INSERT operations.

---

## Verified as Already Fixed (No Action Needed)

| Component | Status |
|-----------|--------|
| `autonomous-intelligence-orchestrator` | ✅ Uses `mime_type` |
| `deep-psychological-analysis` | ✅ Uses `mime_type` |
| `mosaic-intelligence-fuser` | ✅ Uses `mime_type` |
| `bayesian-intention-predictor` | ✅ Uses `channel` |
| `predict-behavioral-scenarios` | ✅ Uses `channel` |
| `hyperpersonalization-engine` | ✅ Uses `channel` |
| `sentient-intent-analyzer` | ✅ Uses `channel` |
| `rag-query` | ✅ Uses `direction` |
| `calculate-relationship-scores` | ✅ Uses `direction` |
| `generate-meeting-prep` | ✅ Uses `direction` |
| `useDataCollectionStatus` | ✅ Uses `channel`, `mime_type` |
| `useIntelligenceSession` | ✅ Has `isMountedRef` |
| `usePersistentBulkSession` | ✅ Has mounted flag |
| `CounterIntelligenceDashboard` | ✅ Has `isMountedRef` |
| `FortuneTrajectoryPanel` | ✅ Has `isMountedRef` |
| `ShadowNetworkGraph` | ✅ Has `isMountedRef` |
| `ManipulationVulnerabilityPanel` | ✅ Has `isMountedRef` |
| `useSignedUrl` | ✅ Has mounted flag |
| `useProactiveInsights` | ✅ Has `isMountedRef` |
| `useMLModels` | ✅ Has `isMountedRef` |

---

## Files to Modify

| File | Change | Priority |
|------|--------|----------|
| `supabase/functions/execute-face-scan-job/index.ts` | `media_type` → `mime_type` filter | CRITICAL |
| `supabase/functions/gopro-intelligence/index.ts` | Fix 3 column names in insert | CRITICAL |
| `src/components/reports/hooks/useDossierData.ts` | `communication_date` → `occurred_at` | CRITICAL |
| `supabase/functions/relationship-half-life-calculator/index.ts` | `communication_date` → `occurred_at` | CRITICAL |
| `supabase/functions/automated-red-team-engine/index.ts` | `communication_date` → `occurred_at` | CRITICAL |
| `supabase/functions/multi-party-deception-detector/index.ts` | `communication_date` → `occurred_at` | CRITICAL |
| `supabase/functions/hypergame-theory-engine/index.ts` | `communication_date` → `occurred_at` | CRITICAL |
| `src/components/intelligence/BehavioralEconomicsPanel.tsx` | Add `isMountedRef` | HIGH |
| `src/components/intelligence/AttachmentVulnerabilityPanel.tsx` | Add `isMountedRef` | HIGH |
| `src/hooks/useAutoAggregateOnCompletion.ts` | Add `isMountedRef` | HIGH |
| `src/components/biometrics/GaitCapturePanel.tsx` | Add unmount cleanup | HIGH |
| `src/pages/Install.tsx` | Store timeout in ref | HIGH |

---

## Implementation Phases

**Phase 1 (CRITICAL)**: Fix 7 database column mismatches
- 2 in `media` table queries/inserts
- 5 in `communications` table ordering

**Phase 2 (HIGH)**: Fix 5 race condition / memory leak issues
- Add `isMountedRef` to 3 components/hooks
- Add cleanup effects to 2 components

**Phase 3 (MEDIUM)**: Security review for RLS policies

---

## Technical Reference

**`media` table columns**: `id, user_id, profile_id, file_url, thumbnail_url, caption, file_size, mime_type, created_at, storage_path, ai_metadata, ai_metadata_generated_at, ai_model_used, ai_generation_status, ai_generation_error, completed_analysis_modes, last_analysis_at, detected_language`

**`communications` table columns**: `id, user_id, profile_id, channel, direction, subject, content, duration_minutes, sentiment_score, occurred_at, created_at`

