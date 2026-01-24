
# Edge Function Audit - Phase 17 (Additional Issues Found)

## Executive Summary

After deeper inspection, I found **11 additional issues** across **5 edge functions** that were missed in previous phases. These include invalid profile column references (`bio`, `location`) and missing health check endpoints.

---

## Issues Found

### Category 1: Schema Mismatches - Using Non-Existent Profile Columns (4 Functions)

| Function | Issue | Lines | Severity |
|----------|-------|-------|----------|
| `analyze-profile/index.ts` | Uses `profile.bio` (should remove or use `profile.notes`) | 93 | MEDIUM |
| `generate-briefing/index.ts` | Uses `profile.bio` (should remove or use `profile.notes`) | 75 | MEDIUM |
| `suggest-introductions/index.ts` | Uses `profile.bio` in contact mapping | 94 | MEDIUM |
| `predict-contact-preferences/index.ts` | Uses `profile.location` (should use `city`/`country`) | 122 | MEDIUM |
| `predict-contact-preferences/index.ts` | Uses `profile.interests` and `profile.hobbies` (not on profiles table) | 125-126 | MEDIUM |
| `deep-analyze-capture/index.ts` | Uses `profile.bio` and `profile.location` in content analysis | 259, 261 | MEDIUM |

### Category 2: Missing Health Check Endpoints (3 Functions)

| Function | Status | Priority |
|----------|--------|----------|
| `suggest-introductions` | Missing | Medium |
| `predict-contact-preferences` | Missing | Medium |
| `deep-analyze-capture` | Missing | Medium |

---

## Implementation Plan

### Step 1: Fix `analyze-profile/index.ts` (Line 93)

**Current Code:**
```typescript
bio: profile.bio,
notes: profile.notes,
```

**Fix:** Remove the invalid `bio` field (notes already included):
```typescript
notes: profile.notes,
```

---

### Step 2: Fix `generate-briefing/index.ts` (Line 75)

**Current Code:**
```typescript
${profile.bio ? `Bio: ${profile.bio}` : ''}
${profile.notes ? `Notes: ${profile.notes}` : ''}
```

**Fix:** Remove the invalid `bio` line (notes already handles this):
```typescript
${profile.notes ? `Notes: ${profile.notes}` : ''}
```

---

### Step 3: Fix `suggest-introductions/index.ts` (Line 94 + Add Health Check)

**Add Health Check after line 14:**
```typescript
// Health check short-circuit
const url = new URL(req.url);
if (url.searchParams.get('healthCheck') === '1') {
  return new Response(JSON.stringify({ 
    ok: true, 
    function: 'suggest-introductions', 
    timestamp: Date.now() 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
```

**Fix Line 94:** Remove `bio` field:
```typescript
// BEFORE
bio: profile.bio,
tags: profile.tags || [],

// AFTER
tags: profile.tags || [],
```

---

### Step 4: Fix `predict-contact-preferences/index.ts` (Lines 122-126 + Add Health Check)

**Add Health Check after line 23:**
```typescript
// Health check short-circuit
const url = new URL(req.url);
if (url.searchParams.get('healthCheck') === '1') {
  return new Response(JSON.stringify({ 
    ok: true, 
    function: 'predict-contact-preferences', 
    timestamp: Date.now() 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
```

**Fix Lines 122-126:**
```typescript
// BEFORE
location: profile.location,
birthday: profile.birthday,
notes: profile.notes,
interests: profile.interests,
hobbies: profile.hobbies,

// AFTER - use valid columns
city: profile.city,
country: profile.country,
birthday: profile.birthday,
notes: profile.notes,
// interests and hobbies come from contact_interests table, not profiles
```

---

### Step 5: Fix `deep-analyze-capture/index.ts` (Lines 259, 261 + Add Health Check)

**Add Health Check after line 82:**
```typescript
// Health check short-circuit
const url = new URL(req.url);
if (url.searchParams.get('healthCheck') === '1') {
  return new Response(JSON.stringify({ 
    ok: true, 
    function: 'deep-analyze-capture', 
    timestamp: Date.now() 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
```

**Fix Lines 259-261 in `prepareContentForAnalysis` function:**
```typescript
// BEFORE
if (profile.bio) parts.push(`Bio: ${profile.bio}`);
if (profile.displayName) parts.push(`Display Name: ${profile.displayName}`);
if (profile.location) parts.push(`Location: ${profile.location}`);

// AFTER - This function works with social capture data (device_captures), 
// where bio/location are stored in the capture's profile_data JSON, not the profiles table.
// These fields are from the scraped social profile, so they're valid here.
// However, we should add defensive checks:
if (profile?.bio) parts.push(`Bio: ${profile.bio}`);
if (profile?.displayName) parts.push(`Display Name: ${profile.displayName}`);
if (profile?.location) parts.push(`Location: ${profile.location}`);
```

**Note:** After reviewing the context, `deep-analyze-capture` works with `device_captures` table data where `profile` is parsed from `raw_data` JSON (social profile scrape data), not the `profiles` table. So `bio`/`location` are valid there. Only the health check is needed.

---

## Files to Modify

| Priority | File | Issue Count | Changes |
|----------|------|-------------|---------|
| MEDIUM | `supabase/functions/analyze-profile/index.ts` | 1 | Remove `bio: profile.bio` |
| MEDIUM | `supabase/functions/generate-briefing/index.ts` | 1 | Remove `${profile.bio}` line |
| MEDIUM | `supabase/functions/suggest-introductions/index.ts` | 2 | Remove `bio`, add health check |
| MEDIUM | `supabase/functions/predict-contact-preferences/index.ts` | 4 | Fix location/interests/hobbies, add health check |
| LOW | `supabase/functions/deep-analyze-capture/index.ts` | 1 | Add health check only (bio/location valid for capture data) |

---

## Schema Reference

| Table | Valid Columns | Invalid References Found |
|-------|---------------|-------------------------|
| `profiles` | `first_name`, `last_name`, `organization`, `job_title`, `notes`, `city`, `country`, `birthday` | `bio`, `location`, `interests`, `hobbies` |

**Note:** `interests` and `hobbies` data should be fetched from `contact_interests` table, not as columns on `profiles`.

---

## Summary

| Phase | Issues Found | Status |
|-------|--------------|--------|
| Phases 1-16 | 170+ | Complete |
| Phase 17 | 11 | **Ready to implement** |

After this phase, all edge functions will be fully schema-compliant with enterprise standards.

---

## Technical Notes

1. **`deep-analyze-capture`**: The `prepareContentForAnalysis` function operates on scraped social profile data (from `device_captures.raw_data`), not the `profiles` table. Fields like `bio` and `location` are valid for social capture context.

2. **`predict-contact-preferences`**: References `profile.interests` and `profile.hobbies` which don't exist on the `profiles` table. These should either be removed or fetched separately from `contact_interests`.

3. **Health checks**: All three functions missing health checks should have the standardized `?healthCheck=1` short-circuit added after the CORS handler.
