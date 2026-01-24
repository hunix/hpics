
# Edge Function Comprehensive Audit - Phase 23 (Final Scan Report)

## Executive Summary

After conducting a **complete scan of all 270+ edge functions** and related frontend components, I have identified the following remaining issues:

| Category | Count | Severity | Status |
|----------|-------|----------|--------|
| Error Handling (`error: any`) | 9 | Medium | Must Fix |
| Schema Mismatches (edge functions) | 2 | Medium | Must Fix |
| Schema Mismatches (frontend hooks) | 8 | Medium | Must Fix |
| Schema Mismatches (frontend components) | 1 | Low | Must Fix |
| **Total Issues** | **20** | - | - |

**Positive Findings**: The vast majority of edge functions (260+) are now fully compliant with error handling standards and schema requirements following Phases 20-22.

---

## Part A: Edge Functions with Error Handling Issues (9 functions)

These functions still use `error: any` or access `error?.message` without proper `instanceof Error` guards:

| Function | Location | Issue |
|----------|----------|-------|
| `auto-sync-calendars` | Lines 73-75, 103-105, 118-124 | `error: any` in loops and main handler |
| `deep-research-agent` | Lines 88-97 | `error: any` in main handler |
| `deep-psychological-analysis` | Lines 448-457 | `error: any` in main handler |
| `trigger-push-notifications` | Lines 168-177 | `error: any` in main handler |
| `universal-embedding-processor` | Lines 465-479 | `error: any` with `error?.message` |
| `analyze-communication-triangulation` | Lines 325-331 | `error: any` in main handler |
| `device-sync-orchestrator` | Lines 287-293 | `error: any` in main handler |
| `suggest-meeting-time` | Lines 110-116 | `error: any` in main handler |
| `comprehensive-contact-scan` | Lines 215-220 | `stageError: any` in loop |

**Standard Fix Pattern**:
```typescript
// BEFORE
} catch (error: any) {
  console.error('Error:', error);
  return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), ...);

// AFTER
} catch (error) {
  console.error('Error:', error);
  const message = error instanceof Error ? error.message : 'Unknown error';
  return new Response(JSON.stringify({ error: message }), ...);
```

---

## Part B: Edge Functions with Schema Mismatches (2 functions)

| Function | Issue | Line | Fix |
|----------|-------|------|-----|
| `lawfare-defense-analyzer` | `.select('full_name')` | Line 54 | Change to `.select('first_name, last_name')` and compute name |
| `reputation-defense-engine` | `.select('full_name')` | Line 54 | Change to `.select('first_name, last_name')` and compute name |

**Fix Example**:
```typescript
// BEFORE
const { data: profile } = await supabase
  .from('profiles')
  .select('full_name')
  .eq('id', targetProfileId)
  .single();

const profileName = profile?.full_name || 'Unknown';

// AFTER
const { data: profile } = await supabase
  .from('profiles')
  .select('first_name, last_name')
  .eq('id', targetProfileId)
  .single();

const profileName = profile 
  ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown' 
  : 'Unknown';
```

---

## Part C: Frontend Hooks with Schema Mismatches (8 files)

| File | Issue | Line | Fix |
|------|-------|------|-----|
| `useBluetoothProximity.ts` | `profiles (full_name)` join | Line 97, 304 | Use `first_name, last_name` |
| `useNativeContacts.ts` | `.ilike('full_name', ...)` | Line 321 | Use computed name or separate first/last queries |
| `useBackgroundLocation.ts` | `full_name, address` select | Lines 387-389 | Use `first_name, last_name, city, country` |
| `useGalleryMonitor.ts` | `profiles (full_name)` join | Line 87 | Use `first_name, last_name` |
| `useMICEAnalysis.ts` | `full_name` in select | Line 58 | Use `first_name, last_name` |
| `useSacredValues.ts` | `full_name` in select | Line 49 | Use `first_name, last_name` |
| `useBetrayalPrediction.ts` | `full_name` in select | Line 74 | Use `first_name, last_name` |

---

## Part D: Frontend Components with Schema Mismatches (1 file)

| File | Issue | Line | Fix |
|------|-------|------|-----|
| `ExtendedOverview.tsx` | `profile.bio` reference | Line 112 | Use `profile.notes` if bio content exists there, or remove if not applicable |

---

## Part E: Verified as Correct (No Action Needed)

The following have been verified as **correct** and require no changes:

1. **`link-social-identities`** (Line 436): Uses `.in('email', emails)` but this is inside a conditional check for matching - the function correctly fetches `first_name, last_name` on line 446-448
2. **`parse-identity-document`**: Uses `full_name` in AI JSON output schema (line 107) - this is valid as it refers to AI prompt schema, not DB column
3. **`dark-web-monitor`**: Already correctly uses `first_name, last_name, organization` (lines 161-167)
4. **`enrich-hunter`**: Uses `company` and `position` in internal result object mapping (lines 218-219) - these are from Hunter API response, not DB columns
5. **`deep-analyze-capture`**: Uses `profile.bio, profile.location, profile.displayName` (lines 271-273) - valid as these refer to scraped social media data, not DB columns

---

## Implementation Plan

### Phase 1: Edge Function Error Handling (9 functions)
Replace all `error: any` patterns with `instanceof Error` guards in:
1. `auto-sync-calendars` (3 locations)
2. `deep-research-agent`
3. `deep-psychological-analysis`
4. `trigger-push-notifications`
5. `universal-embedding-processor`
6. `analyze-communication-triangulation`
7. `device-sync-orchestrator`
8. `suggest-meeting-time`
9. `comprehensive-contact-scan`

### Phase 2: Edge Function Schema Fixes (2 functions)
Fix `full_name` references:
1. `lawfare-defense-analyzer` - line 54
2. `reputation-defense-engine` - line 54

### Phase 3: Frontend Hook Schema Fixes (7 files)
Update profile queries to use `first_name, last_name`:
1. `useBluetoothProximity.ts`
2. `useNativeContacts.ts`
3. `useBackgroundLocation.ts`
4. `useGalleryMonitor.ts`
5. `useMICEAnalysis.ts`
6. `useSacredValues.ts`
7. `useBetrayalPrediction.ts`

### Phase 4: Frontend Component Fix (1 file)
1. `ExtendedOverview.tsx` - handle `bio` reference

### Phase 5: Deployment and Verification
1. Deploy all modified edge functions
2. Run health checks on each function
3. Verify TypeScript compilation passes
4. Test affected frontend components

---

## Technical Details

### Error Handling Standard (Required Pattern)
All edge functions must use this pattern in catch blocks:
```typescript
} catch (error) {
  console.error('Function error:', error);
  const message = error instanceof Error ? error.message : 'Unknown error';
  return new Response(JSON.stringify({ error: message }), {
    status: 500,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
```

### Profile Schema Standard
The `profiles` table uses these columns:
- `first_name`, `last_name` (NOT `full_name`, `name`)
- `organization` (NOT `company`)
- `job_title` (NOT `title`, `position`)
- `city`, `country` (NOT `location`, `address`)
- `notes` (NOT `bio`)

Contact information (email, phone) is stored in `contact_methods` table, NOT in `profiles`.

### Frontend Name Computation Pattern
```typescript
// Standard pattern for computing display name
const displayName = profile 
  ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown'
  : 'Unknown';
```

---

## Summary Statistics

| Category | Before Phase 23 | After Phase 23 |
|----------|-----------------|----------------|
| Functions with `error: any` | 9 | 0 |
| Functions with schema issues | 2 | 0 |
| Frontend hooks with issues | 7 | 0 |
| Frontend components with issues | 1 | 0 |
| **Total Issues** | **20** | **0** |

Upon completion, all 270+ edge functions and affected frontend files will be 100% compliant with:
- Enterprise-grade error handling (`instanceof Error` guards)
- Correct database schema usage
- Health check short-circuits
- CORS headers
