# DDD migration backlog

This file tracks the move of direct `@/integrations/supabase/client` imports out
of `src/components/**` and `src/pages/**` and into hooks (or domain hooks).
The ESLint rule in `eslint.config.js` warns on every remaining call site so the
backlog surfaces in CI.

## Rule
- `src/components/**` and `src/pages/**` must not import the Supabase client.
- Data access lives in a hook under `src/hooks/<domain>/...` or
  `src/domains/<domain>/hooks/`.
- Mutation hooks own their `queryClient.invalidateQueries` calls so callers
  don't repeat them.

## Worked example
`src/components/intelligence/DocumentIntelligencePanel.tsx` →
`src/hooks/intelligence/useDocumentIntelligence.ts`. Component dropped from 591
to 433 lines; 3 queries + 3 mutations now testable in isolation.

## Counts (snapshot 2026-05-22)

Total legacy files: **348**

Pages: 30 files (one per page, almost always a single page-level query).

Components by area:
| Area | Files |
| --- | --- |
| components/intelligence | 77 |
| components/contacts | 62 |
| components/ai | 24 |
| components/settings | 22 |
| components/capture | 13 |
| components/import | 13 |
| components/dashboard | 11 |
| components/mobile | 9 |
| components/reports | 9 |
| components/command | 8 |
| components/biometrics | 7 |
| components/analysis | 7 |
| components/network | 6 |
| components/warfare | 6 |
| components/collaboration | 5 |
| components/security | 4 |
| components/devices | 4 |
| components/uploads | 4 |
| ...other 1-3 each | ~22 |

## Suggested batch order
1. **Pages first** (30 files). Each is a single page-level query — easy wins,
   no cross-component coordination.
2. **components/contacts** (62) — high traffic, well-bounded.
3. **components/intelligence** (77) — largest area; do god-components first
   (NetworkGraphMLPanel, CostAnalyticsDashboard, ContactAIAgent,
   IntelligenceAlertManager).
4. **components/ai, settings, capture, import** (72) — middle weight.
5. **Long tail** (~50) — squash as encountered.

## Definition of done per file
- Component no longer imports `@/integrations/supabase/client`.
- A hook (new or existing) owns the query / mutation.
- Query keys live alongside the hook.
- `bun run lint` produces no new warnings for the file.
- The component renders the same data with no visual regression.
