

# Comprehensive Schema Mismatch Audit & Fix Plan

## Executive Summary

A full codebase audit has identified **30+ edge functions** with invalid column or table references that will cause runtime errors. The primary issues fall into three categories:

1. **`messages` table queried with `profile_id`** - This column doesn't exist; messages link to profiles via `conversations`
2. **Non-existent tables referenced** - `social_profiles`, `life_events`, `recordings` don't exist in the database
3. **Invalid column references** - `direction`, `received_at` on messages table

---

## Issue Categories

### Category 1: `messages.profile_id` Does Not Exist (25 Edge Functions)

The `messages` table has these columns:
- `id`, `conversation_id`, `user_id`, `is_from_contact`, `content`, `sent_at`, `metadata`, `created_at`, `whatsapp_message_id`, `whatsapp_status`, `media_id`, `media_type`, `media_filename`

**NO `profile_id` column exists.** Messages link to profiles via:
```
messages.conversation_id → conversations.profile_id
```

**Affected Functions:**
| Function | Line | Current Query |
|----------|------|---------------|
| predict-contact-preferences | 78-80 | `.from('messages').eq('profile_id', profileId)` |
| predict-churn-enhanced | 171-174 | `.from('messages').in('profile_id', profileIds)` |
| analyze-community-class | 130 | `.from('messages').eq('profile_id', profileId)` |
| detect-shadow-networks | 170 | `.from('messages').in('profile_id', profileIds)` |
| analyze-romantic-intelligence | 122 | `.from('messages').eq('profile_id', profileId)` |
| coercion-resistance-assessor | 167 | `.from('messages').eq('profile_id', profileId)` |
| manipulation-vulnerability-assessment | 210 | `.from('messages').eq('profile_id', profileId)` |
| sacred-values-mapper | 74 | `.from('messages').eq('profile_id', profileId)` |
| financial-intelligence-scan | 149 | `.from('messages').eq('profile_id', profileId)` |
| behavioral-future-modeler | 148 | `.from('messages').eq('profile_id', profileId)` |
| betrayal-likelihood-scorer | 53 | `.from('messages').eq('profile_id', profileId)` |
| deep-intelligence-engine | 143 | `.from('messages').eq('profile_id', profileId)` |
| mice-recruitment-analyzer | 74 | `.from('messages').eq('profile_id', profileId)` |
| influence-orchestrator-v2 | 131 | `.from('messages').eq('profile_id', profileId)` |
| personality-dna-extractor | 179 | `.from('messages').eq('profile_id', profileId)` |
| churn-prediction-engine | 36-38 | `.from('messages').eq('profile_id', profileId)` |
| predictive-trajectory-engine | 55-57 | `.from('messages').eq('profile_id', profileId)` |
| emotional-trajectory-analyzer | 34-37 | `.from('messages').eq('profile_id', profileId)` |
| enhanced-deception-detector | 50-53 | `.from('messages').eq('profile_id', profileId)` |
| train-behavior-model | 63 | `.from('messages').eq('profile_id', profileId)` |
| action-recommendation-engine | 168 | `.from('messages').eq('profile_id', profileId)` |
| deep-correlation-mapper | 156 | `.from('messages').eq('profile_id', profileId)` |
| cross-modal-deception-v2 | 178 | `.from('messages').eq('profile_id', profileId)` |
| fortune-trajectory-engine | 210 | `.from('messages').eq('profile_id', profileId)` |

**Fix Pattern:** Use PostgREST `!inner` join:
```typescript
// BEFORE (broken)
supabase.from('messages').select('*').eq('profile_id', profileId)

// AFTER (correct)
supabase.from('messages')
  .select('*, conversations!inner(profile_id)')
  .eq('conversations.profile_id', profileId)
```

---

### Category 2: Non-Existent Tables in `merge_duplicate_profiles`

The recently fixed `merge_duplicate_profiles` function references tables that **don't exist**:
- `social_profiles` - Does NOT exist
- `life_events` - Does NOT exist  
- `recordings` - Does NOT exist

These UPDATE statements will silently fail (no error, but no-op).

**Fix:** Remove these UPDATE statements from the function since the tables don't exist.

---

### Category 3: Invalid Column `received_at` on Messages

Some functions reference `messages.received_at` which doesn't exist - the correct column is `sent_at`:
- emotional-trajectory-analyzer (line 37)
- enhanced-deception-detector (line 53)
- churn-prediction-engine (line 39)

---

## Implementation Plan

### Step 1: Create Helper Function for Message Queries (New Shared Utility)

Create `supabase/functions/_shared/query-helpers.ts`:
```typescript
export async function getMessagesForProfile(
  supabase: SupabaseClient, 
  profileId: string, 
  limit = 100
) {
  // First get conversation IDs for this profile
  const { data: convs } = await supabase
    .from('conversations')
    .select('id')
    .eq('profile_id', profileId);
  
  if (!convs?.length) return [];
  
  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .in('conversation_id', convs.map(c => c.id))
    .order('sent_at', { ascending: false })
    .limit(limit);
    
  return messages || [];
}
```

### Step 2: Fix All 25 Edge Functions

Update each affected function to use the `!inner` join pattern or the helper function.

### Step 3: SQL Migration for merge_duplicate_profiles

Remove references to non-existent tables (`social_profiles`, `life_events`, `recordings`).

### Step 4: Update schemaValidator.ts

Add accurate schemas for all tables to catch future mismatches.

---

## Priority Order

1. **High Priority** - Fix `merge_duplicate_profiles` SQL function (currently broken)
2. **High Priority** - Fix the 10 most commonly used edge functions
3. **Medium Priority** - Fix remaining edge functions
4. **Low Priority** - Update schemaValidator.ts with complete schemas

---

## Files to Modify

| Category | Count | Files |
|----------|-------|-------|
| SQL Migration | 1 | New migration to fix `merge_duplicate_profiles` |
| Shared Utility | 1 | `supabase/functions/_shared/query-helpers.ts` |
| Edge Functions | 25 | All functions listed in Category 1 |
| Schema Validator | 1 | `src/lib/schemaValidator.ts` |

---

## Verification

After fixes:
1. Run `merge_duplicate_profiles` - should complete without error
2. Test each fixed edge function via health check
3. Verify dashboard metrics show correct counts

