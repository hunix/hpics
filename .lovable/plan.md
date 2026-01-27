

# Comprehensive Codebase Audit Report
## Issues, Race Conditions, Memory Leaks, DB Mismatches & Edge Function Errors

---

## Executive Summary

After a thorough line-by-line audit of the entire codebase, I identified **5 actionable issues** across 4 categories:

| Category | Critical | High | Medium | Total |
|----------|----------|------|--------|-------|
| Database Column Mismatches | 1 | 0 | 0 | 1 |
| Race Conditions (State Updates) | 0 | 2 | 0 | 2 |
| Type Safety Issues | 0 | 0 | 1 | 1 |
| Security Linter Warnings | 0 | 0 | 2 | 2 |

---

## Category 1: Database Column Mismatch (CRITICAL)

### Issue 1.1: `subvocalization-detector` uses non-existent column
**File**: `supabase/functions/subvocalization-detector/index.ts:69`

**Problem**: Queries `.eq('type', 'video')` but the `media` table uses `mime_type` or `media_type`, NOT `type`.

**Evidence**: 
- `supabase/migrations/20260103143333_.sql:71-81` shows `media` table has `mime_type`
- `supabase/functions/execute-face-scan-job/index.ts:100` correctly uses `.in("media_type", ["image", "photo"])`

**Fix**: Change line 69 from:
```typescript
.eq('type', 'video')
```
To:
```typescript
.eq('mime_type', 'video/mp4').or('mime_type.ilike.video/*')
```
Or if using the newer schema pattern:
```typescript
.ilike('mime_type', 'video/%')
```

---

## Category 2: Race Conditions (HIGH)

### Issue 2.1: `useIntelligenceSession` lacks isMounted check
**File**: `src/hooks/useIntelligenceSession.ts:274-278`

**Problem**: The `processBatch` callback updates state (`setIsProcessing(false)`) in the `finally` block without checking if the component is still mounted. If the component unmounts while a batch is in-flight, this causes a memory leak.

**Fix**: Add `isMountedRef` pattern:
```typescript
const isMountedRef = useRef(true);

// In cleanup effect:
useEffect(() => {
  return () => { isMountedRef.current = false; };
}, []);

// In processBatch finally block:
} finally {
  isProcessingRef.current = false;
  if (isMountedRef.current) {
    setIsProcessing(false);
  }
}
```

### Issue 2.2: `usePersistentBulkSession` IIFE lacks mount check
**File**: `src/hooks/usePersistentBulkSession.tsx:195-207`

**Problem**: Immediate async IIFE in `useEffect` calls `setSession` without verifying the component is still mounted.

**Fix**: Add mounted flag:
```typescript
useEffect(() => {
  let mounted = true;
  
  (async () => {
    const { data: items } = await supabase...
    if (mounted && items && items.length > 0) {
      setSession(prev => ...);
      clearInterval(pollInterval);
    }
  })();

  return () => { mounted = false; clearInterval(pollInterval); };
}, [...]);
```

---

## Category 3: Type Safety (MEDIUM)

### Issue 3.1: Missing interface for TranscriptSegment
**File**: `src/hooks/useMeetingIntelligence.ts:151`

**Problem**: `extractInsightFromSegment(segment)` uses implicit `any` type for segment parameter.

**Fix**: Define and use proper interface:
```typescript
interface TranscriptSegment {
  text: string;
  speakerLabel: string;
  startTime: number;
  endTime: number;
  sentiment?: 'positive' | 'negative' | 'neutral';
  emotions?: string[];
  confidence?: number;
}

const extractInsightFromSegment = useCallback((segment: TranscriptSegment) => {
  // ...
}, []);
```

---

## Category 4: Security Linter Warnings (MEDIUM)

### Issue 4.1: Function Search Path Mutable
**Level**: WARN

Some database functions don't set `search_path`, which could allow schema injection attacks.

### Issue 4.2: Permissive RLS Policies
**Level**: WARN

Some tables have overly permissive policies using `USING (true)` for UPDATE/DELETE/INSERT operations. This warrants a security review.

---

## Verified as Already Fixed (No Action Needed)

| Component | Status | Notes |
|-----------|--------|-------|
| `sync-google-calendar` | ✅ Fixed | Uses `contact_type` and proper join |
| `sync-outlook-calendar` | ✅ Fixed | Uses `contact_type` and proper join |
| `import-mbox-emails` | ✅ Fixed | Uses `contact_type` and proper join |
| `cross-reference-analysis` | ✅ Fixed | Uses `method.contact_type` |
| `deep-correlation-mapper` | ✅ Fixed | Uses `contact_interaction_notes` |
| `hypergame-theory-engine` | ✅ Fixed | Has `MiceAssessmentData` and `PsychologicalProfileData` interfaces |
| `NFCTagManager` | ✅ Fixed | Proper event listener cleanup |
| `WhatsAppImport` | ✅ Fixed | Polling cleanup on unmount (lines 128-136) |
| `useVersionCheck` | ✅ Fixed | Proper SW listener cleanup (lines 246-254) |
| `VideoFaceEnrollment` | ✅ Fixed | Timer cleanup on unmount |
| `CrossIdDashboard` | ✅ Fixed | Interval cleanup on unmount |
| `GaitCapturePanel` | ✅ Fixed | Motion handler ref pattern |
| `useRelationshipAnalytics` | ✅ Fixed | Proper messages join via conversations |
| `useAuth` | ✅ Fixed | Has `.catch()` error handler |
| `useBluetoothProximity` | ✅ Fixed | Calls `stopScanning()` on unmount |
| `useAutoSocialSync` | ✅ Correct | Has `isMountedRef` check at line 174 |

---

## Files to Modify

| File | Change | Priority |
|------|--------|----------|
| `supabase/functions/subvocalization-detector/index.ts` | Fix `type` → `mime_type` with proper video pattern | CRITICAL |
| `src/hooks/useIntelligenceSession.ts` | Add `isMountedRef` check in processBatch | HIGH |
| `src/hooks/usePersistentBulkSession.tsx` | Add mounted check in IIFE | HIGH |
| `src/hooks/useMeetingIntelligence.ts` | Add `TranscriptSegment` interface | MEDIUM |

---

## Implementation Summary

**Total Changes**:
- 4 files to modify
- ~25 lines of code changes
- 1 critical database column fix
- 2 race condition fixes
- 1 type safety improvement

**Priority Order**:
1. Fix `subvocalization-detector` media query (prevents silent failures)
2. Add isMounted checks to `useIntelligenceSession` and `usePersistentBulkSession`
3. Add `TranscriptSegment` interface to `useMeetingIntelligence`

