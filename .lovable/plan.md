

# Codebase Scan: Final Pass (Post 4 Hardening Batches)

## Scan Summary

Previous batches fixed all critical issues: schema mismatches for core tables, memory leaks in motion/sensor listeners, interval cleanups, counter atomicity, Chinese character naming artifacts, and the `invokeProxy` optimization. This pass found **3 actionable issues** -- 1 schema mismatch, 1 error handling batch, and 1 documentation gap.

---

## Issues Found

### Issue 1: `ContactNewsAlerts` References `profiles.company` (Schema Mismatch)

**Files**: `src/hooks/useContactNewsCorrelation.ts` (lines 20, 33) and `src/components/intelligence/ContactNewsAlerts.tsx` (lines 213, 296)

The `Alert` and `Prediction` interfaces define `profiles?: { first_name: string; last_name: string; company: string }`. The `profiles` table has no `company` column -- the correct column is `organization`. The data comes from an edge function response, so it renders `undefined` silently, but the mismatch confuses AI models that read these interfaces as schema references.

**Fix**: Rename `company` to `organization` in both the interface definitions and the JSX rendering.

### Issue 2: `useIntelligenceSession` Has 7 Unsafe `catch (error: any)` Blocks

**File**: `src/hooks/useIntelligenceSession.ts` (lines 352, 370, 386, 402, 420, 434, 455)

Each catch block accesses `error.message` directly without an `instanceof Error` guard. This is the most heavily-used session hook (runs during every intelligence generation). Same pattern exists in `useBulkAnalysisSession.tsx` (line 231) and `ObservationsManager.tsx` (line 162).

**Fix**: Add `instanceof Error` guards to these 10 catch blocks across the 3 files. Use `String(error)` as fallback for non-Error objects.

### Issue 3: `SCHEMA_MAP.md` Missing `company → organization` Trap

The hallucination traps section doesn't list `company` as a wrong alias for `organization` on the `profiles` table. This is the exact mismatch found in Issue 1.

**Fix**: Add `company → organization` to the profiles hallucination traps.

---

## Implementation Plan

### Batch 1: Schema Mismatch Fix (2 files)
1. Update `useContactNewsCorrelation.ts` interfaces: `company` → `organization`
2. Update `ContactNewsAlerts.tsx` JSX: `profiles.company` → `profiles.organization`

### Batch 2: Error Handling Hardening (3 files)
3. Fix 7 `catch (error: any)` blocks in `useIntelligenceSession.ts`
4. Fix 1 `catch (error: any)` block in `useBulkAnalysisSession.tsx`
5. Fix 1 `catch (error: any)` block in `ObservationsManager.tsx`

### Batch 3: Documentation
6. Add `company → organization` trap to `docs/SCHEMA_MAP.md`

Total: 4 files edited, ~40 lines changed.

