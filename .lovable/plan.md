

# Comprehensive Codebase Audit Report
## Issues, Race Conditions, Memory Leaks, DB Mismatches & Edge Function Errors

---

## Executive Summary

After a thorough line-by-line audit of the entire codebase, I identified **19 actionable issues** across 5 categories:

| Category | Critical | High | Medium | Total |
|----------|----------|------|--------|-------|
| Database Column Mismatches | 9 | 0 | 0 | 9 |
| Schema Direction Mismatches | 4 | 0 | 0 | 4 |
| Race Conditions (State Updates) | 0 | 4 | 0 | 4 |
| Security Linter Warnings | 0 | 0 | 2 | 2 |
| **TOTAL** | **13** | **4** | **2** | **19** |

---

## Category 1: Database Column Mismatches - `media_type` vs `mime_type` (CRITICAL)

**Root Cause**: The `media` table has a `mime_type` column (e.g., `video/mp4`, `image/jpeg`) but **no `media_type` column**. Multiple edge functions and hooks query or insert using the non-existent `media_type` field.

### Issue 1.1: `autonomous-intelligence-orchestrator` queries non-existent column
**File**: `supabase/functions/autonomous-intelligence-orchestrator/index.ts:84`
**Problem**: `.select('id, profile_id, media_type, ...')` - `media_type` doesn't exist
**Fix**: Change to `.select('id, profile_id, mime_type, ...')`

### Issue 1.2: `deep-psychological-analysis` queries non-existent column
**File**: `supabase/functions/deep-psychological-analysis/index.ts:111`
**Problem**: `.select('id, media_type, caption, ai_metadata, created_at')` - `media_type` doesn't exist
**Fix**: Change to `.select('id, mime_type, caption, ai_metadata, created_at')`

### Issue 1.3: `mosaic-intelligence-fuser` queries non-existent column
**File**: `supabase/functions/mosaic-intelligence-fuser/index.ts:109`
**Problem**: `.select('id, media_type, ai_metadata, created_at')` - `media_type` doesn't exist
**Fix**: Change to `.select('id, mime_type, ai_metadata, created_at')`

### Issue 1.4: `process-bulk-upload` inserts into non-existent column
**File**: `supabase/functions/process-bulk-upload/index.ts:180`
**Problem**: `media_type: item.file_type` - column doesn't exist, insert will fail
**Fix**: Remove `media_type` line since table doesn't have this column

### Issue 1.5: `uploadQueue.ts` inserts into non-existent column
**File**: `src/lib/bulkUpload/uploadQueue.ts:458`
**Problem**: `media_type: mediaType || 'image'` - column doesn't exist
**Fix**: Remove `media_type` line since table doesn't have this column

### Issue 1.6: `useDataCollectionStatus` queries non-existent columns
**File**: `src/hooks/useDataCollectionStatus.ts:86-87`
**Problem**: 
- Line 86: `.select('id, communication_type')` - `communication_type` doesn't exist on `communications`, should be `channel`
- Line 87: `.select('id, media_type')` - `media_type` doesn't exist on `media`, should be `mime_type`

**Fix**: Change to:
```typescript
supabase.from('communications').select('id, channel').eq('profile_id', profileId),
supabase.from('media').select('id, mime_type').eq('profile_id', profileId),
```

---

## Category 2: Schema Direction Mismatches - `communication_type` vs `channel` (CRITICAL)

**Root Cause**: The `communications` table uses `channel` for the communication method and `direction` for flow. Several edge functions incorrectly access `communication_type` or `is_from_contact` (which doesn't exist on `communications`).

### Issue 2.1: `bayesian-intention-predictor` accesses wrong property
**File**: `supabase/functions/bayesian-intention-predictor/index.ts:349`
**Problem**: `comm.communication_type || 'general'` - property doesn't exist, always returns `'general'`
**Fix**: Change to `comm.channel || 'general'`

### Issue 2.2: `predict-behavioral-scenarios` accesses wrong property
**File**: `supabase/functions/predict-behavioral-scenarios/index.ts:373`
**Problem**: `comm.communication_type || 'unknown'` - property doesn't exist
**Fix**: Change to `comm.channel || 'unknown'`

### Issue 2.3: `hyperpersonalization-engine` accesses wrong property
**File**: `supabase/functions/hyperpersonalization-engine/index.ts:395`
**Problem**: `c.communication_type || 'unknown'` in `analyzeChannelPreferences`
**Fix**: Change to `c.channel || 'unknown'`

### Issue 2.4: `sentient-intent-analyzer` accesses wrong property
**File**: `supabase/functions/sentient-intent-analyzer/index.ts:236`
**Problem**: `comm.communication_type || 'message'` in label generation
**Fix**: Change to `comm.channel || 'message'`

---

## Category 3: Schema Direction Mismatches - `direction` vs `is_from_contact` (CRITICAL)

**Root Cause**: The `communications` table uses `direction` (enum: `'inbound'` | `'outbound'`), NOT `is_from_contact` (which is only on the `messages` table).

### Issue 3.1: `rag-query` uses wrong column for direction
**File**: `supabase/functions/rag-query/index.ts:276`
**Problem**: `direction: comm.is_from_contact ? 'inbound' : 'outbound'`
**Fix**: Change to `direction: comm.direction` (already a string)

### Issue 3.2: `calculate-relationship-scores` queries wrong column
**File**: `supabase/functions/calculate-relationship-scores/index.ts:84`
**Problem**: `.select('channel, occurred_at, sentiment_score, is_from_contact')` - `is_from_contact` doesn't exist
**Fix**: Change to `.select('channel, occurred_at, sentiment_score, direction')`

### Issue 3.3: `generate-meeting-prep` uses wrong column
**File**: `supabase/functions/generate-meeting-prep/index.ts:98`
**Problem**: `direction: c.is_from_contact ? 'inbound' : 'outbound'`
**Fix**: Change to `direction: c.direction`

---

## Category 4: Race Conditions - Missing Mount Checks (HIGH)

These components update React state after async operations without verifying the component is still mounted.

### Issue 4.1: Intelligence Dashboard Panels
**Files**: Multiple intelligence panels lack mount guards
- `src/components/intelligence/CounterIntelligenceDashboard.tsx:56-72`
- `src/components/intelligence/FortuneTrajectoryPanel.tsx:66-84`
- `src/components/intelligence/ShadowNetworkGraph.tsx:52-67`
- `src/components/intelligence/ManipulationVulnerabilityPanel.tsx:64-82`

**Problem**: All call `setLoading(false)` and `setData(...)` in `finally` blocks without mount checks.
**Fix**: Add `isMountedRef` pattern to each component.

### Issue 4.2: `useSignedUrl` lacks mount check
**File**: `src/hooks/useSignedUrl.ts:21-41`
**Problem**: `fetchSignedUrl` calls `setSignedUrl` and `setIsLoading` without checking if component is mounted
**Fix**: Add `mounted` flag to the useEffect

### Issue 4.3: `useProactiveInsights` lacks mount check
**File**: `src/hooks/useProactiveInsights.ts:40-77`
**Problem**: `fetchInsights` updates state without mount guard
**Fix**: Add `isMountedRef` pattern

### Issue 4.4: `useMLModels` lacks mount check
**File**: `src/hooks/useMLModels.ts:74-100`
**Problem**: `loadModels` updates multiple states without mount guard
**Fix**: Add `isMountedRef` pattern

---

## Category 5: Security Linter Warnings (MEDIUM)

### Issue 5.1: Function Search Path Mutable
**Level**: WARN
**Description**: Some database functions don't set `search_path`, potentially allowing schema injection attacks.

### Issue 5.2: Permissive RLS Policies
**Level**: WARN
**Description**: Some tables have overly permissive policies using `USING (true)` for UPDATE/DELETE/INSERT operations.

---

## Verified as Already Fixed (No Action Needed)

| Component | Status | Notes |
|-----------|--------|-------|
| `sync-google-calendar` | ✅ Fixed | Uses `contact_type` and proper join |
| `sync-outlook-calendar` | ✅ Fixed | Uses `contact_type` and proper join |
| `import-mbox-emails` | ✅ Fixed | Uses `contact_type` and proper join |
| `cross-reference-analysis` | ✅ Fixed | Uses `method.contact_type` |
| `subvocalization-detector` | ✅ Fixed | Uses `.ilike('mime_type', 'video/%')` |
| `useIntelligenceSession` | ✅ Fixed | Has `isMountedRef` pattern |
| `usePersistentBulkSession` | ✅ Fixed | Has mounted flag check |
| `useVersionCheck` | ✅ Fixed | Proper SW listener cleanup |

---

## Files to Modify

| File | Change | Priority |
|------|--------|----------|
| `supabase/functions/autonomous-intelligence-orchestrator/index.ts` | `media_type` → `mime_type` in select | CRITICAL |
| `supabase/functions/deep-psychological-analysis/index.ts` | `media_type` → `mime_type` in select | CRITICAL |
| `supabase/functions/mosaic-intelligence-fuser/index.ts` | `media_type` → `mime_type` in select | CRITICAL |
| `supabase/functions/process-bulk-upload/index.ts` | Remove `media_type` from insert | CRITICAL |
| `src/lib/bulkUpload/uploadQueue.ts` | Remove `media_type` from insert | CRITICAL |
| `src/hooks/useDataCollectionStatus.ts` | Fix both `communication_type` and `media_type` | CRITICAL |
| `supabase/functions/bayesian-intention-predictor/index.ts` | `communication_type` → `channel` | CRITICAL |
| `supabase/functions/predict-behavioral-scenarios/index.ts` | `communication_type` → `channel` | CRITICAL |
| `supabase/functions/hyperpersonalization-engine/index.ts` | `communication_type` → `channel` | CRITICAL |
| `supabase/functions/sentient-intent-analyzer/index.ts` | `communication_type` → `channel` | CRITICAL |
| `supabase/functions/rag-query/index.ts` | `is_from_contact` → `direction` | CRITICAL |
| `supabase/functions/calculate-relationship-scores/index.ts` | `is_from_contact` → `direction` | CRITICAL |
| `supabase/functions/generate-meeting-prep/index.ts` | `is_from_contact` → `direction` | CRITICAL |
| `src/components/intelligence/CounterIntelligenceDashboard.tsx` | Add `isMountedRef` | HIGH |
| `src/components/intelligence/FortuneTrajectoryPanel.tsx` | Add `isMountedRef` | HIGH |
| `src/components/intelligence/ShadowNetworkGraph.tsx` | Add `isMountedRef` | HIGH |
| `src/components/intelligence/ManipulationVulnerabilityPanel.tsx` | Add `isMountedRef` | HIGH |
| `src/hooks/useSignedUrl.ts` | Add mounted flag | HIGH |
| `src/hooks/useProactiveInsights.ts` | Add `isMountedRef` | HIGH |
| `src/hooks/useMLModels.ts` | Add `isMountedRef` | HIGH |

---

## Implementation Summary

**Total Changes**:
- 20 files to modify
- 13 critical database column/property fixes
- 4 race condition fixes (affecting 7 components/hooks)
- 2 security warnings (no immediate code changes, requires security review)

**Priority Order**:
1. **Phase 1 (CRITICAL)**: Fix all 9 `media_type` → `mime_type` issues (prevents silent query failures)
2. **Phase 2 (CRITICAL)**: Fix all 4 `communication_type` → `channel` issues
3. **Phase 3 (CRITICAL)**: Fix all 3 `is_from_contact` → `direction` issues
4. **Phase 4 (HIGH)**: Add mount guards to 7 components/hooks to prevent memory leaks
5. **Phase 5 (MEDIUM)**: Security review for RLS policies and function search paths

---

## Technical Details

### Database Schema Reference (Verified via SQL Query)

**`media` table columns**:
`id, user_id, profile_id, file_url, thumbnail_url, caption, file_size, mime_type, created_at, storage_path, ai_metadata, ai_metadata_generated_at, ai_model_used, ai_generation_status, ai_generation_error, completed_analysis_modes, last_analysis_at, detected_language`

**`communications` table columns**:
`id, user_id, profile_id, channel, direction, subject, content, duration_minutes, sentiment_score, occurred_at, created_at`

Note: `media_type` does NOT exist on `media` table. `communication_type` and `is_from_contact` do NOT exist on `communications` table.

