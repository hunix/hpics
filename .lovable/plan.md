
# Unified PDF Export System Overhaul

## Problem Analysis

The current dossier PDF export suffers from three major issues:

### Issue 1: Inconsistent Visual Styling
- **Header Colors**: Each section uses different colors - some use `PDF_DESIGN.colors.xxx` (the standard), while others use hardcoded RGB arrays like `[150, 100, 50]`, `[102, 51, 102]`, `[50, 100, 150]`, etc.
- **Section Structure**: Some sections have background boxes, others don't. Font sizes and spacing vary randomly.
- **Example**: `renderMICE` uses `PDF_DESIGN.colors.warfare`, but `renderPsychologicalProfile` uses `[102, 51, 102]`, and `renderRelationshipEcosystem` uses `[150, 100, 50]`.

### Issue 2: Empty/White Pages
- The `checkSectionHasData()` function reports data exists (enabling the section)
- The renderer starts a new page, then does an internal `if (!rawData) return;` check
- This creates a blank page with no content
- Root cause: Mismatch between `checkSectionHasData()` (permissive) and renderer checks (strict)

### Issue 3: Data Extraction Failures
- The `extractResult()` function looks for a `.result` field in analysis records
- Some analyses store data at the root level, others in `.result`
- When extraction fails, sections render empty even though data exists

---

## Solution Design

### Part 1: Standardized Category Color System

Replace all hardcoded colors with category-based colors from `PDF_DESIGN.colors`:

```text
Category Colors:
┌──────────────┬─────────────────┬────────────────────┐
│ Category     │ Color Token     │ RGB Value          │
├──────────────┼─────────────────┼────────────────────┤
│ Core         │ PDF_DESIGN.colors.core       │ [50, 50, 50]       │
│ Intelligence │ PDF_DESIGN.colors.intelligence │ [0, 51, 102]      │
│ Warfare      │ PDF_DESIGN.colors.warfare    │ [128, 0, 0]        │
│ Analysis     │ PDF_DESIGN.colors.analysis   │ [0, 80, 120]       │
│ Fusion       │ PDF_DESIGN.colors.fusion     │ [75, 0, 130]       │
└──────────────┴─────────────────┴────────────────────┘
```

### Part 2: Unified Section Renderer Template

Every section renderer will follow this standardized structure:

```typescript
export const renderSectionName: SectionRenderer = (ctx, data) => {
  // 1. Data extraction (unified pattern)
  const rawData = getAnalysisForSection(data, 'sectionKey')
    || data.specificDataField;
  
  // 2. Extract result (handles both nested and flat structures)
  const result = extractResultSafe(rawData);
  
  // 3. Check if we have meaningful content
  if (!hasRenderableContent(result)) return;
  
  // 4. Render header with CATEGORY COLOR (not random RGB)
  const category = getSectionCategory('sectionId');
  ctx.renderSectionHeader('Section Title', getCategoryColor(category));
  
  // 5. Content box with standardized styling
  renderContentBox(ctx, () => {
    // Render metrics, bullets, etc.
  });
  
  // 6. Standard spacing
  ctx.yPos += PDF_DESIGN.section.spacing;
};
```

### Part 3: Enhanced Data Extraction

Update `extractResult()` to be more robust:

```typescript
export function extractResultSafe(record: unknown): Record<string, unknown> {
  if (!record || typeof record !== 'object') return {};
  const obj = record as Record<string, unknown>;
  
  // Priority 1: Direct result field
  if (obj.result && typeof obj.result === 'object') {
    return obj.result as Record<string, unknown>;
  }
  
  // Priority 2: Data field (some analyses use this)
  if (obj.data && typeof obj.data === 'object') {
    return obj.data as Record<string, unknown>;
  }
  
  // Priority 3: Return the record itself (flat structure)
  return obj;
}
```

### Part 4: Eliminate Blank Pages

Add a pre-render content check to prevent blank pages:

```typescript
// In PDFDossierGenerator.tsx render loop
for (const section of enabledSections) {
  const renderer = allSectionRenderers[section.id];
  if (!renderer) continue;
  
  // v4.0: Validate data BEFORE adding page
  const hasActualContent = validateSectionContent(section.id, allData);
  if (!hasActualContent) {
    renderAudit.push({ sectionId: section.id, status: 'skipped_no_content' });
    continue;
  }
  
  // Now safe to add page
  doc.addPage();
  renderer(context, allData);
}
```

---

## Implementation Plan

### Step 1: Create Unified PDF Design Utilities
**File**: `src/components/reports/utils/pdfDesignSystem.ts`

- Export `getCategoryColor(category: string)` function
- Export `getSectionCategory(sectionId: string)` lookup
- Export standardized content box renderer
- Export improved `extractResultSafe()` function

### Step 2: Refactor CoreSectionRenderers.ts
- Replace all hardcoded RGB colors with `getCategoryColor()`
- Standardize box backgrounds and spacing
- Use unified content extraction

### Step 3: Refactor IntelligenceSectionRenderers.ts
- Same standardization: category colors, unified structure
- Fix ~16 renderers using random RGB values

### Step 4: Refactor WarfareSectionRenderers.ts
- Largest file (~965 lines), ~28 renderers need color standardization
- Replace `[139, 69, 19]`, `[220, 20, 60]`, `[100, 0, 80]`, etc.

### Step 5: Refactor FusionSectionRenderers.ts & AnalysisSectionRenderers.ts
- ~12 fusion + ~9 analysis renderers
- Same pattern: category colors, unified boxes

### Step 6: Fix Blank Page Issue in PDFDossierGenerator.tsx
- Add `validateSectionContent()` pre-check
- Only call `doc.addPage()` if content will be rendered

### Step 7: Update checkSectionHasData() Logic
- Make it stricter to match actual renderer requirements
- Reduce false positives that lead to blank sections

---

## Technical Details

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/reports/utils/pdfDesignSystem.ts` | **NEW** - Centralized design utilities |
| `src/components/reports/sections/renderers/CoreSectionRenderers.ts` | Standardize 9 renderers |
| `src/components/reports/sections/renderers/IntelligenceSectionRenderers.ts` | Standardize 16 renderers |
| `src/components/reports/sections/renderers/WarfareSectionRenderers.ts` | Standardize 28 renderers |
| `src/components/reports/sections/renderers/FusionSectionRenderers.ts` | Standardize 12 renderers |
| `src/components/reports/sections/renderers/AnalysisSectionRenderers.ts` | Standardize 9 renderers |
| `src/components/reports/PDFDossierGenerator.tsx` | Add blank page prevention |
| `src/components/reports/utils/sectionDataCheck.ts` | Improve data detection accuracy |
| `src/components/reports/hooks/usePDFGeneration.ts` | Add helper for content boxes |

### Expected Outcome

After implementation:
- **Consistent Headers**: All sections use category-appropriate colors
- **Zero Blank Pages**: Pre-validation prevents empty page creation
- **Uniform Styling**: All sections follow the same visual structure
- **Better Data Mapping**: Improved extraction handles various data formats
- **Professional Output**: Clean, cohesive intelligence dossier

### Color Standardization Examples

Before:
```typescript
// Random colors across files
ctx.renderSectionHeader('MICE Vulnerability', PDF_DESIGN.colors.warfare);
ctx.renderSectionHeader('Psychological Profile', [102, 51, 102]);
ctx.renderSectionHeader('Relationship Ecosystem', [150, 100, 50]);
ctx.renderSectionHeader('Temporal Fusion', [50, 100, 150]);
```

After:
```typescript
// All using category system
ctx.renderSectionHeader('MICE Vulnerability', getCategoryColor('warfare'));
ctx.renderSectionHeader('Psychological Profile', getCategoryColor('intelligence'));
ctx.renderSectionHeader('Relationship Ecosystem', getCategoryColor('core'));
ctx.renderSectionHeader('Temporal Fusion', getCategoryColor('fusion'));
```

---

## Summary

This overhaul will:
1. Create a centralized design system for consistent PDF styling
2. Eliminate the ~40+ different hardcoded RGB color values
3. Prevent blank pages by adding content validation before page creation
4. Improve data extraction to handle various storage formats
5. Deliver a professional, unified intelligence dossier export
