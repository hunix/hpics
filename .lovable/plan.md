

# Codebase Scan Results: Final Pass

## Scan Summary

After the prior 3 hardening batches, the codebase is in strong shape. Schema mismatches, table name errors, interval leaks, and listener leaks have all been resolved. This scan found **4 remaining issues** -- one critical bug, one widespread code quality issue, and two minor improvements.

---

## Issues Found

### Issue 1: Chinese Characters in Property Name (Runtime Bug)

**File**: `src/hooks/intelligence/useBreakingPointPrediction.ts` (lines 228, 247, 269)  
**Also**: `src/components/intelligence/dominion/BreakingPointCalculator.tsx` (line 132)

**Problem**: The parameter `observed效果` contains Chinese characters (效果 = "effect"). This is a code generation artifact. While JavaScript technically allows Unicode identifiers, this breaks developer tooling, confuses AI models, and makes the code unmaintainable. The property name should be `observedEffect`.

**Fix**: Rename `observed效果` to `observedEffect` in both the hook (type definition + 3 usages) and the component caller.

### Issue 2: Widespread `catch (error: any)` Pattern (24 files, 175 occurrences)

**Problem**: Many catch blocks use `catch (error: any)` then access `error.message` directly. This violates the coding convention (Convention #3) which requires `instanceof Error` checks. However, fixing all 175 occurrences in one batch is risky and would be a massive diff. 

**Fix**: Fix the highest-traffic files first (hooks that run on every page load or frequently-used mutations). The `catch (error: any)` pattern in React Query `onError` callbacks typed as `(error: Error)` is actually safe and can be left. Focus on the truly unsafe `catch (error: any) { ... error.message }` blocks in:
- `src/hooks/useSmartTriggers.ts` (line 253)
- `src/hooks/useAnalysisSession.tsx` (line 159)
- `src/components/intelligence/BehavioralDNAPanel.tsx` (line 72)
- `src/components/intelligence/FortuneTrajectoryPanel.tsx` (line 88)
- `src/components/intelligence/ManipulationVulnerabilityPanel.tsx` (line 86)
- `src/components/intelligence/CounterIntelligenceDashboard.tsx` (line 76)

### Issue 3: `invokeFn` Dynamic Import on Every Call (Performance)

**File**: `src/lib/api/edgeFunctionRouter.ts` (lines 514-516)

**Problem**: Every call to `invokeFn` does `await import('@/lib/api/invokeProxy')` to get `originalInvoke`. While Vite caches dynamic imports, this still creates an async hop on every single edge function call. Since `originalInvoke` is set once at startup and never changes, it should be cached in a module-level variable after the first import.

**Fix**: Cache the result after first import in a module-level variable.

### Issue 4: `SensorDashboard` Motion Handlers Use Inline Functions (Minor)

**File**: `src/components/mobile/SensorDashboard.tsx` (lines 60-81)

**Problem**: The `handleMotion` and `handleOrientation` listeners are defined inline in the effect. Since they don't depend on state (they use the setter callback form), this is safe -- the effect runs once (`[]` deps) so the same reference is used for add and remove. This is actually fine. **No fix needed.**

---

## Implementation Plan

### Batch 1: Critical Bug Fix
1. Rename `observed效果` → `observedEffect` in `useBreakingPointPrediction.ts` and `BreakingPointCalculator.tsx`

### Batch 2: Error Handling Hardening
2. Fix `catch (error: any)` → `catch (error)` with `instanceof Error` guard in the 6 highest-traffic files listed above

### Batch 3: Performance
3. Cache `originalInvoke` reference in `edgeFunctionRouter.ts` to avoid repeated dynamic imports

Total: 8 files edited, ~40 lines changed.

