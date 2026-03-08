

# Codebase Scan Results: Remaining Issues

## Scan Summary

After thorough scanning of hooks, repositories, components, API layer, schema references, event listeners, interval cleanups, and naming conventions, the codebase is in strong shape following the prior hardening batches. Most critical issues (A-K) are verified fixed.

**Found 3 remaining issues** and **2 documentation improvements** that will further reduce AI hallucinations.

---

## Issues

### Issue 1: GaitCapturePanel `removeEventListener` Reference Mismatch (Memory Leak)

**File**: `src/components/biometrics/GaitCapturePanel.tsx`
**Problem**: `startCapture` (line 126) adds `handleMotion` as the listener. But `handleMotion` is a `useCallback` that depends on `[isCapturing]`, so its identity changes when capture starts. The unmount cleanup (line 235) removes `handleMotionRef.current`, but `stopCapture` (line 138) removes `handleMotion` -- which may be a different function reference than what was originally added if `isCapturing` changed between start and stop.
**Fix**: Store the listener reference at `addEventListener` time in a ref. Use that same ref for both `stopCapture` and unmount cleanup. Remove the `isCapturing` dependency from `handleMotion` and use a ref instead.

### Issue 2: `invokeProxy.ts` Eagerly Loads Router Module at Install Time (Startup Delay)

**File**: `src/lib/api/invokeProxy.ts` lines 58-60
**Problem**: `loadRouter()` and `loadRouteMap()` are called eagerly during `installInvokeProxy()`. These fire `import()` calls that load and parse the entire `edgeFunctionRouter.ts` module synchronously during app startup. While the calls are async, they still add startup work. Since the proxy defers to lazy loading anyway (lines 72-73), the eager calls are wasteful.
**Fix**: Remove the eager `loadRouter()` / `loadRouteMap()` calls on lines 58-60. The lazy loading on first invoke (lines 72-73) is sufficient.

### Issue 3: `SensorDashboard` Battery API Listener Leak

**File**: `src/components/mobile/SensorDashboard.tsx` lines 85-100+
**Problem**: The battery API effect adds `levelchange` and `chargingchange` event listeners but I need to verify they're cleaned up on unmount.
**Fix**: Audit the effect and add cleanup `removeEventListener` calls if missing.

---

## Documentation Improvements (AI Hallucination Prevention)

### Improvement A: Add "Do NOT Use" Aliases to SCHEMA_MAP.md

Add a dedicated section listing all known wrong column names that AI models frequently hallucinate, grouped by table. This becomes a quick "stop list" for code review. Current hallucination traps section exists but could be expanded with more tables (e.g., `contact_interaction_notes`, `contact_observations`, `communications`).

### Improvement B: Add `CODING_CONVENTIONS.md`

Create a concise conventions file that AI models can reference for consistent code patterns:
- Import patterns (use `@/lib/api` not direct supabase calls for edge functions)
- Type casting pattern (`as unknown as T[]` for JSON fields)
- Error handling pattern (`instanceof Error` checks)
- Hook naming conventions
- When to use `invokeFunction` vs direct supabase client

---

## Implementation Order

1. Fix Issue 1 (GaitCapturePanel ref mismatch)
2. Fix Issue 2 (remove eager proxy loading)
3. Fix Issue 3 (SensorDashboard battery cleanup)
4. Create `docs/CODING_CONVENTIONS.md`
5. Expand hallucination traps in `docs/SCHEMA_MAP.md`

