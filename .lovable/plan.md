
# Fix Invalid Column Names and Table Schema Mismatches

## Summary of Issues Found

Through database analysis and error logs, I've identified the following schema mismatches causing errors across the codebase:

### Issue 1: `bulk_analysis_items` table has no `user_id` column
The `bulk_analysis_items` table uses `session_id` to link to `bulk_analysis_sessions` (which has `user_id`). However, the following SQL functions incorrectly reference `user_id` directly on `bulk_analysis_items`:

**Affected Functions in `supabase/migrations/20260123114719_7fd6e193-92ad-4d74-b317-e7f0fd4bd749.sql`:**
- `cleanup_stale_bulk_items` (line 13): `WHERE user_id = p_user_id`
- `get_database_health_metrics` (line 60): `WHERE user_id = p_user_id`

**Fix**: Join through `bulk_analysis_sessions` to get the user_id.

### Issue 2: `user_config_overrides` and `contact_config_overrides` have no `is_active` column
The `platform-config.ts` shared utility queries `.eq('is_active', true)` on these tables, but neither table has this column.

**Affected File: `supabase/functions/_shared/platform-config.ts`:**
- Line 124: `.eq('is_active', true)` on `contact_config_overrides`
- Line 141: `.eq('is_active', true)` on `user_config_overrides`
- Line 207: `.eq('is_active', true)` on `user_config_overrides`
- Line 224: `.eq('is_active', true)` on `contact_config_overrides`

**Fix**: Remove the `.eq('is_active', true)` filters since these columns don't exist.

### Issue 3: `messages` table has no `profile_id` column
The older `merge_duplicate_profiles` function (in migration `20260105185250`) tries to update `messages.profile_id`, but the `messages` table links to profiles through `conversations`, not directly.

**Affected**: The newer migration `20260116213215` correctly removed this, but the schemaValidator.ts still lists an incorrect schema.

### Issue 4: Dashboard metrics discrepancy
The `get_database_health_metrics` function fails due to Issue #1, returning all zeros. But the `duplicatesQuery` in `useDatabaseHealth.ts` uses a different approach (client-side grouping) that works correctly, showing 20 duplicates.

---

## Implementation Plan

### Step 1: Create SQL Migration to Fix Database Functions

Create a new migration that recreates the affected functions with correct column references:

```sql
-- Fix cleanup_stale_bulk_items to join through sessions
CREATE OR REPLACE FUNCTION cleanup_stale_bulk_items(
  p_user_id UUID,
  p_days_old INTEGER DEFAULT 3
)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM bulk_analysis_items
  WHERE session_id IN (
    SELECT id FROM bulk_analysis_sessions WHERE user_id = p_user_id
  )
  AND status IN ('pending', 'failed')
  AND created_at < NOW() - (p_days_old || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix get_database_health_metrics
CREATE OR REPLACE FUNCTION get_database_health_metrics(p_user_id UUID)
RETURNS TABLE (...) AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- duplicate_groups: same logic (profiles table has user_id)
    ...
    -- stale_bulk_items: join through sessions
    (SELECT COUNT(*) FROM bulk_analysis_items bi
      JOIN bulk_analysis_sessions bs ON bi.session_id = bs.id
      WHERE bs.user_id = p_user_id 
      AND bi.status IN ('pending', 'failed') 
      AND bi.created_at < NOW() - INTERVAL '3 days') AS stale_bulk_items,
    ...
END;
```

### Step 2: Fix platform-config.ts

Remove the invalid `.eq('is_active', true)` filters from all queries on `user_config_overrides` and `contact_config_overrides`:

**Lines to modify:**
- Line 124: Remove `.eq('is_active', true)`
- Line 141: Remove `.eq('is_active', true)`
- Line 207: Remove `.eq('is_active', true)`
- Line 224: Remove `.eq('is_active', true)`

### Step 3: Update schemaValidator.ts

Correct the `messages` table schema to remove `profile_id` since it doesn't exist:

```typescript
messages: [
  'id', 'conversation_id', 'content', 'is_from_contact', 
  'sent_at', 'created_at', // removed 'user_id', 'profile_id'
],
```

### Step 4: Add bulk_analysis_items and bulk_analysis_sessions to schemaValidator

Add correct schema definitions for these tables to prevent future issues.

---

## Files to Modify

| File | Change |
|------|--------|
| `supabase/migrations/[new].sql` | Fix `cleanup_stale_bulk_items` and `get_database_health_metrics` functions |
| `supabase/functions/_shared/platform-config.ts` | Remove invalid `is_active` filters (4 locations) |
| `src/lib/schemaValidator.ts` | Fix `messages` schema, add `bulk_analysis_items` and `bulk_analysis_sessions` |

---

## Technical Details

### Corrected Function: cleanup_stale_bulk_items

```sql
CREATE OR REPLACE FUNCTION cleanup_stale_bulk_items(
  p_user_id UUID,
  p_days_old INTEGER DEFAULT 3
)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM bulk_analysis_items
  WHERE session_id IN (
    SELECT id FROM bulk_analysis_sessions WHERE user_id = p_user_id
  )
  AND status IN ('pending', 'failed')
  AND created_at < NOW() - (p_days_old || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

### Corrected Function: get_database_health_metrics

```sql
CREATE OR REPLACE FUNCTION get_database_health_metrics(p_user_id UUID)
RETURNS TABLE (
  duplicate_groups INTEGER,
  stale_bulk_items BIGINT,
  total_profiles BIGINT,
  lonely_profiles BIGINT,
  total_media BIGINT,
  orphaned_media BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*)::INTEGER FROM (
      SELECT 1 FROM profiles 
      WHERE user_id = p_user_id AND first_name IS NOT NULL
      GROUP BY LOWER(TRIM(first_name)), LOWER(TRIM(COALESCE(last_name, '')))
      HAVING COUNT(*) > 1
    ) d) AS duplicate_groups,
    (SELECT COUNT(*) FROM bulk_analysis_items bi
      JOIN bulk_analysis_sessions bs ON bi.session_id = bs.id
      WHERE bs.user_id = p_user_id 
      AND bi.status IN ('pending', 'failed') 
      AND bi.created_at < NOW() - INTERVAL '3 days') AS stale_bulk_items,
    (SELECT COUNT(*) FROM profiles WHERE user_id = p_user_id) AS total_profiles,
    (SELECT COUNT(*) FROM profiles p 
      WHERE p.user_id = p_user_id 
      AND NOT EXISTS (SELECT 1 FROM media m WHERE m.profile_id = p.id)
      AND NOT EXISTS (SELECT 1 FROM ai_analyses a WHERE a.profile_id = p.id)) AS lonely_profiles,
    (SELECT COUNT(*) FROM media WHERE user_id = p_user_id) AS total_media,
    (SELECT COUNT(*) FROM media m 
      WHERE m.user_id = p_user_id 
      AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = m.profile_id)) AS orphaned_media;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

### Corrected platform-config.ts Queries

```typescript
// Before (line 141):
.eq('is_active', true)

// After:
// Line removed - no is_active column exists
```

---

## Expected Outcome

After these fixes:
1. **Merge contacts action** will work without "invalid column name" errors
2. **Quick actions** will show correct counts matching the duplicate profile groups section
3. **Purge stale jobs** will correctly identify and delete stale bulk analysis items
4. **Platform config** edge functions will no longer throw errors about missing `is_active` column

## Implementation Order

1. SQL migration (fixes database functions)
2. platform-config.ts (fixes edge function queries)
3. schemaValidator.ts (updates reference documentation)
