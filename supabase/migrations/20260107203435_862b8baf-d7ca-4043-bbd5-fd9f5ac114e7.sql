-- Create paginated function for contact media
CREATE OR REPLACE FUNCTION public.get_contact_media_paginated(
  p_user_id uuid,
  p_profile_id uuid,
  p_media_type text DEFAULT NULL,
  p_search_query text DEFAULT NULL,
  p_sort_by text DEFAULT 'created_at',
  p_sort_order text DEFAULT 'desc',
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  profile_id uuid,
  caption text,
  file_url text,
  thumbnail_url text,
  file_size integer,
  mime_type text,
  storage_path text,
  ai_metadata jsonb,
  ai_generation_status text,
  created_at timestamptz,
  total_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH filtered AS (
    SELECT 
      m.id,
      m.profile_id,
      m.caption,
      m.file_url,
      m.thumbnail_url,
      m.file_size,
      m.mime_type,
      m.storage_path,
      m.ai_metadata,
      m.ai_generation_status,
      m.created_at,
      COUNT(*) OVER() AS total_count
    FROM media m
    WHERE m.user_id = p_user_id
      AND m.profile_id = p_profile_id
      AND (p_media_type IS NULL OR 
           (p_media_type = 'image' AND m.mime_type LIKE 'image/%') OR
           (p_media_type = 'video' AND m.mime_type LIKE 'video/%') OR
           (p_media_type = 'audio' AND m.mime_type LIKE 'audio/%'))
      AND (p_search_query IS NULL OR m.caption ILIKE '%' || p_search_query || '%')
  )
  SELECT f.id, f.profile_id, f.caption, f.file_url, f.thumbnail_url,
         f.file_size, f.mime_type, f.storage_path, f.ai_metadata,
         f.ai_generation_status, f.created_at, f.total_count
  FROM filtered f
  ORDER BY
    CASE WHEN p_sort_by = 'created_at' AND p_sort_order = 'desc' THEN f.created_at END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'created_at' AND p_sort_order = 'asc' THEN f.created_at END ASC NULLS LAST,
    CASE WHEN p_sort_by = 'file_size' AND p_sort_order = 'desc' THEN f.file_size END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'file_size' AND p_sort_order = 'asc' THEN f.file_size END ASC NULLS LAST
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- Create function to get total media count (for bulk analysis)
CREATE OR REPLACE FUNCTION public.get_contact_media_counts(
  p_user_id uuid,
  p_profile_id uuid DEFAULT NULL,
  p_skip_analyzed boolean DEFAULT false
)
RETURNS TABLE(
  image_count bigint,
  video_count bigint,
  audio_count bigint,
  total_count bigint,
  analyzed_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    COUNT(*) FILTER (WHERE m.mime_type LIKE 'image/%') as image_count,
    COUNT(*) FILTER (WHERE m.mime_type LIKE 'video/%') as video_count,
    COUNT(*) FILTER (WHERE m.mime_type LIKE 'audio/%') as audio_count,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE m.ai_metadata IS NOT NULL) as analyzed_count
  FROM media m
  WHERE m.user_id = p_user_id
    AND (p_profile_id IS NULL OR m.profile_id = p_profile_id)
    AND (NOT p_skip_analyzed OR m.ai_metadata IS NULL);
$$;

-- Create function to get all media IDs for bulk analysis (paginated)
CREATE OR REPLACE FUNCTION public.get_media_ids_for_analysis(
  p_user_id uuid,
  p_profile_id uuid DEFAULT NULL,
  p_media_types text[] DEFAULT NULL,
  p_skip_analyzed boolean DEFAULT true,
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  mime_type text,
  file_size integer,
  storage_path text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT m.id, m.mime_type, m.file_size, m.storage_path
  FROM media m
  WHERE m.user_id = p_user_id
    AND (p_profile_id IS NULL OR m.profile_id = p_profile_id)
    AND (p_media_types IS NULL OR 
         ('image' = ANY(p_media_types) AND m.mime_type LIKE 'image/%') OR
         ('video' = ANY(p_media_types) AND m.mime_type LIKE 'video/%') OR
         ('audio' = ANY(p_media_types) AND m.mime_type LIKE 'audio/%'))
    AND (NOT p_skip_analyzed OR m.ai_metadata IS NULL)
  ORDER BY m.created_at DESC
  LIMIT p_limit OFFSET p_offset;
$$;