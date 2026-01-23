
## What’s happening (root cause)

Your “Merge all duplicates” button calls the backend RPC `batch_merge_duplicates`.

That function loops through duplicate profile groups and calls `merge_duplicate_profiles(primary, duplicate, p_user_id)`.

The failing error returned from the backend is:

- `column "user_id" does not exist` (code 42703)

This error is **not** coming from the `profiles` table; it’s coming from inside `merge_duplicate_profiles` where it runs UPDATEs like:

- `UPDATE contact_methods ... WHERE ... AND user_id = p_user_id;`

But several of the tables referenced in `merge_duplicate_profiles` **do not have a `user_id` column** in your actual backend schema:

- `contact_methods` → no `user_id`
- `social_profiles` → no `user_id`
- `life_events` → no `user_id`
- `recordings` → no `user_id`

So the function crashes during the merge, and `batch_merge_duplicates` fails too.

## What we will change

### 1) Create a new SQL migration to fix `merge_duplicate_profiles`
We will `CREATE OR REPLACE FUNCTION public.merge_duplicate_profiles(...)` and remove the invalid `AND user_id = p_user_id` filters for the tables that lack `user_id`.

Concretely, these lines will be changed:

- `UPDATE contact_methods ... WHERE profile_id = p_duplicate_id AND user_id = p_user_id;`
  - becomes `UPDATE contact_methods ... WHERE profile_id = p_duplicate_id;`

- `UPDATE social_profiles ... AND user_id = p_user_id;`
  - becomes `... WHERE profile_id = p_duplicate_id;`

- `UPDATE life_events ... AND user_id = p_user_id;`
  - becomes `... WHERE profile_id = p_duplicate_id;`

- `UPDATE recordings ... AND user_id = p_user_id;`
  - becomes `... WHERE profile_id = p_duplicate_id;`

We will keep `user_id = p_user_id` filters on tables that *do* have `user_id` (e.g., `media`, `documents`, `conversations`, `contact_relationships`, etc.).

### 2) Preserve security/ownership guarantees
Even after removing `user_id` filters on those 4 tables, the function remains safe because it already does:

- Ownership validation upfront:
  - `IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_primary_id AND user_id = p_user_id) THEN ...`
  - `IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_duplicate_id AND user_id = p_user_id) THEN ...`

So an attacker can’t merge someone else’s profiles because the function will refuse to proceed unless both profile IDs belong to the caller.

And the UPDATEs are constrained to `profile_id = p_duplicate_id` (a specific UUID), so we’re not risking cross-user mass updates.

### 3) Verify with an immediate backend call + UI confirmation
After the migration applies, we’ll verify in two ways:

- Call `batch_merge_duplicates` once (same as the UI does) and confirm it returns `{ merged_count, groups_processed }` instead of error.
- Refresh `/maintenance` and run “Merge all duplicates” again:
  - Expect: no “invalid column / user_id” error
  - Expect: duplicate groups count decreases after successful merge

### 4) (Optional but recommended) Add a “schema-safe merge” comment + quick future-proofing
Inside the SQL function, we’ll add a short comment block explaining:
- Which tables lack `user_id`
- Why we intentionally filter only by `profile_id` for those tables

This prevents future regressions when the function gets extended again.

## Files/areas affected

- New migration: `supabase/migrations/<new>_fix_merge_duplicate_profiles_user_id.sql`
  - updates only `merge_duplicate_profiles` (no table changes required)

## Acceptance criteria

- Clicking “Merge all duplicates” in `/maintenance` completes successfully (no 400 RPC error)
- `batch_merge_duplicates` returns successfully for the logged-in user
- Duplicate groups count decreases after merge
- No new “column does not exist” errors are triggered during merge

## Notes / additional follow-up (separate from this fix, but important)
I noticed earlier history indicates `src/integrations/supabase/types.ts` was edited in the past (that file must never be manually edited). After we unblock merging, I can also:
- revert that file back to the auto-generated state (or remove unintended edits) using the platform’s correct workflow.
