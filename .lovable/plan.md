

# Codebase Feature Audit: Disconnections, Gaps & Enhancement Opportunities

## Scan Summary

Audited 80+ pages, 150+ hooks, 90+ edge functions, and the full navigation config. Found **3 categories** of issues: disconnected features (built but not wired), missing navigation entries, and orphaned hooks never consumed by any component.

---

## Category 1: Pages Routed but Missing from Navigation (3 pages)

These pages have routes in `App.tsx` but **no entry in `navigationConfig.ts`**, making them completely inaccessible to users unless they type the URL manually:

| Page | Route | Purpose |
|------|-------|---------|
| `PlatformConfiguration` | `/platform-config` | Platform-wide config management |
| `AgentIntelligenceConfig` | `/agent-intelligence` | AI agent workflow configuration |
| `DatabaseMaintenance` | `/maintenance` | Database cleanup & optimization |

**Fix**: Add navigation entries to `navigationConfig.ts` under the `system` category with appropriate role guards (admin-only).

---

## Category 2: Orphaned Hooks — Built but Never Used in Any Component (8 hooks)

These hooks exist in `src/hooks/` but have **zero imports from any `.tsx` component file**:

| Hook | Purpose | Lines |
|------|---------|-------|
| `useProactiveInsights` | AI-generated proactive suggestions | 170 |
| `usePsychologyAssessment` | Behavioral/psychological profiling | ~100 |
| `useCrossContactPatterns` | Cross-contact pattern detection | 110 |
| `useIntelligenceQueue` | Intelligence task queueing | ~80 |
| `useInteractionContext` | Interaction context tracking | ~60 |
| `useMeetingIntelligence` | Meeting preparation intelligence | ~100 |
| `useRFSignalIntelligence` | RF signal analysis | ~80 |
| `useThermalIntelligence` | Thermal imaging intelligence | ~80 |

**Fix**: Wire these into their natural host pages:
- `useProactiveInsights` → Dashboard (as a "Proactive Insights" dashlet widget)
- `usePsychologyAssessment` → PsychologyIntelligence page
- `useCrossContactPatterns` → ContactDetail page (patterns tab or sidebar)
- `useMeetingIntelligence` → Calendar page (meeting prep panel)
- `useRFSignalIntelligence` / `useThermalIntelligence` → HardwareCommand page (already has SDR/TSCM panels but missing RF & Thermal)

---

## Category 3: Dashboard Performance Issue

**File**: `src/pages/Dashboard.tsx` (line 60)

The dashboard stats query fetches **all profiles** (`select('id, is_favorite')`) to count them, hitting the 1000-row Supabase limit. Users with 1000+ contacts will see incorrect counts. Should use `{ count: 'exact', head: true }` pattern instead.

**Fix**: Refactor to use count-only queries:
```typescript
supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active', true)
```
And a separate query for favorites count.

---

## Category 4: Recommended Enhancements

### 4a. Dashboard Proactive Insights Widget
The `useProactiveInsights` hook is fully implemented (fetches from `proactive_insights` table, supports filtering, dismissal, snoozing) but has no UI. Adding a dashlet to the Dashboard would surface AI-generated recommendations to users — high business value.

### 4b. Meeting Prep Integration on Calendar
`useMeetingIntelligence` generates meeting briefs with talking points and relationship context. Wiring it into the Calendar page's event detail view would complete the meeting preparation workflow.

### 4c. Cross-Contact Pattern Detection on Contact Detail
`useCrossContactPatterns` detects shared behavioral patterns across contacts. Surfacing this on the ContactDetail page would help users discover hidden connections.

---

## Implementation Plan

### Batch 1: Add Missing Navigation Entries (1 file)
Add 3 entries to `navigationConfig.ts` for `/platform-config`, `/agent-intelligence`, `/maintenance` under the `system` category with `requiredRole: 'admin'`.

### Batch 2: Fix Dashboard Stats Performance (1 file)
Refactor Dashboard stats query to use `{ count: 'exact', head: true }` instead of fetching all rows.

### Batch 3: Wire Proactive Insights to Dashboard (2 files)
1. Create a `ProactiveInsightsDashlet` component
2. Register it in the dashlet registry

### Batch 4: Wire Orphaned Hooks to Host Pages (4 files)
1. Add `usePsychologyAssessment` call to PsychologyIntelligence page
2. Add `useCrossContactPatterns` panel to ContactDetail
3. Add `useMeetingIntelligence` prep card to Calendar page
4. Add RF Signal & Thermal panels to HardwareCommand page

Total: ~8 files, ~200 lines changed across 4 batches.

