-- Enhanced relink_email_threads_to_profiles function with body_preview scanning
CREATE OR REPLACE FUNCTION public.relink_email_threads_to_profiles(p_user_id uuid)
RETURNS TABLE(threads_linked bigint, profiles_matched bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_threads_linked bigint := 0;
  v_profiles_matched bigint := 0;
BEGIN
  -- Method 1: Match by sender_email against cross_references
  WITH sender_matches AS (
    UPDATE email_threads et
    SET profile_id = cr.profile_id
    FROM email_messages em
    JOIN cross_references cr ON lower(cr.reference_value) = lower(em.sender_email)
    JOIN profiles p ON p.id = cr.profile_id AND p.user_id = p_user_id
    WHERE et.id = em.thread_id
      AND et.user_id = p_user_id
      AND et.profile_id IS NULL
      AND cr.reference_type = 'email'
    RETURNING et.id, et.profile_id
  )
  SELECT COUNT(DISTINCT id), COUNT(DISTINCT profile_id) INTO v_threads_linked, v_profiles_matched FROM sender_matches;

  -- Method 2: Match by recipients array against cross_references
  WITH recipient_matches AS (
    UPDATE email_threads et
    SET profile_id = cr.profile_id
    FROM email_messages em
    JOIN cross_references cr ON lower(cr.reference_value) = ANY(
      SELECT lower(unnest(em.recipients))
    )
    JOIN profiles p ON p.id = cr.profile_id AND p.user_id = p_user_id
    WHERE et.id = em.thread_id
      AND et.user_id = p_user_id
      AND et.profile_id IS NULL
      AND cr.reference_type = 'email'
      AND array_length(em.recipients, 1) > 0
    RETURNING et.id, et.profile_id
  )
  SELECT 
    v_threads_linked + COUNT(DISTINCT id),
    v_profiles_matched + COUNT(DISTINCT profile_id)
  INTO v_threads_linked, v_profiles_matched 
  FROM recipient_matches;

  -- Method 3: Scan body_preview for email mentions (CC'd, forwarded, mentioned contacts)
  WITH body_email_matches AS (
    UPDATE email_threads et
    SET profile_id = matched.profile_id
    FROM (
      SELECT DISTINCT ON (em.thread_id)
        em.thread_id,
        cr.profile_id
      FROM email_messages em
      JOIN email_threads et2 ON et2.id = em.thread_id
      CROSS JOIN LATERAL (
        SELECT (regexp_matches(em.body_preview, '([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})', 'g'))[1] as found_email
      ) extracted
      JOIN cross_references cr ON lower(cr.reference_value) = lower(extracted.found_email)
      JOIN profiles p ON p.id = cr.profile_id AND p.user_id = p_user_id
      WHERE et2.user_id = p_user_id
        AND et2.profile_id IS NULL
        AND cr.reference_type = 'email'
        AND em.body_preview IS NOT NULL
        AND length(em.body_preview) > 0
    ) matched
    WHERE et.id = matched.thread_id
      AND et.user_id = p_user_id
      AND et.profile_id IS NULL
    RETURNING et.id, et.profile_id
  )
  SELECT 
    v_threads_linked + COUNT(DISTINCT id),
    v_profiles_matched + COUNT(DISTINCT profile_id)
  INTO v_threads_linked, v_profiles_matched 
  FROM body_email_matches;

  -- Method 4: Match by contact_methods table directly
  WITH contact_method_matches AS (
    UPDATE email_threads et
    SET profile_id = cm.profile_id
    FROM email_messages em
    JOIN contact_methods cm ON lower(cm.value) = lower(em.sender_email)
    JOIN profiles p ON p.id = cm.profile_id AND p.user_id = p_user_id
    WHERE et.id = em.thread_id
      AND et.user_id = p_user_id
      AND et.profile_id IS NULL
      AND cm.contact_type = 'email'
    RETURNING et.id, et.profile_id
  )
  SELECT 
    v_threads_linked + COUNT(DISTINCT id),
    v_profiles_matched + COUNT(DISTINCT profile_id)
  INTO v_threads_linked, v_profiles_matched 
  FROM contact_method_matches;

  RETURN QUERY SELECT v_threads_linked, v_profiles_matched;
END;
$$;

-- Backfill: Extract recipients from body_preview headers for messages with empty recipients
-- This parses common email header patterns like "To: email@domain.com" or "Cc: name <email>"
WITH extracted_recipients AS (
  SELECT 
    em.id,
    array_agg(DISTINCT lower(match[1])) FILTER (WHERE match[1] IS NOT NULL) as found_emails
  FROM email_messages em
  CROSS JOIN LATERAL regexp_matches(
    em.body_preview,
    '(?:To|Cc|CC|Bcc|BCC):\s*(?:[^<]*<)?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>?',
    'gi'
  ) as match
  WHERE (em.recipients IS NULL OR array_length(em.recipients, 1) IS NULL OR array_length(em.recipients, 1) = 0)
    AND em.body_preview IS NOT NULL
  GROUP BY em.id
)
UPDATE email_messages em
SET recipients = er.found_emails
FROM extracted_recipients er
WHERE em.id = er.id
  AND er.found_emails IS NOT NULL
  AND array_length(er.found_emails, 1) > 0;