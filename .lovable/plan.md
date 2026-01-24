
# Edge Function Audit - Phase 19 (Final Comprehensive Scan)

## Executive Summary

Found **12 remaining issues** across **8 edge functions** after scanning all 270+ functions in the codebase.

---

## Issues Found

### Category 1: Database Insert/Update Schema Violations (CRITICAL)

| Function | Issue | Line | Fix |
|----------|-------|------|-----|
| `import-gmail-contacts` | Inserts `title` column (should be `job_title`) | 169 | Change `title:` to `job_title:` |
| `import-gmail-contacts` | Inserts `bio` column (should be `notes`) | 171 | Change `bio:` to `notes:` |
| `import-outlook-contacts` | Inserts `title` column (should be `job_title`) | 151 | Change `title:` to `job_title:` |
| `import-outlook-contacts` | Inserts `bio` column (should be `notes`) | 152 | Change `bio:` to `notes:` |
| `generate-dossier` | Uses `profile.title` (should be `job_title`) | 178 | Change to `profile.job_title` |
| `scrape-social-rapidapi` | Updates `location` column (doesn't exist) | 246-247 | Split into `city` extraction |

### Category 2: AI Context Data Schema Mismatches (MEDIUM)

| Function | Issue | Line | Fix |
|----------|-------|------|-----|
| `influence-orchestrator-v2` | Uses `profile?.name` | 148 | Use `${profile?.first_name} ${profile?.last_name}` |
| `cross-modal-deception-v2` | Uses `profile?.name` | 190 | Use `${profile?.first_name} ${profile?.last_name}` |
| `threat-actor-profiler` | Uses `profile?.name` | 169 | Use `${profile?.first_name} ${profile?.last_name}` |
| `detect-cross-patterns` | Uses `e.title` from work_experiences | 119 | This is valid (work_experiences table has `title`) - NO FIX NEEDED |

### Category 3: Missing Health Checks (LOW)

| Function | Status |
|----------|--------|
| `import-gmail-contacts` | Missing |
| `import-outlook-contacts` | Missing |
| `influence-orchestrator-v2` | Missing |
| `cross-modal-deception-v2` | Missing |

---

## Implementation Plan

### Fix 1: `import-gmail-contacts/index.ts` (Lines 169, 171)
```typescript
// Line 169: title: org?.title || null,  →  job_title: org?.title || null,
// Line 171: bio: bio || null,  →  notes: bio || null,
```
Add health check after line 24.

### Fix 2: `import-outlook-contacts/index.ts` (Lines 151, 152)
```typescript
// Line 151: title: contact.jobTitle || null,  →  job_title: contact.jobTitle || null,
// Line 152: bio: contact.personalNotes || null,  →  notes: contact.personalNotes || null,
```
Add health check after line 29.

### Fix 3: `generate-dossier/index.ts` (Line 178)
```typescript
// Line 178: current_title: profile.title,  →  current_title: profile.job_title,
```

### Fix 4: `influence-orchestrator-v2/index.ts` (Line 148)
```typescript
// Line 148: name: profile?.name,  →  name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : null,
```
Add health check after line 109.

### Fix 5: `cross-modal-deception-v2/index.ts` (Line 190)
```typescript
// Line 190: name: profile?.name,  →  name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : null,
```
Add health check after line 149.

### Fix 6: `threat-actor-profiler/index.ts` (Line 169)
```typescript
// Line 169: ${profile?.name || profileId}  →  ${profile ? `${profile.first_name} ${profile.last_name}` : profileId}
```

### Fix 7: `scrape-social-rapidapi/index.ts` (Lines 246-247)
```typescript
// Remove or adjust location update - split into city extraction if needed
// The location field doesn't exist on profiles table
```

---

## Files to Modify (8 Total)

| File | Changes |
|------|---------|
| `supabase/functions/import-gmail-contacts/index.ts` | Fix `title`→`job_title`, `bio`→`notes`, add health check |
| `supabase/functions/import-outlook-contacts/index.ts` | Fix `title`→`job_title`, `bio`→`notes`, add health check |
| `supabase/functions/generate-dossier/index.ts` | Fix `profile.title`→`profile.job_title` |
| `supabase/functions/influence-orchestrator-v2/index.ts` | Fix `profile?.name`, add health check |
| `supabase/functions/cross-modal-deception-v2/index.ts` | Fix `profile?.name`, add health check |
| `supabase/functions/threat-actor-profiler/index.ts` | Fix `profile?.name` |
| `supabase/functions/scrape-social-rapidapi/index.ts` | Remove invalid `location` update |
| `supabase/functions/family-systems-analyzer/index.ts` | Add `instanceof Error` guard (line 430) |

---

## Audit Summary

| Phase | Issues Fixed | Status |
|-------|--------------|--------|
| Phases 1-16 | 170+ | ✅ Complete |
| Phase 17 | 11 | ✅ Complete |
| Phase 18 | 6 | ✅ Complete |
| **Phase 19** | **12** | Ready to implement |
| **TOTAL** | **199+** | After this: 100% compliant |

---

## Note on `detect-cross-patterns`

The `work_experiences` table **does** have a `title` column (job title at that company), so line 119 using `e.title` is **valid** and requires no fix.

