-- Phase 1 security hardening
-- 1. Guard SECURITY DEFINER functions that mutate data based on a caller-supplied user_id.
-- 2. Remove the authenticated INSERT path on immutable_audit_logs (audit integrity).
-- 3. Apply the previously loose fix_dossier_visibility.sql patch through the migration system.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1a. relink_email_threads_to_profiles: require auth.uid() = p_user_id
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.relink_email_threads_to_profiles(p_user_id UUID)
RETURNS TABLE(threads_linked BIGINT, profiles_matched BIGINT)
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'forbidden: auth.uid() does not match p_user_id'
      USING ERRCODE = '42501';
  END IF;

  WITH extracted_emails AS (
    SELECT DISTINCT
      em.thread_id,
      lower(
        COALESCE(
          (regexp_match(em.sender_email, '<mailto:([^>]+)>'))[1],
          (regexp_match(em.sender_email, '<([^<>]+@[^<>]+)>'))[1],
          CASE WHEN em.sender_email ~ '@' THEN trim(lower(em.sender_email)) ELSE NULL END
        )
      ) AS clean_email
    FROM email_messages em
    JOIN email_threads et ON et.id = em.thread_id
    WHERE et.user_id = p_user_id
      AND et.profile_id IS NULL
      AND em.sender_email IS NOT NULL
  ),
  matched_threads AS (
    SELECT DISTINCT ON (ee.thread_id)
      ee.thread_id,
      cr.profile_id
    FROM extracted_emails ee
    JOIN cross_references cr ON cr.normalized_value = ee.clean_email
    WHERE cr.reference_type = 'email'
      AND cr.user_id = p_user_id
      AND ee.clean_email IS NOT NULL
  ),
  updated AS (
    UPDATE email_threads et
    SET profile_id = mt.profile_id
    FROM matched_threads mt
    WHERE et.id = mt.thread_id
    RETURNING et.id, et.profile_id
  )
  SELECT
    COUNT(*)::BIGINT AS threads_linked,
    COUNT(DISTINCT profile_id)::BIGINT AS profiles_matched
  INTO threads_linked, profiles_matched
  FROM updated;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.relink_email_threads_to_profiles(UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- 1b. batch_merge_duplicates: require auth.uid() = p_user_id
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.batch_merge_duplicates(p_user_id UUID)
RETURNS TABLE (merged_count INTEGER, groups_processed INTEGER) AS $$
DECLARE
  dup_group RECORD;
  primary_id UUID;
  dup_id UUID;
  merge_count INTEGER := 0;
  group_count INTEGER := 0;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'forbidden: auth.uid() does not match p_user_id'
      USING ERRCODE = '42501';
  END IF;

  FOR dup_group IN
    SELECT LOWER(TRIM(first_name)) AS fn, LOWER(TRIM(COALESCE(last_name, ''))) AS ln,
           array_agg(id ORDER BY created_at ASC) AS profile_ids
    FROM profiles
    WHERE user_id = p_user_id AND first_name IS NOT NULL
    GROUP BY LOWER(TRIM(first_name)), LOWER(TRIM(COALESCE(last_name, '')))
    HAVING COUNT(*) > 1
  LOOP
    group_count := group_count + 1;
    primary_id := dup_group.profile_ids[1];

    FOR i IN 2..array_length(dup_group.profile_ids, 1) LOOP
      dup_id := dup_group.profile_ids[i];
      PERFORM merge_duplicate_profiles(primary_id, dup_id, p_user_id);
      merge_count := merge_count + 1;
    END LOOP;
  END LOOP;

  RETURN QUERY SELECT merge_count, group_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.batch_merge_duplicates(UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- 2. immutable_audit_logs: drop the authenticated INSERT escape hatch.
--    Audit logs must be written by service-role-backed edge functions only.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can insert own audit logs" ON public.immutable_audit_logs;

-- ---------------------------------------------------------------------------
-- 3. fix_dossier_visibility (formerly applied via loose fix_dossier_visibility.sql).
-- ---------------------------------------------------------------------------
UPDATE public.navigation_preferences
SET hidden_items = array_remove(hidden_items, 'dossier-intelligence')
WHERE 'dossier-intelligence' = ANY(hidden_items);

COMMIT;
