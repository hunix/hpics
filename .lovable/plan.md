
# Update Hardcoded Section and Task Counts to Accurate Values

## Summary

The codebase has grown significantly with v6.0, v7.0, and v8.0 intelligence engines, but the UI still displays outdated counts (74 sections, 40 tasks). This plan updates all hardcoded values to reflect the actual counts:

- **Actual Tasks**: 85 (counted from `ALL_INTELLIGENCE_TASKS` array in `useIntelligenceGeneration.ts`)
- **Actual Sections**: 161 (counted from `DEFAULT_SECTIONS` array in `sectionDefinitions.ts`)

## Technical Details

### Verified Counts

**Tasks** (`src/components/reports/hooks/useIntelligenceGeneration.ts`):
- Lines 119-241: `ALL_INTELLIGENCE_TASKS` array contains 85 task definitions across 14 priority groups
- Priority 1-6: 30 original tasks
- Priority 7 (v5.0 Defense): 10 tasks  
- Priority 8 (v5.0 Fusion): 4 tasks
- Priority 9 (v6.0): 5 tasks
- Priority 10 (v7.0): 12 tasks
- Priority 11 (v8.0 Counter-Intel): 8 tasks
- Priority 12 (v8.0 Psych Warfare): 10 tasks
- Priority 13 (v8.0 Biometric): 8 tasks
- Priority 14 (v8.0 Doctrine): 7 tasks
- **Total: 85 tasks**

**Sections** (`src/components/reports/sections/sectionDefinitions.ts`):
- Lines 15-161: `DEFAULT_SECTIONS` array contains 161 section definitions
- Core: 7 sections
- Intelligence: 11 sections
- Warfare: 35 sections (including v5.0 Defense Operations)
- Analysis: 28 sections (including v5.0, v6.0, v7.0 additions)
- v8.0 Counter-Intelligence: 8 sections
- v8.0 Psychological Warfare: 10 sections
- v8.0 Biometric & Network: 8 sections
- v8.0 Doctrine & Advanced: 8 sections
- **Total: 161 sections**

## Files to Modify

### 1. `src/components/reports/PDFDossierGenerator.tsx`

| Line | Current | Updated |
|------|---------|---------|
| 50 | `v5.2.1 - 74 Sections, 40 Tasks` | `v6.0 - 161 Sections, 85 Tasks` |
| 157 | `session?.totalTasks \|\| 40` | `session?.totalTasks \|\| 85` |
| 460 | `v5.2 \| 74 Sections \| 40 Tasks` | `v6.0 \| 161 Sections \| 85 Tasks` |
| 464 | `74-section dossiers` | `161-section dossiers` |
| 506 | `All 74 Sections` | `All 161 Sections` |

### 2. `src/components/reports/utils/pdfDesignSystem.ts`

| Line | Current | Updated |
|------|---------|---------|
| 6 | `all 74 sections` | `all 161 sections` |
| 19 | `all 74 sections` | `all 161 sections` |

### 3. `src/components/dossier-preview/DossierLoadingScreen.tsx`

| Line | Current | Updated |
|------|---------|---------|
| 116 | `up to 74 sections` | `up to 161 sections` |

### 4. `src/components/reports/hooks/useIntelligenceGeneration.ts`

| Line | Current | Updated |
|------|---------|---------|
| 5 | `(49 total tasks)` | `(85 total tasks)` |
| 6 | `40 tasks` | `85 tasks` |
| 118 | `(40 tasks)` | `(85 tasks)` |

### 5. `src/lib/appVersion.ts` (Version Bump)

| Line | Current | Updated |
|------|---------|---------|
| 66 | `'3.9.51'` | `'3.9.52'` |
| 70 | Add to array | `'3.9.51'` added to `FORCE_CLEAR_VERSIONS` |

Add new changelog entry:
```
* v3.9.52: Section & Task Count Update
*          - Updated all hardcoded counts to reflect current totals
*          - 161 dossier sections (was 74)
*          - 85 intelligence tasks (was 40)
*          - Added v6.0, v7.0, v8.0 engine references
```

## Additional Recommendations

### Create Constants (Future-Proofing)

To prevent future mismatches, add computed constants at the top of relevant files:

```typescript
// In sectionDefinitions.ts
export const TOTAL_SECTIONS = DEFAULT_SECTIONS.length;

// In useIntelligenceGeneration.ts  
export const TOTAL_TASKS = ALL_INTELLIGENCE_TASKS.length;
```

Then reference these constants instead of hardcoded numbers. This will be noted in code comments but implementing dynamic references is optional for this change.

## Implementation Order

1. Update `useIntelligenceGeneration.ts` (source of truth for tasks)
2. Update `sectionDefinitions.ts` comments if needed
3. Update `PDFDossierGenerator.tsx` (5 locations)
4. Update `pdfDesignSystem.ts` (2 locations)
5. Update `DossierLoadingScreen.tsx` (1 location)
6. Bump version in `appVersion.ts` to `3.9.52`
7. Add `3.9.51` to `FORCE_CLEAR_VERSIONS` array

## Expected Outcome

After implementation:
- UI will display accurate "161 Sections | 85 Tasks" badge
- Select dropdown will show "All 161 Sections" for full package
- Loading screen will reference "161 sections"
- Console logs will show correct version info
- Cache will be force-cleared for all users on next load
