
## What’s happening (root cause)
The `/data-guide` page currently loads profiles using:

- `supabase.auth.getUser()` inside the React Query `queryFn`
- a **static queryKey**: `['profiles-for-guide']`

If the page renders before the auth session finishes hydrating, `getUser()` can return `null` briefly. In that case the query returns `[]`, React Query caches it under the static key, and it **won’t automatically re-run** once the session becomes available—so the UI stays stuck on “No profiles found”.

This matches your symptom: you have contacts, but the guide page still shows the empty state.

## Fix approach (safe + consistent with the rest of the app)
Update `src/pages/DataCollectionGuide.tsx` to follow the same pattern as `Contacts.tsx`:

1. **Use the existing `useAuth()` context** to get `user` and `loading`
2. Make the query:
   - `enabled: !loading && !!user?.id`
   - `queryKey` include the user id (so it naturally refreshes when auth state changes), e.g. `['profiles-for-guide', user?.id]`
   - `queryFn` use `user.id` directly (avoid calling `supabase.auth.getUser()` inside the query)
3. Add basic error handling:
   - capture `error` from the query
   - show a small inline “Failed to load profiles” state (instead of silently showing “create contact”)
4. Keep the active-only constraint:
   - `.eq('is_active', true)` stays

## Optional robustness improvements (recommended)
- Add `.limit(200)` for the selector (just for safety / performance), since this is only a picker UI.
- If you want the selector to show “All / Active / Address Book” like Contacts, we can add that later—but first we’ll get “Active contacts appear” working reliably.

## Verification steps (what we’ll test after implementing)
1. Hard refresh on `/data-guide`
2. Confirm it no longer shows “Create Contact” (assuming you’re signed in)
3. Confirm the selector populates with active contacts
4. Select a profile and confirm `useDataCollectionStatus(profileId)` loads and the tabs populate

## Files to change
- `src/pages/DataCollectionGuide.tsx`
  - switch from `supabase.auth.getUser()` to `useAuth()`
  - update React Query `queryKey` and `enabled`
  - add error UI state for profile loading failures
