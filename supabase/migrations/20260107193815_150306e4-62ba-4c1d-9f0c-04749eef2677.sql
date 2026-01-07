-- Phase 1: Server-side media folders aggregation function
CREATE OR REPLACE FUNCTION public.get_media_folders(p_user_id uuid)
RETURNS TABLE (
  profile_id uuid,
  first_name text,
  last_name text,
  total_files bigint,
  image_count bigint,
  audio_count bigint,
  video_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    m.profile_id,
    p.first_name,
    p.last_name,
    COUNT(*) as total_files,
    COUNT(*) FILTER (WHERE m.mime_type LIKE 'image/%') as image_count,
    COUNT(*) FILTER (WHERE m.mime_type LIKE 'audio/%') as audio_count,
    COUNT(*) FILTER (WHERE m.mime_type LIKE 'video/%') as video_count
  FROM media m
  JOIN profiles p ON p.id = m.profile_id
  WHERE m.user_id = p_user_id
    AND m.profile_id IS NOT NULL
  GROUP BY m.profile_id, p.first_name, p.last_name
  ORDER BY COUNT(*) DESC;
$$;

-- Phase 2: Server-side document folders aggregation function
CREATE OR REPLACE FUNCTION public.get_document_folders(p_user_id uuid)
RETURNS TABLE (
  profile_id uuid,
  first_name text,
  last_name text,
  total_files bigint,
  total_bytes bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    d.profile_id,
    p.first_name,
    p.last_name,
    COUNT(*) as total_files,
    COALESCE(SUM(d.file_size), 0) as total_bytes
  FROM documents d
  JOIN profiles p ON p.id = d.profile_id
  WHERE d.user_id = p_user_id
    AND d.profile_id IS NOT NULL
  GROUP BY d.profile_id, p.first_name, p.last_name
  ORDER BY COUNT(*) DESC;
$$;

-- Phase 4: Notification function for materialized view refresh
CREATE OR REPLACE FUNCTION public.notify_storage_stats_refresh()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Use pg_notify to signal that stats need refresh
  PERFORM pg_notify('storage_stats_changed', TG_TABLE_NAME);
  RETURN NULL;
END;
$$;

-- Create triggers on media table for refresh notification
DROP TRIGGER IF EXISTS tr_media_notify_stats ON media;
CREATE TRIGGER tr_media_notify_stats
AFTER INSERT OR DELETE ON media
FOR EACH STATEMENT
EXECUTE FUNCTION notify_storage_stats_refresh();

-- Create triggers on documents table for refresh notification
DROP TRIGGER IF EXISTS tr_documents_notify_stats ON documents;
CREATE TRIGGER tr_documents_notify_stats
AFTER INSERT OR DELETE ON documents
FOR EACH STATEMENT
EXECUTE FUNCTION notify_storage_stats_refresh();