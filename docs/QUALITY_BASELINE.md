# Quality baseline — updated 2026-05-23 (Slices 21–25)

Snapshot of strict-TypeScript and ESLint counts. Use this file as a ratchet:
any future PR should reduce the totals, never raise them.

| Metric                  | Pre-Slice-15 | Slice 20 | Slice 25      |
| ---                     | ---:         | ---:     | ---:          |
| Strict-TS errors        | 421          | 380      | **325**       |
| ESLint errors           | 1            | 0        | **0**         |
| ESLint warnings         | 924          | (n/a)    | **618**       |
| God-components migrated | 1 of 5       | 5 of 5   | 5 of 5        |
| Pages off direct Supabase | n/a        | n/a      | 5 (24 to go)  |
Re-measure with:

```sh
bun run typecheck 2>&1 | grep -c "error TS"
bun run lint     2>&1 | tail -3
```

## TypeScript (strict mode on, `tsconfig.app.json`)

**Total errors: 421**

Top error codes (count, code, common cause):

| Count | Code   | Means |
|------:|--------|-------|
| 157   | TS2322 | Type assignment mismatch |
| 108   | TS2345 | Argument type doesn't match parameter |
|  49   | TS18047 | `'X' is possibly 'null'` |
|  35   | TS2769 | No overload matches this call |
|  31   | TS18048 | `'X' is possibly 'undefined'` |
|   9   | TS18049 | `'X' is possibly 'undefined' or 'null'` |
|   6   | TS2339 | Property does not exist on type |
|   5   | TS7053 | Element implicitly has 'any' type because of an index signature |
|   4   | TS2783 | Spread types may only be created from object types |

Hot files (count, path):

| Count | Path |
|------:|------|
| 28 | `src/components/reports/PDFDossierGenerator.tsx` |
| 18 | `src/components/reports/DesktopIntelligenceReport.tsx` |
| 14 | `src/hooks/useServerSideContacts.tsx` |
| 13 | `src/hooks/intelligence/useDarkWebIntelligence.ts` |
| 12 | `src/hooks/intelligence/useNarrativeControl.ts` |
| 10 | `src/hooks/intelligence/useMicroExpressionAnalysis.ts` |
| 10 | `src/components/contacts/BiometricIdentityPanel.tsx` |
|  9 | `src/components/intelligence/DocumentIntelligencePanel.tsx` |
|  7 | `src/hooks/usePersistentBulkSession.tsx` |
|  7 | `src/components/settings/NotificationPreferences.tsx` |

## ESLint

**1 error · 924 warnings**

The single error has been fixed (`tailwind.config.ts` converted to ESM import).
The 924 warnings break down as:

| Count | Rule | Notes |
|------:|------|-------|
| 388 | `no-restricted-syntax` | Direct `supabase.functions.invoke()` calls — should use `invokeFunction()` from `@/lib/api`. |
| 383 | `no-restricted-imports` | Mix of: direct `@/integrations/supabase/client` from components/pages (DDD backlog) and direct `@/integrations/supabase/types` imports. |
| 92  | `react-hooks/exhaustive-deps` | Missing or stale deps in hook arrays — real bugs hiding here. |
| 61  | `react-refresh/only-export-components` | Mixed exports in component files; dev-HMR warning, low impact. |

## react-hooks/exhaustive-deps triage

92 warnings across 57 files. Hot files (count, path):

| Count | Path |
|------:|------|
| 7 | `src/hooks/usePersistentBulkSession.tsx` |
| 5 | `src/components/import/WhatsAppImport.tsx` |
| 4 | `src/components/contacts/AlphabeticalSidebar.tsx` |
| 4 | `src/hooks/useOfflineCapture.ts` |
| 3 | `src/components/biometrics/VoiceEnrollmentDialog.tsx` |
| 3 | `src/components/capture/AdaptiveMediaCapture.tsx` |
| 3 | `src/components/capture/QuickMediaCapture.tsx` |
| 3 | `src/components/mobile/LiveFaceScanner.tsx` |

**Do not mass-add the missing deps.** A typical warning is "missing dep X"
where X is a sibling callback in the same component. Naively adding it
re-renders → re-creates X → re-fires the hook → infinite loop. Each one needs
per-case review: either (a) wrap X in `useCallback` so its identity is stable,
(b) inline X into the effect, or (c) add `eslint-disable-next-line` with a
rationale comment explaining why the dep is intentionally omitted.

## Suggested ratchet plan

1. **Sweep `no-restricted-syntax`** (388) via codemod that routes
   `supabase.functions.invoke()` → `invokeFunction()`. Mechanical, single pass.
2. **Knock down the top 10 TS files** (≈140 of 421 errors live there).
3. **Sweep `no-restricted-imports`** by completing the
   [DDD migration backlog](./MIGRATION_DDD_BACKLOG.md).
4. **Sweep `no-restricted-syntax`** by routing 388 `functions.invoke()` calls
   through `invokeFunction()`. Mechanical; could be a single codemod pass.
5. **`react-refresh`** last — cosmetic.
