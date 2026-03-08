

# Codebase Hardening Scan: Issues & Fix Plan

## Audit Summary

Scanned hooks, infrastructure, DI, routers, schema validators, and shared utilities. The previous 14-issue fix (Batch 1-5) addressed the most critical breaks. This scan found **11 remaining issues** across reliability, schema correctness, AI context, and memory safety.

---

## Issues Found

### Issue A: `useSmartTriggers` Counter Fix Is Incomplete (Data Corruption)
**File**: `src/hooks/useSmartTriggers.ts` lines 314-323
**Problem**: The "fix" from the prior batch overwrites `success_count` with literal `1` instead of incrementing. `{ success_count: 1 } as never` replaces the value, it does not add. Every execution resets the counter to 1.
**Fix**: Create an `increment_automation_counters` RPC function in the database, then call `supabase.rpc('increment_automation_counters', { p_rule_id: rule.id, p_field: result.success ? 'success_count' : 'failure_count' })`.

### Issue B: `schemaValidator.ts` Has Wrong Column Names for `media` Table
**File**: `src/lib/schemaValidator.ts` lines 53-56
**Problem**: Lists `file_path`, `file_type`, `original_filename` for the `media` table. The actual DB columns are `file_url`, `mime_type`, `storage_path`, `caption`, `thumbnail_url`. Any dev-time validation using this validator would give false negatives, and AI models referencing this file as a schema guide would hallucinate column names.
**Fix**: Update the `KNOWN_SCHEMAS.media` array to match the real DB columns. Also add missing columns to `contact_observations` (e.g., `observation_date`).

### Issue C: `invokeProxy.ts` Has Dead Code in `getRouteMap()` 
**File**: `src/lib/api/invokeProxy.ts` lines 16-34
**Problem**: The `getRouteMap()` function builds a route map but the inner loop body is empty (lines 26-29 are a comment with no code). This function is never called by `installInvokeProxy()` -- it's entirely dead code. Confuses AI models reading the codebase.
**Fix**: Remove the dead `getRouteMap()` function entirely.

### Issue D: `useContextEngine` Potential Infinite Fetch Loop
**File**: `src/hooks/useContextEngine.ts` lines 490-494
**Problem**: The effect depends on `[currentPrediction, getRecommendations]`. `getRecommendations` depends on `[user, currentPrediction, nearbyContacts]`. Each call to `getRecommendations` sets `recommendations` state but doesn't change `currentPrediction`. However, if `nearbyContacts` changes (from another effect), `getRecommendations` gets a new identity → effect re-runs → fires DB query on every change. This is wasteful at best; at worst, a fetch storm.
**Fix**: Remove `getRecommendations` from the effect's dependency array. Use a ref-based call pattern or debounce.

### Issue E: `useContextEngine` Calls `supabase.functions.invoke('predict-context')` Directly
**File**: `src/hooks/useContextEngine.ts` line 466
**Problem**: Uses `supabase.functions.invoke('predict-context')` but `predict-context` is mapped to `prediction-router /context` in ROUTE_MAP. The invoke proxy handles this, but the explicit import of `supabase` and direct call adds confusion and bypasses the typed `invokeFunction` adapter.
**Fix**: Replace with `invokeFunction('predict-context', {...})`.

### Issue F: Missing AI Context Documentation (Schema Map for LLMs)
**Problem**: When AI models (Lovable or HoC agents) need to write code that queries the database, they often hallucinate column names because there's no single authoritative machine-readable schema reference. The `schemaValidator.ts` is incomplete and the `DATABASE_SCHEMA.md` may be outdated.
**Fix**: Create `docs/SCHEMA_MAP.md` -- a concise, authoritative table-by-column reference for the 30 most-used tables, derived from the actual `types.ts`. This becomes the canonical reference for AI-assisted code generation. Also create `docs/FUNCTION_ROUTE_MAP.md` documenting all 400+ function → router mappings.

### Issue G: `useVoiceBulkAnalysis` Stall Check Interval Not Cleared on Unmount
**File**: `src/hooks/useVoiceBulkAnalysis.ts` line 440
**Problem**: `stallCheckInterval` is created via `setInterval` but I need to verify its cleanup.
**Fix**: Verify cleanup exists; if missing, add `clearInterval(stallCheckInterval)` in the effect cleanup.

### Issue H: `useBluetoothProximity` Scan Interval Leak Risk
**File**: `src/hooks/useBluetoothProximity.ts` line 252
**Problem**: `scanIntervalRef.current = setInterval(...)` is set up conditionally in an effect. Need to verify the cleanup path clears it on unmount.
**Fix**: Audit and add cleanup if missing.

### Issue I: Double-Routing Inefficiency in Proxy + invokeFn
**File**: `src/lib/api/invokeProxy.ts` + `src/lib/api/edgeFunctionRouter.ts`
**Problem**: When hooks call `invokeFunction('mice-recruitment-analyzer')`, the adapter's `invokeFn` maps it to `analysis-router` and calls `supabase.functions.invoke('analysis-router', {_route})`. The proxy intercepts this, checks if `analysis-router` is in the route map (it's not -- only legacy names are keys), and passes through to `originalInvoke`. This works but means every routed call goes through two async hops unnecessarily.
**Fix**: Have `invokeFn` store and use the `originalInvoke` reference directly (captured at proxy install time) to bypass the proxy for router calls. Export it from invokeProxy.

### Issue J: `nearbyContacts` State in `useContextEngine` Creates Stale Closure
**File**: `src/hooks/useContextEngine.ts`
**Problem**: `nearbyContacts` is in `getRecommendations` deps but is set from a separate effect/callback. If the effect fires before nearbyContacts updates, recommendations are stale. This interacts with Issue D.
**Fix**: Address alongside Issue D -- use a ref for nearbyContacts in the recommendations callback.

### Issue K: `docs/COMPLETE_SYSTEM_REFERENCE.md` and `EDGE_FUNCTION_CATALOG.md` May Reference Deleted Functions
**Problem**: Documentation may still list standalone function names that were deleted during consolidation, confusing AI models that reference these docs for context.
**Fix**: Audit and update both docs to reference domain routers and their routes.

---

## Fix Plan (Implementation Order)

### Batch 1: Data Integrity & Schema Correctness

1. **Fix Issue A** -- Create `increment_automation_counters` RPC and update `useSmartTriggers.ts` to use it instead of the broken overwrite pattern.

2. **Fix Issue B** -- Update `schemaValidator.ts` KNOWN_SCHEMAS to match actual DB columns for `media`, `contact_observations`, `messages`, `voice_recording_sessions`.

### Batch 2: AI Context & Documentation (Eliminate Hallucinations)

3. **Fix Issue F** -- Create `docs/SCHEMA_MAP.md` with authoritative table schemas for the 30 most-used tables. Create `docs/FUNCTION_ROUTE_MAP.md` with all function-to-router mappings.

4. **Fix Issue K** -- Audit and update `COMPLETE_SYSTEM_REFERENCE.md` and `EDGE_FUNCTION_CATALOG.md` to remove deleted function references.

### Batch 3: Memory Leaks & Race Conditions

5. **Fix Issue C** -- Remove dead `getRouteMap()` from `invokeProxy.ts`.

6. **Fix Issue D + J** -- Refactor `useContextEngine` effect to remove `getRecommendations` from deps, use debounced ref pattern.

7. **Fix Issue E** -- Replace direct `supabase.functions.invoke` in `useContextEngine` with `invokeFunction`.

8. **Fix Issues G + H** -- Audit `useVoiceBulkAnalysis` and `useBluetoothProximity` interval cleanup.

### Batch 4: Performance Optimization

9. **Fix Issue I** -- Export `originalInvoke` from invokeProxy and use it in `invokeFn` to avoid double-routing.

