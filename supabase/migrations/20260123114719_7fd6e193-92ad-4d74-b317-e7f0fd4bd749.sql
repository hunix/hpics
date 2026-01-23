-- Database cleanup and health monitoring functions

-- Function: Clean up stale bulk analysis items
CREATE OR REPLACE FUNCTION cleanup_stale_bulk_items(
  p_user_id UUID,
  p_days_old INTEGER DEFAULT 3
)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM bulk_analysis_items
  WHERE user_id = p_user_id
  AND status IN ('pending', 'failed')
  AND created_at < NOW() - (p_days_old || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function: Count duplicate profiles for a user
CREATE OR REPLACE FUNCTION count_duplicate_profiles(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  dup_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO dup_count FROM (
    SELECT 1
    FROM profiles
    WHERE user_id = p_user_id
    AND first_name IS NOT NULL
    GROUP BY LOWER(TRIM(first_name)), LOWER(TRIM(COALESCE(last_name, '')))
    HAVING COUNT(*) > 1
  ) subquery;
  RETURN dup_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function: Get database health metrics
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
    (SELECT COUNT(*) FROM bulk_analysis_items 
      WHERE user_id = p_user_id 
      AND status IN ('pending', 'failed') 
      AND created_at < NOW() - INTERVAL '3 days') AS stale_bulk_items,
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

-- Function: Find duplicate profile (for deduplication guard)
CREATE OR REPLACE FUNCTION find_duplicate_profile(
  p_user_id UUID,
  p_first_name TEXT,
  p_last_name TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  existing_id UUID;
BEGIN
  SELECT id INTO existing_id
  FROM profiles
  WHERE user_id = p_user_id
  AND LOWER(TRIM(first_name)) = LOWER(TRIM(p_first_name))
  AND (
    (p_last_name IS NULL AND last_name IS NULL) OR
    LOWER(TRIM(COALESCE(last_name, ''))) = LOWER(TRIM(COALESCE(p_last_name, '')))
  )
  LIMIT 1;
  
  RETURN existing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function: Batch merge all duplicates for a user
CREATE OR REPLACE FUNCTION batch_merge_duplicates(p_user_id UUID)
RETURNS TABLE (merged_count INTEGER, groups_processed INTEGER) AS $$
DECLARE
  dup_group RECORD;
  primary_id UUID;
  dup_id UUID;
  merge_count INTEGER := 0;
  group_count INTEGER := 0;
BEGIN
  FOR dup_group IN 
    SELECT LOWER(TRIM(first_name)) as fn, LOWER(TRIM(COALESCE(last_name, ''))) as ln,
           array_agg(id ORDER BY created_at ASC) as profile_ids
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