-- Phase 7: additional auth.uid() guards on SECURITY DEFINER functions that
-- previously trusted a caller-supplied p_user_id parameter.

BEGIN;

-- ---------------------------------------------------------------------------
-- create_storage_snapshot: writes/updates storage_snapshots for p_user_id.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_storage_snapshot(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'forbidden: auth.uid() does not match p_user_id'
      USING ERRCODE = '42501';
  END IF;

  INSERT INTO storage_snapshots (
    user_id, snapshot_date, total_contacts, total_messages,
    total_media_files, total_media_bytes, total_document_files, total_document_bytes
  )
  SELECT
    p_user_id,
    CURRENT_DATE,
    (SELECT COUNT(*) FROM profiles WHERE user_id = p_user_id),
    (SELECT COUNT(*) FROM messages m JOIN conversations c ON c.id = m.conversation_id WHERE c.user_id = p_user_id),
    (SELECT COUNT(*) FROM media WHERE user_id = p_user_id),
    (SELECT COALESCE(SUM(file_size), 0) FROM media WHERE user_id = p_user_id),
    (SELECT COUNT(*) FROM documents WHERE user_id = p_user_id),
    (SELECT COALESCE(SUM(file_size), 0) FROM documents WHERE user_id = p_user_id)
  ON CONFLICT (user_id, snapshot_date) DO UPDATE SET
    total_contacts        = EXCLUDED.total_contacts,
    total_messages        = EXCLUDED.total_messages,
    total_media_files     = EXCLUDED.total_media_files,
    total_media_bytes     = EXCLUDED.total_media_bytes,
    total_document_files  = EXCLUDED.total_document_files,
    total_document_bytes  = EXCLUDED.total_document_bytes;
END;
$$;

-- ---------------------------------------------------------------------------
-- cleanup_stale_bulk_items: deletes pending/failed bulk items for p_user_id.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cleanup_stale_bulk_items(
  p_user_id UUID,
  p_days_old INTEGER DEFAULT 3
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'forbidden: auth.uid() does not match p_user_id'
      USING ERRCODE = '42501';
  END IF;

  DELETE FROM bulk_analysis_items
  WHERE session_id IN (
    SELECT id FROM bulk_analysis_sessions WHERE user_id = p_user_id
  )
    AND status IN ('pending', 'failed')
    AND created_at < NOW() - (p_days_old || ' days')::INTERVAL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- ---------------------------------------------------------------------------
-- get_account_storage_summary: read-only, but still leaks per-user totals if
-- the caller spoofs p_user_id. Guarded too.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_account_storage_summary(p_user_id UUID)
RETURNS TABLE (
  total_bytes BIGINT,
  media_bytes BIGINT,
  document_bytes BIGINT,
  recording_bytes BIGINT,
  message_count BIGINT,
  contact_count INTEGER,
  ai_tokens_used BIGINT,
  ai_cost_cents BIGINT,
  storage_quota_bytes BIGINT,
  usage_percentage REAL
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quota BIGINT := 10737418240; -- 10GB default quota
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'forbidden: auth.uid() does not match p_user_id'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  WITH media_stats AS (
    SELECT COALESCE(SUM(file_size), 0) AS size FROM media WHERE user_id = p_user_id
  ),
  doc_stats AS (
    SELECT COALESCE(SUM(file_size), 0) AS size FROM documents WHERE user_id = p_user_id
  ),
  recording_stats AS (
    SELECT COALESCE(SUM(file_size), 0) AS size FROM meeting_recordings WHERE user_id = p_user_id
  ),
  msg_stats AS (
    SELECT COUNT(*) AS cnt FROM messages WHERE user_id = p_user_id
  ),
  contact_stats AS (
    SELECT COUNT(*) AS cnt FROM profiles WHERE user_id = p_user_id
  ),
  ai_stats AS (
    SELECT
      COALESCE(SUM(total_tokens), 0) AS tokens,
      COALESCE(SUM(actual_cost_cents), 0) AS cost
    FROM ai_usage_logs
    WHERE user_id = p_user_id AND status = 'completed'
  )
  SELECT
    (SELECT size FROM media_stats) + (SELECT size FROM doc_stats) + (SELECT size FROM recording_stats),
    (SELECT size FROM media_stats),
    (SELECT size FROM doc_stats),
    (SELECT size FROM recording_stats),
    (SELECT cnt FROM msg_stats),
    (SELECT cnt FROM contact_stats)::INTEGER,
    (SELECT tokens FROM ai_stats),
    (SELECT cost FROM ai_stats),
    v_quota,
    ((SELECT size FROM media_stats) + (SELECT size FROM doc_stats) + (SELECT size FROM recording_stats))::REAL / v_quota * 100;
END;
$$;

COMMIT;
