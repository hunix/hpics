

# Deep Business Logic & Connectivity Audit

## Issues Found

### Issue 1: `ProfileService.changeStatus()` Does Nothing (Critical Business Logic Bug)

**File**: `src/domains/profile/services/ProfileService.ts` (line 256-258)

The method only publishes a `ProfileStatusChanged` event but **never actually updates the database**. The `archiveProfile` method calls it, meaning archiving a contact silently fails -- the profile stays active.

```typescript
// Current: event emitted, no DB update
async changeStatus(profileId: string, userId: string, newStatus: ProfileStatus): Promise<void> {
  await this.eventBus.publish(new ProfileStatusChanged(profileId, userId, 'active', newStatus));
}
```

**Fix**: Add actual database update before event emission. Also, the hardcoded `'active'` for `oldStatus` is wrong -- it should read the current status first.

### Issue 2: `ProfileService.deleteProfile()` Missing User Scope Check (Security)

**File**: `src/domains/profile/services/ProfileService.ts` (line 174-177)

`delete(profileId)` is called without verifying the profile belongs to the user. RLS may catch this, but the domain layer should enforce ownership.

**Fix**: Verify ownership with `findByIdForUser` before calling `delete`.

### Issue 3: `ProfileService.getProfilesByIds()` N+1 Query (Performance)

**File**: `src/domains/profile/services/ProfileService.ts` (lines 189-196)

Fetches each profile in a sequential loop. For 50 profiles, that's 50 separate database queries.

**Fix**: Add a `findByIds(ids, userId)` method to `IProfileRepository` and use an `.in('id', ids)` query.

### Issue 4: `ProfileService.getProfileSummary()` Fetches ALL Profiles (Performance)

**File**: `src/domains/profile/services/ProfileService.ts` (lines 286-313)

Loads every profile for a user into memory to compute counts. For users with thousands of contacts, this is extremely wasteful.

**Fix**: Create a dedicated RPC or use `count` queries with filters.

### Issue 5: `NetworkService.getNetworkSummary()` Triple-Fetches the Graph (Performance)

**File**: `src/domains/network/services/NetworkService.ts` (lines 194-196)

`getNetworkSummary` calls `getNetworkGraph` (1 fetch), then `analyzeNetwork` which internally calls `getNetworkGraph` again (2nd fetch). The `NetworkFacade.getFullAnalysis` method calls all three individually = 5+ graph fetches.

**Fix**: Pass the graph object into `analyzeNetwork` instead of re-fetching.

### Issue 6: `FusionService` Singleton Bypasses DI (Architecture)

**File**: `src/domains/fusion/services/FusionService.ts` (lines 574-582) and `src/domains/fusion/hooks/useFusionService.ts`

`getFusionService()` creates a `FusionService` **without** repositories. Meanwhile, bootstrap.ts registers a properly DI-injected version. Hooks call `getFusionService()` directly, getting the repository-less instance, causing all operations to fall through to the direct Supabase fallback path.

**Fix**: Hooks should resolve from the DI container, not the singleton getter.

### Issue 7: `WarfareService` Uses Custom Event System Instead of Shared EventBus (Architecture Inconsistency)

**File**: `src/domains/warfare/services/WarfareService.ts` (lines 38-56)

All other domain services use `getEventBus()`. WarfareService uses its own `eventHandlers[]` array. Events emitted here are invisible to the rest of the system (no cross-domain event propagation).

**Fix**: Replace the custom event system with the shared `IEventBus` pattern used by ProfileService and FusionService.

### Issue 8: `SessionTimeoutWarning` Ref Forwarding Issue (Console Error)

**File**: `src/components/reliability/SessionTimeoutWarning.tsx`

Console shows: "Function components cannot be given refs." The component uses `forwardRef` and passes `ref` to `AlertDialogContent`, but `AlertDialogContent` may not accept a ref directly. The `ref` should go on a wrapping `<div>` or be removed.

**Fix**: Remove the `forwardRef` wrapper since `AlertDialogContent` is likely already a forwarded component from Radix, and the parent shouldn't be passing a ref.

### Issue 9: 16 Files Still Use `catch (error: any)` Without Guards

**Files**: `AnalysisExport.tsx`, `CalendarSyncSettings.tsx`, `GmailImportWizard.tsx`, `IdentityDocumentsManager.tsx`, `DataRetentionSettings.tsx`, `ShadowNetworkGraph.tsx`, `RomanticIntelligencePanel.tsx`, `InfluenceProfilePanel.tsx`, `CronJobManager.tsx`, `ActionScheduler.tsx`, `MosaicPreview.tsx`, `AnalyticsExport.tsx`, `EducationBulkImport.tsx`, `StrategyBuilderWidget.tsx`, `useAnalysisSession.tsx`, `MosaicPreview.tsx`

Each accesses `error.message` without `instanceof Error` guard.

**Fix**: Apply the standard pattern across all 16 files.

### Issue 10: `bootstrap.ts` Uses `require()` for FusionService (Build Risk)

**File**: `src/infrastructure/di/bootstrap.ts` (line 63)

```typescript
return new (require('@/domains/fusion/services/FusionService').FusionService)(fusionRepo, twinRepo);
```

Vite does not support `require()` in production builds. This works in dev due to the Vite dev server's compatibility shim, but may fail in production.

**Fix**: Use the already-imported `FusionService` from the top of the file (line 10 imports `getFusionService`), or import the class directly.

---

## Implementation Plan

### Batch 1: Critical Business Logic (3 files)
1. **Fix `changeStatus()`** -- add DB update via repository, read current status first
2. **Fix `deleteProfile()`** -- add user ownership check before delete
3. **Fix `SessionTimeoutWarning`** -- remove unnecessary `forwardRef`

### Batch 2: Performance (3 files)  
4. **Fix `getProfilesByIds()`** -- add batch query to repository
5. **Fix `NetworkService` triple-fetch** -- accept pre-fetched graph in `analyzeNetwork`
6. **Fix `getProfileSummary()`** -- use count queries instead of loading all profiles

### Batch 3: Architecture & DI (3 files)
7. **Fix `FusionService` singleton** -- remove `getFusionService()`, resolve from DI container in hooks
8. **Fix `WarfareService` event system** -- use shared `IEventBus`
9. **Fix `bootstrap.ts` `require()`** -- use static import

### Batch 4: Error Handling Hardening (16 files)
10. Replace `catch (error: any)` with `instanceof Error` guards across remaining 16 component files

Total: ~25 files, ~200 lines changed across 4 batches.

