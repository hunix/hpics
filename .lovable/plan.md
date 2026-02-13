

# Codebase Audit: Issues Found and Fix Plan

## Issues Discovered

### Issue 1: Duplicate `useAIBudget` Hook Files
**Location**: `src/hooks/useAIBudget.ts` AND `src/hooks/useAIBudget.tsx`
**Type**: Naming collision / ambiguous import
**Details**: Two files export the same hook name `useAIBudget` with different interfaces and query keys (`ai-budget-preferences`/`ai-budget-usage` vs `user-preferences-budget`/`ai-spending-current`). The `.tsx` version makes 3 parallel DB queries; the `.ts` version makes 1 and filters client-side. Consumers get whichever the bundler resolves first, causing unpredictable behavior. One must be deleted.
**Fix**: Delete `src/hooks/useAIBudget.tsx` (the `.tsx` version makes redundant parallel queries). Keep the `.ts` version, which is more efficient (single query with client-side filtering). Add the missing `alertsEnabled` field from the `.tsx` version into the `.ts` version for API compatibility.

---

### Issue 2: `useEdgeFunctionHealthCheck` Hits Deleted Standalone Functions
**Location**: `src/hooks/useEdgeFunctionHealthCheck.ts` (lines 35-77)
**Type**: Mismatch -- references deleted edge functions
**Details**: The `INTELLIGENCE_FUNCTIONS` array references 30 standalone function names (`mice-recruitment-analyzer`, `trauma-exploitation-engine`, `temporal-fusion-transformer`, etc.) that were deleted during Phase 5.4 cleanup. Health checks against these will always return 404/"unhealthy". Two functions referenced (`trauma-exploitation-engine`, `temporal-fusion-transformer`, `unified-data-fusion`) still exist as standalone but are NOT in the `ROUTE_MAP`, meaning they also lack router routing.
**Fix**: Update `INTELLIGENCE_FUNCTIONS` to target the domain routers (e.g., `analysis-router?healthCheck=1`) instead of deleted standalone names. Add missing standalone functions to `ROUTE_MAP` or update health check URLs to point to the correct router paths.

---

### Issue 3: `useDigitalTwin` Invokes Deleted `digital-twin-generator` and Missing `digital-twin-simulator`
**Location**: `src/hooks/intelligence/useDigitalTwin.ts` (lines 61, 83)
**Type**: Broken invocation -- calling deleted/nonexistent functions directly
**Details**: `createTwin` calls `supabase.functions.invoke('digital-twin-generator')` and `simulateScenario` calls `supabase.functions.invoke('digital-twin-simulator')`. The `digital-twin-generator` directory was deleted (it's mapped to `fusion-router /digital-twin`), but the code bypasses the adapter by using `supabase.functions.invoke` directly. `digital-twin-simulator` never existed in the ROUTE_MAP and has no standalone function -- it will always 404.
**Fix**: Replace both `supabase.functions.invoke` calls with `invokeFunction` from the adapter. Add `digital-twin-simulator` to ROUTE_MAP under fusion-router.

---

### Issue 4: `useAutoAggregateOnCompletion` Invokes Deleted Functions Directly
**Location**: `src/hooks/useAutoAggregateOnCompletion.ts` (lines 51, 65, 79)
**Type**: Broken invocation -- bypasses adapter
**Details**: Calls `supabase.functions.invoke('aggregate-media-intelligence')`, `aggregate-voice-intelligence`, and `generate-intelligence-dossier` directly. All three were deleted and are now routed through `intelligence-router`. These calls will 404 at runtime.
**Fix**: Import and use `invokeFunction` from the adapter.

---

### Issue 5: 88 Hook Files Still Use Direct `supabase.functions.invoke` (Not Using Adapter)
**Location**: 88 files in `src/hooks/` (925 total invocations found)
**Type**: Systematic mismatch -- adapter bypass
**Details**: Despite creating the `invokeFunction` adapter and updating `useIntelligenceGeneration.ts`, 88 other hook files still call `supabase.functions.invoke` directly. For functions whose standalone directories were deleted, these calls will 404. Even for surviving standalones, these calls bypass the router circuit breaker.
**Fix**: Batch-migrate the 88 hook files to use `invokeFunction`. Prioritize files that reference deleted functions (they are currently broken). Remaining files can be migrated incrementally.

---

### Issue 6: `edgeFunctionRouter.ts` `invokeFunction` Ignores `AbortSignal`
**Location**: `src/lib/api/edgeFunctionRouter.ts` (line 436)
**Type**: Dead code / missing feature
**Details**: The `options.signal` parameter is accepted but never passed to `supabase.functions.invoke`. Line 436: `...(options.signal ? {} : {})` is a no-op spread that does nothing regardless of whether a signal exists. Long-running requests cannot be cancelled.
**Fix**: Pass the signal to the underlying fetch. Since `supabase.functions.invoke` doesn't natively support AbortSignal, implement a race with `AbortSignal` or use a custom fetch wrapper.

---

### Issue 7: `useRealtimeContacts` Debounced Toast Creates New Closure on Every Render Cycle
**Location**: `src/hooks/useRealtimeContacts.tsx` (lines 47-52)
**Type**: Potential memory leak
**Details**: `debouncedToast` is created with `useMemo(() => debounce(...), [])`. The empty dependency array means it captures the initial `toast.info` reference. If `toast` from sonner ever changes identity, the closure is stale. More critically, the `debounce` function creates a `setTimeout` that is never cleaned up on unmount -- if the component unmounts during the debounce window, the timeout fires on an unmounted component.
**Fix**: Add cleanup for the debounce timeout in the effect's cleanup function. Since `toast` from sonner is stable, the empty deps array is acceptable, but add a comment noting this assumption.

---

### Issue 8: `useOfflineData` Auto-Sync Creates Infinite Loop Risk
**Location**: `src/hooks/useOfflineData.tsx` (lines 286-290)
**Type**: Potential infinite loop / race condition
**Details**: The effect at line 286 triggers `syncPendingChanges` when `isOnline && pendingCount > 0`. But `syncPendingChanges` updates `pendingCount` at the end (line 278-279). If sync fails and items remain, `pendingCount` stays > 0, and `syncPendingChanges` is in the deps -- this could trigger a re-render loop. The `isSyncing` guard prevents concurrent execution, but the effect will keep re-firing on every `pendingCount` state update.
**Fix**: Remove `pendingCount` from the effect's dependency array -- only trigger on `isOnline` transitioning to true. Use a ref to track whether auto-sync has already been triggered for the current online session.

---

### Issue 9: `useQueryCleanup` Has Unstable Dependency Array
**Location**: `src/hooks/useQueryCleanup.ts` (line 44)
**Type**: Infinite re-render risk
**Details**: The effect depends on `queryKeys` (an array of arrays). If the caller passes `queryKeys` as an inline array literal (e.g., `useQueryCleanup({ queryKeys: [['contacts']] })`), a new reference is created every render, causing the effect to re-run (and cancel queries) every render.
**Fix**: Memoize the serialized query keys or use `JSON.stringify` in a `useMemo` for the dependency comparison.

---

### Issue 10: `useServices` Hook Has Unstable Object Dependency
**Location**: `src/infrastructure/di/Container.ts` (line 200)
**Type**: Infinite re-render risk
**Details**: `useServices` depends on `keys` (a Record object). If passed as an inline object literal, React will see a new reference every render, causing `useMemo` to re-compute and potentially trigger downstream re-renders in every cycle. Currently unused (0 call sites found), but a latent bug.
**Fix**: Use `JSON.stringify(keys)` as the memo dependency, or mark the hook with a documentation note that `keys` must be a stable reference.

---

### Issue 11: `useSmartTriggers` Database Update Uses Undefined Properties
**Location**: `src/hooks/useSmartTriggers.ts` (lines 308-309)
**Type**: Runtime bug
**Details**: Lines 308-309 cast `rule` to `any` to access `success_count` and `failure_count`, but `AutomationRule` has no such properties -- they are database columns not mapped in the interface. So `(rule as any).success_count` is always `undefined`, and `undefined + 1 = NaN`. This writes `NaN` to the database.
**Fix**: Fetch the current `success_count`/`failure_count` from the database before incrementing, or use an RPC/SQL increment function.

---

### Issue 12: `edgeFunctionRouter` Missing Mappings for Surviving Standalone Functions
**Location**: `src/lib/api/edgeFunctionRouter.ts`
**Type**: Incomplete migration
**Details**: Several standalone functions still exist but are NOT in the ROUTE_MAP: `trauma-exploitation-engine`, `temporal-fusion-transformer`, `unified-data-fusion`, `workflow-executor`, `thermal-intelligence`, `differential-sync-engine`, and others referenced by hooks. The adapter's fallback will invoke them directly, which works, but they bypass the router circuit breaker and won't benefit from consolidation.
**Fix**: Either add these to ROUTE_MAP (pointing to the appropriate domain router) or consolidate them into the existing routers.

---

### Issue 13: `circuitBreaker.ts` Unbounded Memory Growth in Global Registry
**Location**: `src/lib/circuitBreaker.ts` (line 193)
**Type**: Memory leak
**Details**: `circuitBreakers` is a global `Map` that grows indefinitely. `getEdgeFunctionBreaker` creates a new entry for every unique function name. With 407+ function names and the `edge:` prefix pattern, plus router-level breakers (`router:analysis-router`), the map accumulates entries forever. There is no eviction or size limit. Additionally, `failureTimestamps` arrays inside each breaker grow unboundedly within the monitoring window (cleaned lazily).
**Fix**: Add a max size to the global map (e.g., LRU eviction for breakers unused for > 1 hour). This is low-priority since memory per entry is small.

---

### Issue 14: `useAutoAggregateOnCompletion` `hasAggregatedRef` Never Clears
**Location**: `src/hooks/useAutoAggregateOnCompletion.ts` (line 24)
**Type**: Memory leak
**Details**: `hasAggregatedRef` is a `Set<string>` that accumulates session IDs forever. If a user runs many bulk analysis sessions in a single page session, this set grows without bound.
**Fix**: Clear old entries when the component receives a new `sessionId`, or limit the set size.

---

## Fix Plan (Implementation Order)

### Batch 1: Critical Runtime Breaks (broken 404 calls)

1. **Fix Issue 3** (`useDigitalTwin`): Replace `supabase.functions.invoke('digital-twin-generator')` with `invokeFunction('digital-twin-generator')`. Add `'digital-twin-simulator': { router: 'fusion-router', path: '/digital-twin-simulator' }` to ROUTE_MAP.

2. **Fix Issue 4** (`useAutoAggregateOnCompletion`): Replace 3x `supabase.functions.invoke` calls with `invokeFunction`.

3. **Fix Issue 2** (`useEdgeFunctionHealthCheck`): Rewrite `INTELLIGENCE_FUNCTIONS` to reference domain router endpoints instead of deleted standalone names. Health check URL format: `{router}?healthCheck=1`.

### Batch 2: Data Integrity Bugs

4. **Fix Issue 1** (duplicate `useAIBudget`): Delete `src/hooks/useAIBudget.tsx`. Merge the `alertsEnabled` field into `src/hooks/useAIBudget.ts`.

5. **Fix Issue 11** (`useSmartTriggers`): Replace inline `success_count`/`failure_count` increment with a SQL RPC call or a read-then-write pattern.

### Batch 3: Race Conditions and Loops

6. **Fix Issue 8** (`useOfflineData`): Remove `pendingCount` from auto-sync effect deps. Use a `hasTriggeredRef` to prevent re-triggering.

7. **Fix Issue 9** (`useQueryCleanup`): Serialize `queryKeys` for stable dependency comparison.

8. **Fix Issue 10** (`useServices`): Use `JSON.stringify(keys)` as memo dependency.

### Batch 4: Memory Leaks

9. **Fix Issue 7** (`useRealtimeContacts`): Add debounce timeout cleanup on unmount.

10. **Fix Issue 14** (`useAutoAggregateOnCompletion`): Clear `hasAggregatedRef` set when `sessionId` changes.

11. **Fix Issue 13** (`circuitBreaker.ts`): Add LRU eviction for stale circuit breaker entries.

### Batch 5: Systematic Migration (can be done incrementally)

12. **Fix Issue 5** (88 hooks): Create a migration checklist of all 88 files. Prioritize those referencing deleted functions. Migrate to `invokeFunction` in batches.

13. **Fix Issue 6** (`invokeFunction` AbortSignal): Implement signal propagation via `Promise.race` with abort.

14. **Fix Issue 12** (missing ROUTE_MAP entries): Add surviving standalone functions to ROUTE_MAP or consolidate into domain routers.

### Technical Details per Fix

**Issue 1 fix**: Delete `useAIBudget.tsx`, add `alertsEnabled` boolean property to the `.ts` version's return type, sourced from `(preferences as any)?.ai_budget_alerts_enabled ?? true`.

**Issue 2 fix**: Change health check URLs from `functions/v1/mice-recruitment-analyzer?healthCheck=1` to `functions/v1/analysis-router?healthCheck=1` (with `_route: '/health'` in body or query param). Update all 30 entries in `INTELLIGENCE_FUNCTIONS`.

**Issue 3 fix**: `import { invokeFunction } from '@/lib/api/edgeFunctionRouter'`, then replace `supabase.functions.invoke('digital-twin-generator', {...})` with `invokeFunction('digital-twin-generator', {...})` (it's already in ROUTE_MAP as `fusion-router /digital-twin`).

**Issue 8 fix**: Replace the effect with:
```typescript
const prevOnlineRef = useRef(isOnline);
useEffect(() => {
  if (isOnline && !prevOnlineRef.current && pendingCount > 0) {
    syncPendingChanges();
  }
  prevOnlineRef.current = isOnline;
}, [isOnline]);
```

**Issue 11 fix**: Use SQL increment approach:
```typescript
await supabase.rpc('increment_automation_counters', {
  p_rule_id: rule.id,
  p_is_success: result.success
});
```

