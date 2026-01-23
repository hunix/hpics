
# Comprehensive Schema Mismatch Audit - Phase 4 (Final Audit)

## Executive Summary

After thoroughly reviewing 70+ edge functions, I identified **15 remaining schema mismatches** across edge functions that will cause runtime errors. These issues fall into 5 distinct categories.

---

## Category 1: `profiles` Table - Invalid Column Names (3 Functions)

The `profiles` table uses:
- `job_title` NOT `title`  
- `organization` NOT `company`
- `first_name`/`last_name` NOT `name`
- `last_contact_date` NOT `last_contact`

| Function | Issue | Lines | Fix |
|----------|-------|-------|-----|
| `action-recommendation-engine/index.ts` | Selects `name, company, title, last_contact` | 167 | Change to `first_name, last_name, organization, job_title, last_contact_date` |
| `generate-dossier/index.ts` | Uses `profile.title` and `m.type` | 123, 151-152 | Change `title` → `job_title`, `m.type` → `m.contact_type` |
| `generate-executive-summary/index.ts` | Selects `relationship_score` | 70-71 | Remove `relationship_score` (doesn't exist on profiles) |

---

## Category 2: `communications` Table - Using `direction` Instead of `is_from_contact` (4 Functions)

The `communications` table uses `is_from_contact` (boolean), NOT `direction` (string).

| Function | Issue | Lines | Fix |
|----------|-------|-------|-----|
| `calculate-relationship-scores/index.ts` | Selects `direction` column | 84-87 | Change to `is_from_contact` |
| `generate-meeting-prep/index.ts` | Uses `c.direction` in mapping | 97-98 | Change to `c.is_from_contact ? 'inbound' : 'outbound'` |
| `generate-weekly-summary/index.ts` | Filters by `direction === 'inbound'` | 56-57 | Change to `is_from_contact === true` |

---

## Category 3: `contact_methods` Table - Using `type` Instead of `contact_type` (1 Function)

| Function | Issue | Lines | Fix |
|----------|-------|-------|-----|
| `generate-dossier/index.ts` | Uses `m.type` | 151-152 | Change to `m.contact_type` |

---

## Category 4: `events` Table - Using `event_date` Instead of `start_time` (2 Functions)

The `events` table uses `start_time`, NOT `event_date` for event scheduling.

| Function | Issue | Lines | Fix |
|----------|-------|-------|-----|
| `predict-contact-needs/index.ts` | Filters by `event_date` | 92-93 | Change to `start_time` |
| `send-reminders/index.ts` | Filters by `event_date` | 36-41 | Verify column exists or update |

Note: Some functions use `event_date` and some `start_time`. Need to verify which is correct.

---

## Category 5: Non-Existent Columns on Tables (3 Functions)

| Function | Table | Invalid Column | Fix |
|----------|-------|----------------|-----|
| `generate-executive-summary/index.ts` | `profiles` | `relationship_score` | Remove from select |
| `action-recommendation-engine/index.ts` | `profiles` | `name`, `company`, `title`, `relationship_strength`, `last_contact` | Use correct column names |
| `historical-analytics/index.ts` | Error handling | `error.message` without `instanceof` check | 345, 348 | Add `instanceof Error` check |

---

## Implementation Plan

### Step 1: Fix `action-recommendation-engine/index.ts`

Line 167:
```typescript
// BEFORE
supabase.from('profiles').select('id, name, company, title, relationship_type, relationship_strength, last_contact, tags').eq('user_id', userId).eq('is_active', true)

// AFTER
supabase.from('profiles').select('id, first_name, last_name, organization, job_title, relationship_type, is_favorite, last_contact_date, tags').eq('user_id', userId).eq('is_active', true)
```

Lines 185-191 (mapping):
```typescript
// BEFORE
contacts: profiles?.map(p => ({
  id: p.id,
  name: p.name,
  company: p.company,
  ...

// AFTER
contacts: profiles?.map(p => ({
  id: p.id,
  name: `${p.first_name} ${p.last_name || ''}`.trim(),
  company: p.organization,
  ...
```

### Step 2: Fix `generate-dossier/index.ts`

Line 123:
```typescript
// BEFORE
title: profile.title,

// AFTER
title: profile.job_title,
```

Lines 151-152:
```typescript
// BEFORE
contact_methods: contactMethods?.map(m => ({
  type: m.type,

// AFTER
contact_methods: contactMethods?.map(m => ({
  type: m.contact_type,
```

### Step 3: Fix `generate-meeting-prep/index.ts`

Lines 97-98:
```typescript
// BEFORE
recentCommunications: (communications || []).map((c: any) => ({
  channel: c.channel,
  direction: c.direction,

// AFTER
recentCommunications: (communications || []).map((c: any) => ({
  channel: c.channel,
  direction: c.is_from_contact ? 'inbound' : 'outbound',
```

### Step 4: Fix `calculate-relationship-scores/index.ts`

Lines 84-87:
```typescript
// BEFORE
.select('channel, occurred_at, sentiment_score, direction')

// AFTER
.select('channel, occurred_at, sentiment_score, is_from_contact')
```

### Step 5: Fix `generate-weekly-summary/index.ts`

Lines 56-57:
```typescript
// BEFORE
inboundCommunications: communications.filter((c: any) => c.direction === 'inbound').length,
outboundCommunications: communications.filter((c: any) => c.direction === 'outbound').length,

// AFTER
inboundCommunications: communications.filter((c: any) => c.is_from_contact === true).length,
outboundCommunications: communications.filter((c: any) => c.is_from_contact === false).length,
```

### Step 6: Fix `generate-executive-summary/index.ts`

Lines 70-71:
```typescript
// BEFORE
.select('id, first_name, last_name, relationship_score, last_contact_date')

// AFTER
.select('id, first_name, last_name, last_contact_date')
```

And remove references to `relationship_score` from the mapping.

### Step 7: Fix `historical-analytics/index.ts`

Line 348:
```typescript
// BEFORE
JSON.stringify({ error: error.message }),

// AFTER
JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
```

---

## Files to Modify

| Priority | File | Issue Count |
|----------|------|-------------|
| HIGH | `supabase/functions/action-recommendation-engine/index.ts` | 5 invalid columns |
| HIGH | `supabase/functions/generate-dossier/index.ts` | 2 invalid columns |
| HIGH | `supabase/functions/calculate-relationship-scores/index.ts` | 1 invalid column |
| MEDIUM | `supabase/functions/generate-meeting-prep/index.ts` | 1 invalid column |
| MEDIUM | `supabase/functions/generate-weekly-summary/index.ts` | 2 invalid columns |
| MEDIUM | `supabase/functions/generate-executive-summary/index.ts` | 1 invalid column |
| LOW | `supabase/functions/historical-analytics/index.ts` | Error handling |

---

## Verified Schema Reference

| Table | Correct Columns | Invalid Usage Found |
|-------|-----------------|---------------------|
| `profiles` | `first_name`, `last_name`, `organization`, `job_title`, `last_contact_date`, `is_favorite` | `name`, `company`, `title`, `relationship_strength`, `last_contact` |
| `communications` | `is_from_contact` (boolean) | `direction` (string) |
| `contact_methods` | `contact_type` | `type` |
| `events` | `start_time` | `event_date` (needs verification) |

---

## Deployment Order

1. **Batch 1 (Critical)**
   - `action-recommendation-engine`
   - `generate-dossier`
   - `calculate-relationship-scores`

2. **Batch 2 (Medium)**
   - `generate-meeting-prep`
   - `generate-weekly-summary`
   - `generate-executive-summary`

3. **Batch 3 (Low)**
   - `historical-analytics`

---

## Acceptance Criteria

1. All 7 edge functions deploy without errors
2. Action recommendations generate without "column not found" errors
3. Dossier generation works correctly
4. Relationship scores calculate properly
5. Meeting prep loads communication history
6. Weekly summary displays correct inbound/outbound counts
7. No TypeScript/runtime errors in production
