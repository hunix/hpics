

# Comprehensive Codebase Audit Report
## Issues, Race Conditions, Memory Leaks, DB Mismatches & Edge Function Errors

---

## Executive Summary

After a thorough line-by-line audit, I identified **8 actionable issues** across 4 categories:

| Category | Critical | High | Medium | Total |
|----------|----------|------|--------|-------|
| Database Column Mismatches | 4 | 0 | 0 | 4 |
| Memory Leaks | 0 | 1 | 0 | 1 |
| Type Safety Issues | 0 | 2 | 0 | 2 |
| Security Linter Warnings | 0 | 0 | 2 | 2 |

---

## Category 1: Database Column Mismatches (CRITICAL)

### Issue 1.1: `sync-google-calendar` uses wrong column name
**File**: `supabase/functions/sync-google-calendar/index.ts:154`

**Problem**: Uses `.eq('type', 'email')` but column is `contact_type`.

**Fix**: Change to `.eq('contact_type', 'email')`

### Issue 1.2: `sync-outlook-calendar` uses wrong column name
**File**: `supabase/functions/sync-outlook-calendar/index.ts:147`

**Problem**: Uses `.eq('type', 'email')` but column is `contact_type`. Also incorrectly queries with `user_id` which doesn't exist on `contact_methods`.

**Fix**: Change to `.eq('contact_type', 'email')` and join via profiles for user scoping.

### Issue 1.3: `cross-reference-analysis` accesses wrong property
**File**: `supabase/functions/cross-reference-analysis/index.ts:122`

**Problem**: Uses `method.type` instead of `method.contact_type`.

**Fix**: Change to `method.contact_type`.

### Issue 1.4: `import-mbox-emails` uses non-existent column
**File**: `supabase/functions/import-mbox-emails/index.ts:230`

**Problem**: Uses `.eq('method_type', 'email')` but column is `contact_type`.

**Fix**: Change to `.eq('contact_type', 'email')`.

---

## Category 2: Memory Leaks (HIGH)

### Issue 2.1: `useVersionCheck` hook has no cleanup for service worker listeners
**File**: `src/components/reliability/NewVersionAvailable.tsx:210-230`

**Problem**: The `useVersionCheck` hook adds `updatefound` and `statechange` listeners to the service worker without wrapping in `useEffect` and without cleanup. These listeners persist and accumulate.

**Fix**: Wrap in `useEffect` with proper cleanup or move to a singleton pattern.

---

## Category 3: Type Safety Issues (HIGH)

### Issue 3.1: Hypergame Engine uses `any` types
**File**: `supabase/functions/hypergame-theory-engine/index.ts:425-426`

**Problem**: `miceData: any` and `psychProfile: any` bypass type checking.

**Fix**: Define proper interfaces for these parameters.

### Issue 3.2: Meeting Intelligence uses implicit `any`
**File**: `src/hooks/useMeetingIntelligence.ts:147`

**Problem**: `extractInsightFromSegment(segment: any)` uses implicit any.

**Fix**: Define `TranscriptSegment` interface and type the parameter.

---

## Category 4: Security Linter Warnings (MEDIUM)

### Issue 4.1: Function Search Path Mutable
Some database functions don't set `search_path`, potentially allowing schema injection.

### Issue 4.2: Permissive RLS Policies
Some tables have overly permissive policies using `USING (true)` for UPDATE/DELETE/INSERT.

---

## Verified as Already Fixed (No Action Needed)

| Component | Status |
|-----------|--------|
| `useRelationshipAnalytics` messages join | ✅ Fixed |
| `deep-correlation-mapper` table name | ✅ Fixed (uses `contact_interaction_notes`) |
| `NFCTagManager` event listener cleanup | ✅ Fixed |
| `WhatsAppImport` polling cleanup | ✅ Fixed |
| `useAuth` error handling | ✅ Fixed |
| `VideoFaceEnrollment` timer cleanup | ✅ Fixed |
| `CrossIdDashboard` interval cleanup | ✅ Fixed |
| `SituationRoom` timer cleanup | ✅ Fixed |
| `LivenessDetection` timer cleanup | ✅ Correct |
| `KeystrokeMonitor` interval cleanup | ✅ Correct |

---

## Files to Modify

| File | Change | Priority |
|------|--------|----------|
| `supabase/functions/sync-google-calendar/index.ts` | Fix `type` → `contact_type` | CRITICAL |
| `supabase/functions/sync-outlook-calendar/index.ts` | Fix `type` → `contact_type`, fix `user_id` join | CRITICAL |
| `supabase/functions/cross-reference-analysis/index.ts` | Fix `method.type` → `method.contact_type` | CRITICAL |
| `supabase/functions/import-mbox-emails/index.ts` | Fix `method_type` → `contact_type` | CRITICAL |
| `src/components/reliability/NewVersionAvailable.tsx` | Wrap SW listeners in useEffect with cleanup | HIGH |
| `supabase/functions/hypergame-theory-engine/index.ts` | Add type interfaces for any params | MEDIUM |
| `src/hooks/useMeetingIntelligence.ts` | Add TranscriptSegment interface | MEDIUM |

---

## Implementation Summary

**Total Changes**:
- 7 files to modify
- ~30 lines of code changes
- 4 critical database column fixes
- 1 memory leak fix
- 2 type safety improvements

**Priority Order**:
1. Fix 4 edge functions with wrong `contact_methods` column names (prevents silent query failures)
2. Fix service worker listener cleanup in `useVersionCheck`
3. Address type safety issues

