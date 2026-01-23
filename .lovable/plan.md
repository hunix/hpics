

# Comprehensive Schema Mismatch Fix Plan - Phase 2

## Summary of Findings

After auditing the codebase, I identified **15+ remaining issues** across edge functions and frontend hooks that will cause runtime errors due to invalid column/table references.

---

## Issues by Category

### Category A: `messages` Table Invalid Queries (3 Functions)

| File | Line | Issue | Fix |
|------|------|-------|-----|
| `gottman-relationship-analyzer/index.ts` | 52-57 | `.eq('profile_id', ...)` on messages | Use `conversations!inner(profile_id)` join |
| `analyze-communication-triangulation/index.ts` | 86-89 | Uses non-existent `source` column + `user_id` on messages | Remove `source`, use proper join pattern |
| `useRelationshipAnalytics.tsx` | 49-53 | Queries `messages.user_id` directly | This works because messages DOES have `user_id` - **NO FIX NEEDED** |

### Category B: `contact_methods` Missing `user_id` (2 Functions)

The `contact_methods` table has NO `user_id` column - only `profile_id`.

| File | Line | Issue | Fix |
|------|------|-------|-----|
| `sync-google-calendar/index.ts` | 150-156 | `.eq('user_id', userId)` | Join through profiles or remove filter |
| `sync-outlook-calendar/index.ts` | 143-149 | `.eq('user_id', userId)` | Join through profiles or remove filter |

### Category C: Non-Existent Tables (1 Function)

| File | Line | Table | Fix |
|------|------|-------|-----|
| `contact-ai-agent-v2/index.ts` | 150-154 | `social_profiles` | Remove query or use alternative data source |

### Category D: Wrong Column Names (1 Hook)

| File | Line | Issue | Fix |
|------|------|-------|-----|
| `useDossierData.ts` | 134 | Uses `communication_date` | Change to `occurred_at` |

---

## Implementation Steps

### Step 1: Fix Edge Functions

**gottman-relationship-analyzer/index.ts**
```typescript
// BEFORE (line 52-57)
const { data: messages } = await supabase
  .from('messages')
  .select('*')
  .eq('profile_id', request.profileId)

// AFTER
const { data: messages } = await supabase
  .from('messages')
  .select('*, conversations!inner(profile_id)')
  .eq('conversations.profile_id', request.profileId)
```

**analyze-communication-triangulation/index.ts**
```typescript
// BEFORE (line 86-89)
const { data: messages } = await supabase
  .from('messages')
  .select('conversation_id, is_from_contact, sent_at, source')
  .eq('user_id', userId);

// AFTER - remove 'source' column, user_id is valid on messages
const { data: messages } = await supabase
  .from('messages')
  .select('conversation_id, is_from_contact, sent_at')
  .eq('user_id', userId);
```

**sync-google-calendar/index.ts** and **sync-outlook-calendar/index.ts**
```typescript
// BEFORE (contact_methods has no user_id)
const { data: contact } = await supabase
  .from('contact_methods')
  .select('profile_id')
  .eq('user_id', userId)
  .eq('type', 'email')

// AFTER - join through profiles to verify ownership
const { data: contact } = await supabase
  .from('contact_methods')
  .select('profile_id, profiles!inner(user_id)')
  .eq('profiles.user_id', userId)
  .eq('contact_type', 'email')
```

**contact-ai-agent-v2/index.ts**
```typescript
// BEFORE - social_profiles table doesn't exist
const { data: socialProfiles } = await context.supabase
  .from('social_profiles')
  .select('*')

// AFTER - remove query, return empty array
// social_profiles table doesn't exist - social data is on profiles table
return { captures, socialProfiles: [] };
```

### Step 2: Fix Frontend Hooks

**useDossierData.ts**
```typescript
// BEFORE
.order('communication_date', { ascending: false })

// AFTER
.order('occurred_at', { ascending: false })
```

### Step 3: Deploy Fixed Edge Functions

Deploy all 5 modified edge functions after code changes.

---

## Files to Modify

| Type | File |
|------|------|
| Edge Function | `supabase/functions/gottman-relationship-analyzer/index.ts` |
| Edge Function | `supabase/functions/analyze-communication-triangulation/index.ts` |
| Edge Function | `supabase/functions/sync-google-calendar/index.ts` |
| Edge Function | `supabase/functions/sync-outlook-calendar/index.ts` |
| Edge Function | `supabase/functions/contact-ai-agent-v2/index.ts` |
| Frontend Hook | `src/components/reports/hooks/useDossierData.ts` |

---

## Verified Schema Reference

Based on database queries:

| Table | Has `user_id` | Has `profile_id` | Notes |
|-------|--------------|------------------|-------|
| `messages` | YES | NO | Links via `conversation_id` → `conversations.profile_id` |
| `contact_methods` | NO | YES | Links to profiles directly |
| `communications` | YES | YES | Has `occurred_at`, not `communication_date` |
| `profiles` | YES | N/A | Has `is_active` (confirmed) |
| `social_profiles` | N/A | N/A | TABLE DOES NOT EXIST |

---

## Acceptance Criteria

1. All 5 edge functions deploy without errors
2. Gottman analyzer works when invoked
3. Calendar sync functions match attendees correctly
4. Dossier reports load without query errors
5. No "column does not exist" errors in console/logs

