
# Codebase Hardening & Hallucination-Elimination Plan

Based on your preferences, we will execute a **Full Codebase Sweep** with **Strict Lint Gates**, **Standardized Invocations**, and **Auto-generated Documentation**. 

Here is the comprehensive plan to eliminate AI hallucinations, fix technical debt, and ensure enterprise-grade reliability across the entire platform.

---

## 1. Auto-Generated Schema Documentation (Single Source of Truth)
To completely prevent the AI (and developers) from hallucinating database columns (e.g., `company` instead of `organization`), we will automate the documentation generation.
- **Script Creation**: Build a Node.js/Vite script (`scripts/generate-schema-docs.ts`) that directly parses `src/integrations/supabase/types.ts` and outputs a pristine, authoritative Markdown document.
- **Continuous Sync**: This ensures that `docs/SCHEMA_MAP.md` and `docs/DATABASE_SCHEMA.md` are dynamically generated, meaning they can never drift out of sync with the actual live database schema. 
- **Legacy Cleanup**: Mark the manually written versions as deprecated and point all AI prompts to the auto-generated file.

## 2. Strict Lint Gates (Compile-Time Enforcement)
We will update `eslint.config.js` to rigidly enforce architectural constraints using `@typescript-eslint/eslint-plugin` and `no-restricted-syntax`/`no-restricted-imports`:
- **Block Legacy Types Import**: Forbid `import type ... from '@/integrations/supabase/types'` entirely, enforcing `@/types/database-helpers` to drastically improve IDE performance.
- **Block Direct Function Calls**: Forbid `supabase.functions.invoke(...)`. All calls must use `invokeFunction(...)` from `@/lib/api`.
- **Block Unsafe Casts**: Warn/Error on the `(supabase as any)` pattern, enforcing proper typing.
- **Exception Whitelists**: Only the low-level adapter files (`invokeProxy.ts`, `database-helpers.ts`) will be permitted to bypass these rules via inline `eslint-disable`.

## 3. Full Codebase Invocation Standardization
With the proxy installed, leaving raw `invoke` calls is brittle and bypasses the type-safe routing adapter.
- **Global Find & Replace**: Migrate all ~1,915 instances of `supabase.functions.invoke('function-name')` across 244 files to use the standardized `invokeFunction('function-name')` adapter.
- **Auth Preservation**: We will safely handle the exceptions (such as service-role calls or calls with custom authorization headers) by keeping them on `supabase.functions.invoke`, properly documented.

## 4. Total Schema Normalization (The `company` vs `organization` bug)
The database uses `organization`, but legacy code heavily references `company`, causing silent data loss during imports and AI processing.
- **Data Capture & Import**: Update `BulkUploadDialog`, `ContactImport.tsx`, and `LinkedInCsvParser` to map data strictly to `organization`.
- **OSINT & Intelligence Tools**: Update `deepOsint.ts`, `actionIntelligence.ts`, and background scrapers to use `profileData.organization`.
- **UI Components**: Update all components (e.g., `CaptureCard`, grids, detail pages) to render and save `organization`.

## 5. Memory Leak & Race Condition Remediation
We identified hundreds of instances of potential memory leaks across timers, subscriptions, and event listeners. We will implement structural fixes:
- **Realtime Channels**: Audit all 588 `.subscribe()` instances. Ensure that `supabase.removeChannel(channel)` is correctly invoked in the exact `useEffect` cleanup block where the subscription was created.
- **Intervals & Timeouts**: Audit all 365 `setInterval` uses (such as in `AdaptiveVoiceRecorder`, `SystemHealthMonitor`). We will strictly enforce the `timerRef.current = setInterval(...)` pattern with a rigorous `clearInterval(timerRef.current)` on component unmount.
- **DOM Event Listeners**: Ensure all 301 `window.addEventListener` / `document.addEventListener` calls are cleanly matched with `removeEventListener` using stable handler references.

## 6. Type Safety & `any` Elimination
- We discovered over 500 instances of `(supabase as any).from(...)` (e.g., in `SupabaseDigitalTwinRepository.ts` and `AnomalyDetectionPanel`).
- **Fix**: We will inject the correct generated table types into `database-helpers.ts` (Phase 5/6 tables) so the Supabase client can be used with perfect type safety, eliminating the need for `any` casting and preventing future query hallucinations.

---

**Next Steps**: 
Once approved, we will switch to execution mode and apply these changes systematically across the codebase, prioritizing the auto-doc generation and strict lint rules first, followed by the mass refactoring.
