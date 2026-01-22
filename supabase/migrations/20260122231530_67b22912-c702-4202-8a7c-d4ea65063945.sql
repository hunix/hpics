-- Create function to re-link orphaned email threads to profiles based on cross_references
CREATE OR REPLACE FUNCTION relink_email_threads_to_profiles(p_user_id UUID)
RETURNS TABLE(threads_linked BIGINT, profiles_matched BIGINT)
AS $$
BEGIN
  -- Update orphaned threads by matching sender emails to cross_references
  WITH extracted_emails AS (
    SELECT DISTINCT
      em.thread_id,
      -- Extract clean email from various formats like "Name <email>" or "Name <email <mailto:email>>"
      lower(
        COALESCE(
          -- Try mailto format first
          (regexp_match(em.sender_email, '<mailto:([^>]+)>'))[1],
          -- Then try angle bracket format
          (regexp_match(em.sender_email, '<([^<>]+@[^<>]+)>'))[1],
          -- Finally try plain email
          CASE WHEN em.sender_email ~ '@' THEN trim(lower(em.sender_email)) ELSE NULL END
        )
      ) as clean_email
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
    COUNT(*)::BIGINT as threads_linked,
    COUNT(DISTINCT profile_id)::BIGINT as profiles_matched
  INTO threads_linked, profiles_matched
  FROM updated;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION relink_email_threads_to_profiles(UUID) TO authenticated;