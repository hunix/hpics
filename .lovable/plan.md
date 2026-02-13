
# Phase 2-5: Complete System Consolidation Implementation Plan

## Current Status
- Phase 0 (Foundation Utilities): ✅ COMPLETE
- Phase 1 (Database Schema Consolidation): ✅ COMPLETE
- Phase 2 (Domain Router Architecture): ✅ COMPLETE
  - 2.1 Edge Function Adapter: ✅ COMPLETE
  - 2.2-2.15 All 15 Domain Routers: ✅ COMPLETE (350+ routes)
- Phase 3 (Frontend Architecture): ✅ COMPLETE
  - 3.1 Domain-specific type modules: ✅ COMPLETE
  - 3.2 Lazy DI Container: ✅ COMPLETE
  - 3.3 Route-level code splitting: ✅ COMPLETE (all pages use lazyWithRetry)
  - 3.4 Barrel export cleanup: ✅ COMPLETE (warfare, renderers fixed)
  - 3.5 Frontend invocation layer: ✅ COMPLETE (useIntelligenceGeneration wired to invokeFunction)
- Phase 4 (Performance & Reliability): ✅ COMPLETE
  - 4.1 Router-level circuit breakers (`src/lib/api/routerCircuitBreaker.ts`): ✅ COMPLETE
  - 4.2 DB performance indexes (9 indexes on unified tables): ✅ COMPLETE
  - 4.3 Query key factory & stale time presets (`src/lib/api/queryDefaults.ts`): ✅ COMPLETE
  - 4.4 API layer barrel export (`src/lib/api/index.ts`): ✅ COMPLETE
- Phase 5 (Migration & Cleanup): ✅ COMPLETE
  - 5.1 Data migration functions (`migrate_legacy_analysis`, `run_analysis_migration`): ✅ COMPLETE
  - 5.2 Compatibility views (5 views: v_mice_assessments, v_behavioral_predictions, v_network_analyses, v_biometric_templates, v_audit_trail): ✅ COMPLETE
  - 5.3 Deprecation notices in adapter: ✅ COMPLETE
  - 5.4 Legacy cleanup: DEFERRED (30-day grace period until 2026-03-15)
  - 5.5 Documentation: ✅ COMPLETE (this file)

## Architecture Summary

### Edge Function Routing
- **Adapter**: `src/lib/api/edgeFunctionRouter.ts` maps 350+ legacy function names to 15 domain routers
- **Routers**: analysis, intelligence, prediction, warfare, biometric, network, enrichment, fusion, agis, utility, hardware, voice, document, security
- **Circuit Breakers**: Router-level breakers in `src/lib/api/routerCircuitBreaker.ts` (15 breakers vs 407)

### Database
- **Unified Tables**: `unified_analysis_store`, `unified_prediction_store`, `unified_event_log`
- **Performance Indexes**: 9 composite/partial indexes on unified tables
- **Compatibility Views**: 5 SECURITY INVOKER views for legacy read access
- **Migration Functions**: `migrate_legacy_analysis()` and `run_analysis_migration()` for batch data migration

### Frontend
- **Type Modules**: `src/types/database/` (unified.ts, index.ts)
- **Query Config**: `src/lib/api/queryDefaults.ts` (stale time presets, query key factories)
- **DI Container**: Lazy registration support via `registerLazy()`

## Pending Actions (Post Grace Period)
1. Delete standalone edge function directories after 2026-03-15
2. Drop legacy tables after confirming all data migrated
3. Remove compatibility views after frontend fully uses unified repositories
