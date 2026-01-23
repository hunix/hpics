-- Fix cleanup_stale_bulk_items to join through bulk_analysis_sessions
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

-- Fix get_database_health_metrics to join through bulk_analysis_sessions
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
      WHERE profiles.user_id = p_user_id AND first_name IS NOT NULL
      GROUP BY LOWER(TRIM(first_name)), LOWER(TRIM(COALESCE(last_name, '')))
      HAVING COUNT(*) > 1
    ) d) AS duplicate_groups,
    (SELECT COUNT(*) FROM bulk_analysis_items bi
      JOIN bulk_analysis_sessions bs ON bi.session_id = bs.id
      WHERE bs.user_id = p_user_id 
      AND bi.status IN ('pending', 'failed') 
      AND bi.created_at < NOW() - INTERVAL '3 days') AS stale_bulk_items,
    (SELECT COUNT(*) FROM profiles WHERE profiles.user_id = p_user_id) AS total_profiles,
    (SELECT COUNT(*) FROM profiles p 
      WHERE p.user_id = p_user_id 
      AND NOT EXISTS (SELECT 1 FROM media m WHERE m.profile_id = p.id)
      AND NOT EXISTS (SELECT 1 FROM ai_analyses a WHERE a.profile_id = p.id)) AS lonely_profiles,
    (SELECT COUNT(*) FROM media WHERE media.user_id = p_user_id) AS total_media,
    (SELECT COUNT(*) FROM media m 
      WHERE m.user_id = p_user_id 
      AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = m.profile_id)) AS orphaned_media;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;