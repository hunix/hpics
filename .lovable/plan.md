
# Fix: Correct Section and Task Counts to Actual Values

## Problem Identified

The hardcoded section and task counts we just updated are **INCORRECT**. I mistakenly used 161 sections and 85 tasks based on outdated documentation, but the actual counts in the codebase are:

| Metric | What I Set | Actual Value | Difference |
|--------|------------|--------------|------------|
| Sections | 161 | **124** | -37 sections |
| Tasks | 85 | **94** | +9 tasks |

The user is seeing 121/122 in the UI because `DEFAULT_SECTIONS.length` correctly returns **124**, and one section (`timeline`) has `enabled: false` by default, leaving 121-123 enabled depending on template.

## Verified Counts

### Sections (from `sectionDefinitions.ts`)

| Category | Lines | Count |
|----------|-------|-------|
| Core | 17-23 | 7 |
| Intelligence | 26-36 | 11 |
| Warfare | 39-72 | 34 |
| Analysis | 75-82 | 8 |
| Data Fusion | 85-98 | 14 |
| v6.0 Advanced | 101-105 | 5 |
| v7.0 Extreme | 108-119 | 12 |
| v8.0 Counter-Intel | 122-129 | 8 |
| v8.0 Psych Warfare | 132-141 | 10 |
| v8.0 Biometric/Network | 144-151 | 8 |
| v8.0 Doctrine/Advanced | 154-160 | 7 |
| **TOTAL** | | **124** |

### Tasks (from `useIntelligenceGeneration.ts`)

| Priority | Category | Lines | Count |
|----------|----------|-------|-------|
| 1 | Core Intelligence | 122-126 | 5 |
| 2 | Psychological Operations | 129-134 | 6 |
| 3 | Advanced Warfare | 137-142 | 6 |
| 4 | Network Intelligence | 145-148 | 4 |
| 5 | Temporal & Quantum | 151-154 | 4 |
| 6 | Fusion Intelligence | 157-161 | 5 |
| 7 | Defense Operations (v5.0) | 164-173 | 10 |
| 8 | Advanced Fusion (v5.0) | 176-179 | 4 |
| 9 | v6.0 Advanced Intelligence | 182-186 | 5 |
| 10 | v7.0 Extreme Intelligence | 189-200 | 12 |
| 11 | v8.0 Counter-Intelligence | 203-210 | 8 |
| 12 | v8.0 Psychological Warfare | 213-222 | 10 |
| 13 | v8.0 Biometric & Network | 225-232 | 8 |
| 14 | v8.0 Doctrine & Advanced | 235-241 | 7 |
| **TOTAL** | | | **94** |

## Files to Update

### 1. `src/components/reports/PDFDossierGenerator.tsx`

| Line | Current (Wrong) | Corrected |
|------|-----------------|-----------|
| 50 | `v6.0 - 161 Sections, 85 Tasks` | `v8.0 - 124 Sections, 94 Tasks` |
| 157 | `session?.totalTasks \|\| 85` | `session?.totalTasks \|\| 94` |
| 460 | `v6.0 \| 161 Sections \| 85 Tasks` | `v8.0 \| 124 Sections \| 94 Tasks` |
| 464 | `161-section dossiers` | `124-section dossiers` |
| 506 | `All 161 Sections` | `All 124 Sections` |

### 2. `src/components/reports/utils/pdfDesignSystem.ts`

| Line | Current (Wrong) | Corrected |
|------|-----------------|-----------|
| ~6 | `all 161 sections` | `all 124 sections` |
| ~19 | `all 161 sections` | `all 124 sections` |

### 3. `src/components/dossier-preview/DossierLoadingScreen.tsx`

| Line | Current (Wrong) | Corrected |
|------|-----------------|-----------|
| ~116 | `up to 161 sections` | `up to 124 sections` |

### 4. `src/components/reports/hooks/useIntelligenceGeneration.ts`

| Line | Current (Wrong) | Corrected |
|------|-----------------|-----------|
| 5-6 | `(85 total tasks)` / `85 tasks` | `(94 total tasks)` / `94 tasks` |
| 118 | `(85 tasks)` | `(94 tasks)` |

### 5. `src/components/reports/sections/renderers/index.ts`

| Line | Current (Wrong) | Corrected |
|------|-----------------|-----------|
| 4 | `137 sections across 6 categories` | `124 sections across 6 categories` |
| 27-28 | `all 137 section renderers` | `all 124 section renderers` |

### 6. `src/lib/appVersion.ts`

| Change | Value |
|--------|-------|
| `APP_VERSION` | `3.9.53` (bump from 3.9.52) |
| `FORCE_CLEAR_VERSIONS` | Add `3.9.52` |
| Changelog | Update to reflect corrected counts |

## Future-Proofing Recommendation

Add computed constants to eliminate drift:

```typescript
// In sectionDefinitions.ts
export const TOTAL_SECTIONS = DEFAULT_SECTIONS.length; // 124

// In useIntelligenceGeneration.ts
export const TOTAL_TASKS = ALL_INTELLIGENCE_TASKS.length; // 94
```

Then reference these constants throughout the codebase instead of hardcoded values. This change is optional but recommended.

## Implementation Order

1. Fix `useIntelligenceGeneration.ts` (task count: 85 → 94)
2. Fix `PDFDossierGenerator.tsx` (5 locations)
3. Fix `pdfDesignSystem.ts` (2 locations)
4. Fix `DossierLoadingScreen.tsx` (1 location)
5. Fix `renderers/index.ts` (2 locations)
6. Bump version to `3.9.53` in `appVersion.ts`

## Expected Outcome

- UI will accurately display **124 Sections | 94 Tasks**
- Template selector shows "All 124 Sections"
- Loading tips reference correct counts
- Users see accurate progress indicators
