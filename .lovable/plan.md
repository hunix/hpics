

# Fix: Data Collection Guide Profile Selector Not Loading Contacts

## Problem Identified

The `DataCollectionGuide.tsx` page shows "No profiles found. Create a contact to get started" even though you have **10 active contacts** in the database.

**Root Cause**: The query on lines 44-48 is missing the `is_active = true` filter:

```typescript
// Current (broken)
const { data } = await supabase
  .from('profiles')
  .select('id, first_name, last_name, avatar_url, organization')
  .eq('user_id', user.id)
  .order('first_name');
```

Without filtering by `is_active`, the query attempts to load all 3,642 profiles (including archived/inactive ones), which may cause issues or return unexpected results.

---

## Solution

Add the `is_active` filter to the profiles query to only show active contacts:

```typescript
// Fixed
const { data } = await supabase
  .from('profiles')
  .select('id, first_name, last_name, avatar_url, organization')
  .eq('user_id', user.id)
  .eq('is_active', true)  // ← ADD THIS
  .order('first_name');
```

---

## File to Modify

| File | Change |
|------|--------|
| `src/pages/DataCollectionGuide.tsx` | Add `.eq('is_active', true)` to profiles query (line 47) |

---

## Expected Result

After the fix:
- The profile selector will show your **10 active contacts**
- You can select any profile to see their data collection status
- The intelligence coverage score, data categories, and analysis matrix will populate correctly

