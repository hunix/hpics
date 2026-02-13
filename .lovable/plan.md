
# Phase 2-5: Complete System Consolidation Implementation Plan

## Current Status
- Phase 0 (Foundation Utilities): COMPLETE
- Phase 1 (Database Schema Consolidation): COMPLETE
- **Phase 2-5: PENDING** -- this plan covers all remaining work

## Critical Discovery: Frontend Impact Analysis
- **245 files** contain `supabase.functions.invoke()` calls (1,935 total invocations)
- **94 intelligence tasks** in `useIntelligenceGeneration.ts` each reference individual edge functions by name
- A **transparent adapter layer** is essential to avoid breaking 245+ files during migration

---

## Phase 2: Domain Router Architecture

### Step 2.1 - Edge Function Adapter (Frontend Bridge)
Create `src/lib/api/edgeFunctionRouter.ts` -- a transparent adapter that maps old function names to new router endpoints. This is the **single most important file** because it decouples all 245 frontend files from the backend topology change.

```
Old: supabase.functions.invoke('mice-recruitment-analyzer', { body })
New: invokeFunction('mice-recruitment-analyzer', body)
     -> internally routes to analysis-router POST /mice
```

The adapter will:
- Maintain a complete map of 407 old function names to new router paths
- Fall back to direct invocation for unmigrated functions
- Log deprecation warnings for direct `supabase.functions.invoke` calls
- Preserve existing retry/circuit-breaker integration

### Step 2.2 - Analysis Router (Consolidates ~50 functions)
**File**: `supabase/functions/analysis-router/index.ts`

Consolidates all `analyze-*`, `mice-*`, `attachment-*`, `manipulation-*`, `phobia-*`, `coercion-*`, `dark-tetrad-*`, and similar psychology/analysis functions into one Hono router.

Handler files (one per analysis type):
- `handlers/mice.ts` -- extracted from `mice-recruitment-analyzer`
- `handlers/behavioral-dna.ts` -- from `behavioral-dna-sequencer`
- `handlers/attachment.ts` -- from `attachment-vulnerability-analyzer`
- `handlers/deception.ts` -- from `enhanced-deception-detector`
- `handlers/dark-tetrad.ts` -- from `dark-tetrad-profiler`
- `handlers/influence-profile.ts` -- from `analyze-influence-profile`
- `handlers/coercion.ts` -- from `coercion-resistance-assessor`
- `handlers/existential.ts` -- from `existential-leverage-calculator`
- `handlers/manipulation.ts` -- from `manipulation-vulnerability-assessment`
- `handlers/phobia.ts` -- from `phobia-exploitation-engine`
- Plus ~40 more handlers

Each handler extracts the core logic from its standalone function, using shared utilities from Phase 0 (`validateAuth`, `corsHeaders`, `normalizeParams`).

### Step 2.3 - Intelligence Router (Consolidates ~45 functions)
**File**: `supabase/functions/intelligence-router/index.ts`

Routes: `/dossier`, `/aggregate-media`, `/aggregate-voice`, `/aggregate-contact`, `/deep-engine`, `/session-runner`, `/mosaic-fuser`, `/cross-modal`, `/correlate`, `/rag-query`

### Step 2.4 - Prediction Router (Consolidates ~25 functions)
**File**: `supabase/functions/prediction-router/index.ts`

Routes: `/churn`, `/betrayal`, `/behavioral-scenarios`, `/relationship-trajectory`, `/contact-needs`, `/breaking-point`, `/life-sequence`, `/fortune-trajectory`, `/cascade-virality`

### Step 2.5 - Warfare Router (Consolidates ~25 functions)
**File**: `supabase/functions/warfare-router/index.ts`

Routes: `/cognitive`, `/memetic`, `/narrative`, `/semantic`, `/identity-destabilization`, `/trauma`, `/cult-tactics`, `/cognitive-iw`, `/reflexive-control`, `/draco-deception`

### Step 2.6 - Biometric Router (Consolidates ~30 functions)
**File**: `supabase/functions/biometric-router/index.ts`

Routes: `/face-extract`, `/voice-extract`, `/gait`, `/keystroke`, `/signature`, `/body`, `/match`, `/cross-identify`, `/mosaic-match`, `/pupillometry`, `/gaze`

### Step 2.7 - Network Router (Consolidates ~20 functions)
**File**: `supabase/functions/network-router/index.ts`

Routes: `/graph`, `/influence`, `/cascade`, `/community`, `/power`, `/exploitation`, `/resilience`, `/brokerage`, `/social-graph`

### Step 2.8 - Enrichment Router (Consolidates ~15 functions)
**File**: `supabase/functions/enrichment-router/index.ts`

Routes: `/auto-enrich`, `/osint`, `/linkedin`, `/social-scrape`, `/news`, `/web-mentions`, `/digital-footprint`

### Step 2.9 - Fusion Router (Consolidates ~20 functions)
**File**: `supabase/functions/fusion-router/index.ts`

Routes: `/temporal`, `/mosaic`, `/dempster-shafer`, `/entity-resolution`, `/sentiment-cascade`, `/graph-rag`, `/cross-modal-synthesis`, `/digital-twin`

### Step 2.10 - AGIS Router (Consolidates ~30 functions)
**File**: `supabase/functions/agis-router/index.ts`

Routes: `/cascade`, `/orchestrate`, `/genesis`, `/omniscient`, `/cosmic`, `/akashic`, `/quantum-cognition`, `/morphic-resonance`, `/omega-point`

### Step 2.11 - Utility Router (Consolidates ~20 functions)
**File**: `supabase/functions/utility-router/index.ts`

Routes: `/health-check`, `/encrypt`, `/decrypt`, `/audit-log`, `/alerts`, `/reminders`, `/push-notification`, `/scheduled-reports`

### Step 2.12 - Hardware Router (Consolidates ~15 functions)
**File**: `supabase/functions/hardware-router/index.ts`

Routes: `/gateway`, `/drone`, `/sdr`, `/thermal`, `/gopro`, `/sensor`, `/rf-signal`

### Step 2.13 - Voice Router (Consolidates ~12 functions)
**File**: `supabase/functions/voice-router/index.ts`

Routes: `/transcribe`, `/stress`, `/emotion`, `/stylometric`, `/bulk-analysis`, `/comprehensive`

### Step 2.14 - Update Frontend Invocation Layer
Update `useIntelligenceGeneration.ts` to use the new adapter:
- Replace direct `supabase.functions.invoke()` calls with `invokeFunction()`
- The 94 task definitions remain unchanged -- only the invocation mechanism changes
- Circuit breaker and health monitor integrate with the adapter

### Implementation Order for Phase 2:
1. Edge Function Adapter (frontend bridge) -- zero-breakage migration path
2. Analysis Router + handlers (highest usage: 50 functions, 94 intelligence tasks depend on these)
3. Intelligence Router (aggregation pipeline depends on this)
4. Prediction Router
5. Warfare Router
6. All remaining routers in parallel
7. Update `useIntelligenceGeneration.ts` and `useEdgeFunctionHealthCheck.ts`
8. Progressively update remaining 245 files to use adapter

---

## Phase 3: Frontend Architecture Optimization

### Step 3.1 - Domain-Specific Type Modules
Create modular type files in `src/types/database/` to avoid importing the 35,000-line monolith:

```
src/types/database/
  core.ts          -- Profile, Communication, Group types
  intelligence.ts  -- Analysis, Dossier, Insight types
  biometric.ts     -- FaceEmbedding, VoiceSignature types
  warfare.ts       -- Campaign, Threat, Strategy types
  network.ts       -- NetworkNode, NetworkEdge types
  agis.ts          -- AGISState, CascadeRule types
  unified.ts       -- UnifiedAnalysis, UnifiedPrediction types
  index.ts         -- Re-exports all
```

These are manually maintained types (not auto-generated) that match the database schema. The auto-generated `types.ts` remains untouched but is no longer directly imported by application code.

### Step 3.2 - Lazy DI Container Enhancement
Update `src/infrastructure/di/Container.ts`:
- Add `registerLazy()` method for deferred service instantiation
- Services only initialize when first resolved
- Reduce app startup time by not eagerly creating all repositories

### Step 3.3 - Route-Level Code Splitting
Update `src/App.tsx`:
- Wrap all AGIS phase pages (Phases 1-22) in `React.lazy()` + `Suspense`
- Wrap hardware control pages in lazy imports
- Wrap analysis/intelligence pages in lazy imports
- Keep core pages (Dashboard, Contacts, Settings) eagerly loaded

### Step 3.4 - Barrel Export Cleanup
Audit and fix all `index.ts` files across domains:
- Replace any `export *` with explicit named exports
- Remove unused re-exports
- Ensure no circular dependencies

---

## Phase 4: Performance and Reliability

### Step 4.1 - Edge Function Response Caching
Enhance `_shared/cache.ts`:
- Add cache key generation based on `userId + profileId + analysisType`
- Cache analysis results for 5 minutes (configurable per analysis type)
- Cache health check responses for 30 seconds

### Step 4.2 - Query Performance Optimization
- Add database indexes for most-queried columns on unified tables
- Create materialized views for dashboard aggregations
- Implement cursor-based pagination in repositories (replacing offset-based)

### Step 4.3 - Frontend Query Optimization
- Deduplicate `useQuery` keys across hooks
- Add `staleTime` and `gcTime` configuration per query type
- Implement query prefetching for likely next-page navigations

### Step 4.4 - Circuit Breaker v2 Integration
Update `src/lib/circuitBreaker.ts`:
- Map old function names to router names for circuit state consolidation
- A single router circuit breaker instead of 50 individual ones
- Expose router-level health status in the UI

---

## Phase 5: Migration and Cleanup

### Step 5.1 - Data Migration Scripts
Create SQL migration functions to copy data from legacy tables into unified stores:
- `migrate_analysis_tables()` -- 85 tables into `unified_analysis_store`
- `migrate_prediction_tables()` -- 40 tables into `unified_prediction_store`
- `migrate_event_tables()` -- 25 tables into `unified_event_log`

### Step 5.2 - Compatibility Views
Create SQL views that mirror the old table schemas but read from unified tables:
- `CREATE VIEW mice_assessments_v2 AS SELECT ... FROM unified_analysis_store WHERE analysis_type = 'mice_assessment'`
- One view per legacy table, enabling gradual frontend migration

### Step 5.3 - Deprecation Notices
- Add console warnings to all legacy function invocations via the adapter
- Mark old standalone edge functions with deprecation headers
- Set a 30-day grace period before deletion

### Step 5.4 - Legacy Function Cleanup
After 30-day monitoring:
- Delete standalone edge function directories that are now handled by routers
- Drop legacy tables that have been fully migrated to unified stores
- Remove compatibility views once all frontend code uses unified repositories

### Step 5.5 - Update Documentation
- Update `docs/EDGE_FUNCTION_CATALOG.md` with new router endpoints
- Update `docs/COMPLETE_SYSTEM_REFERENCE.md` with consolidated architecture
- Update `.lovable/plan.md` to mark all phases complete

---

## Implementation Sequence (Dependency-Ordered)

```text
Phase 2 (Routers):
  2.1  Edge Function Adapter       -- unblocks all router work
  2.2  Analysis Router             -- 94 intelligence tasks depend on this
  2.3  Intelligence Router         -- aggregation pipeline needs this
  2.4  Prediction Router           -- dossier generation uses predictions
  2.5  Warfare Router              -- AGIS phases 3-5 depend on this
  2.6  Biometric Router            -- media analysis pipeline needs this
  2.7  Network Router              -- graph visualization depends on this
  2.8  Enrichment Router           -- auto-enrich pipeline
  2.9  Fusion Router               -- fusion domain service
  2.10 AGIS Router                 -- phases 1-22
  2.11 Utility Router              -- encryption, alerts
  2.12 Hardware Router             -- device integration
  2.13 Voice Router                -- voice analysis
  2.14 Frontend invocation update  -- wire up adapter

Phase 3 (Frontend):
  3.1  Type modules                -- unblocks IDE performance
  3.2  Lazy DI container           -- reduces startup time
  3.3  Route code splitting        -- reduces bundle size
  3.4  Barrel export cleanup       -- prevents circular deps

Phase 4 (Performance):
  4.1  Edge caching                -- reduces redundant AI calls
  4.2  DB query optimization       -- faster dashboard loads
  4.3  Frontend query optimization -- fewer network requests
  4.4  Circuit breaker v2          -- router-level resilience

Phase 5 (Cleanup):
  5.1  Data migration scripts      -- populate unified tables
  5.2  Compatibility views         -- safe transition
  5.3  Deprecation notices         -- 30-day warning
  5.4  Legacy cleanup              -- delete old functions/tables
  5.5  Documentation update        -- reflect new architecture
```

---

## Expected Final State

| Metric | Before | After |
|--------|--------|-------|
| Edge Functions | 407 | ~25 routers + ~15 standalone |
| Database Tables | 587 | ~150 |
| Types File | 35,000 lines | ~8 modules of 2-4K lines each |
| Cold Start Time | 2-5s | 200-500ms |
| Deployment Time | 15+ min | 2-3 min |
| Frontend Bundle | Monolithic | Route-split with lazy loading |
| Auth Patterns | 8 variants | 1 unified pattern |
| CORS Definitions | 405 duplicates | 1 shared module |

---

## Risk Mitigations

1. **Zero-downtime migration**: The adapter layer allows old and new function names to work simultaneously
2. **Data safety**: Legacy tables kept for 30 days after migration; compatibility views provide read access
3. **Rollback capability**: Adapter can be switched to "bypass mode" to route directly to old functions
4. **Incremental deployment**: Each router is independent; can deploy one at a time
5. **Frontend stability**: The 94 intelligence task definitions in `useIntelligenceGeneration.ts` remain unchanged -- only the transport layer changes

## Next Implementation Step
Begin with **Step 2.1** (Edge Function Adapter) and **Step 2.2** (Analysis Router with first 10 handlers), as these have the highest number of dependents (94 intelligence tasks, 245 frontend files).
