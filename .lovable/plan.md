

# Codebase Scan: Final Pass (Post 5 Hardening Batches)

## Scan Summary

Previous batches resolved all critical issues: schema mismatches for core tables, memory leaks, interval cleanups, counter atomicity, Chinese character naming, `invokeProxy` caching, `ProfileService` logic bugs, DI alignment, and error hardening. This pass found **3 actionable issues** — 1 data-loss bug, 1 schema mismatch set, and 1 missing user-scope check.

---

## Issues Found

### Issue 1: `ApplyToContactDialog` Writes `company` Column to `profiles` (Data Loss Bug)

**File**: `src/components/capture/ApplyToContactDialog.tsx` (line 136)

The field mapping defines `contactField: 'company'`. When a user applies captured social profile data to a contact, line 217 writes `updates['company'] = value` to the `profiles` table via `.update(updates)`. The `profiles` table has **no `company` column** — the correct column is `organization`. This means every company value captured from social profiles is silently lost.

Additionally, the `loadContacts` query (line 113) only selects `id, first_name, last_name`, but the rendering (line 333) tries to display `contact.company` which is always `undefined`. Should select `organization` and display it.

**Fix**:
1. Line 136: Change `contactField: 'company'` → `contactField: 'organization'`
2. Line 113: Add `organization` to the select query
3. Lines 333-334: Change `contact.company` → `contact.organization`
4. Interface `Contact` (line 63): Change `company?: string` → `organization?: string`
5. Line 117: Remove the `company: undefined` mapping

### Issue 2: `deepOsint.ts` and `actionIntelligence.ts` Reference `profileData.company`

**Files**: `src/lib/intelligence/deepOsint.ts` (lines 160, 297) and `src/lib/intelligence/actionIntelligence.ts` (line 214)

These functions accept `profileData: any` and access `.company`. Since the data comes from the `profiles` table (which has `organization`, not `company`), these references always resolve to `undefined`. The OSINT queries and conversation starters that use company data never fire.

**Fix**: Change `profileData.company` → `profileData.organization` in all 3 locations. Also add `profileData.company || profileData.organization` fallback since the data might come from external extraction (which uses `company`).

### Issue 3: `ApplyToContactDialog.loadContacts()` Missing User Scope

**File**: `src/components/capture/ApplyToContactDialog.tsx` (lines 111-114)

The query `supabase.from('profiles').select(...)` has no `.eq('user_id', ...)` filter. RLS should catch this, but it's a defense-in-depth gap — if RLS is ever loosened, all users' contacts would appear.

**Fix**: Add `.eq('user_id', user.id)` to the query (requires getting the user from auth).

---

## Implementation Plan

### Batch 1: Data Loss Fix — `ApplyToContactDialog` (1 file)
1. Change `Contact` interface: `company` → `organization`
2. Add `organization` to the select query
3. Fix field mapping: `contactField: 'company'` → `contactField: 'organization'`
4. Fix JSX: `contact.company` → `contact.organization`
5. Add user scope to `loadContacts` query

### Batch 2: Schema Alignment — Intelligence Utils (2 files)
6. `deepOsint.ts`: Change `profileData.company` → `profileData.organization || profileData.company` (3 locations)
7. `actionIntelligence.ts`: Same fix (1 location)

Total: 3 files, ~15 lines changed.

