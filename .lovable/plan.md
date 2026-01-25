
# Fix: suggest-followups Edge Function Schema Error

## Problem Identified

The `suggest-followups` edge function is throwing a 500 error with:
```
column communications.is_from_contact does not exist
```

**Root Cause:** The function queries a non-existent column `is_from_contact`. The actual schema uses `direction` with enum values `'inbound'` / `'outbound'`.

---

## Current (Broken) Code

**File:** `supabase/functions/suggest-followups/index.ts` (Lines 79-83)

```typescript
const { data: communications, error: commsError } = await supabase
  .from('communications')
  .select('profile_id, occurred_at, channel, is_from_contact')  // ❌ Wrong column
  .eq('user_id', userId)
  .order('occurred_at', { ascending: false });
```

---

## Actual Schema

| Column | Type | Values |
|--------|------|--------|
| `direction` | enum | `'inbound'` (from contact) / `'outbound'` (to contact) |

The equivalent logic:
- `is_from_contact: true` → `direction = 'inbound'`
- `is_from_contact: false` → `direction = 'outbound'`

---

## Fix Implementation

### Change 1: Update select query (Line 81)

```typescript
// BEFORE
.select('profile_id, occurred_at, channel, is_from_contact')

// AFTER
.select('profile_id, occurred_at, channel, direction')
```

### Change 2: Add limit for performance (after Line 83)

Add `.limit(1000)` to prevent potential performance issues with large datasets.

### Change 3: No logic changes needed

The `is_from_contact` field was being selected but never actually used in the rest of the function. The code only uses:
- `profile_id` - for filtering communications by profile
- `occurred_at` - for determining last contact date
- `channel` - for showing recent channels

So we just need to fix the column name. No other logic changes required.

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/suggest-followups/index.ts` | Replace `is_from_contact` with `direction`, add `.limit(1000)` |

---

## Technical Details

The fix is minimal - a single column name change. The function currently:
1. Fetches active profiles for the user
2. Fetches communications for those profiles
3. Calculates days since last contact
4. Sends data to AI for follow-up suggestions
5. Returns the suggestions

The `direction` column is not actually used in the logic (only selected), so the fix is straightforward.

---

## Expected Result

After this fix:
- The edge function will execute without 500 errors
- Dashboard will load follow-up suggestions correctly
- The error toast will no longer appear on the dashboard page
