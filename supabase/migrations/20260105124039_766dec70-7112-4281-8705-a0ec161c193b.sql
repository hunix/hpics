-- Create a view for contact storage analytics (not materialized for simplicity with RLS)
CREATE OR REPLACE VIEW contact_storage_stats AS
SELECT 
  p.id as profile_id,
  p.user_id,
  p.first_name,
  p.last_name,
  p.avatar_url,
  COALESCE((
    SELECT SUM(m.file_size) 
    FROM media m 
    WHERE m.profile_id = p.id
  ), 0)::bigint as media_bytes,
  COALESCE((
    SELECT COUNT(*) 
    FROM media m 
    WHERE m.profile_id = p.id
  ), 0)::int as media_count,
  COALESCE((
    SELECT SUM(d.file_size) 
    FROM documents d 
    WHERE d.profile_id = p.id
  ), 0)::bigint as document_bytes,
  COALESCE((
    SELECT COUNT(*) 
    FROM documents d 
    WHERE d.profile_id = p.id
  ), 0)::int as document_count,
  COALESCE((
    SELECT COUNT(*) 
    FROM conversations c 
    JOIN messages msg ON msg.conversation_id = c.id 
    WHERE c.profile_id = p.id
  ), 0)::int as message_count,
  (
    COALESCE((SELECT SUM(m.file_size) FROM media m WHERE m.profile_id = p.id), 0) +
    COALESCE((SELECT SUM(d.file_size) FROM documents d WHERE d.profile_id = p.id), 0)
  )::bigint as total_bytes
FROM profiles p;

-- Enable RLS-compatible access via function
CREATE OR REPLACE FUNCTION get_contact_storage_stats(p_user_id uuid)
RETURNS TABLE (
  profile_id uuid,
  user_id uuid,
  first_name text,
  last_name text,
  avatar_url text,
  media_bytes bigint,
  media_count int,
  document_bytes bigint,
  document_count int,
  message_count int,
  total_bytes bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    css.profile_id,
    css.user_id,
    css.first_name,
    css.last_name,
    css.avatar_url,
    css.media_bytes,
    css.media_count,
    css.document_bytes,
    css.document_count,
    css.message_count,
    css.total_bytes
  FROM contact_storage_stats css
  WHERE css.user_id = p_user_id
  ORDER BY css.total_bytes DESC;
$$;

-- Function to get storage for a single contact
CREATE OR REPLACE FUNCTION get_single_contact_storage(p_user_id uuid, p_profile_id uuid)
RETURNS TABLE (
  media_bytes bigint,
  media_count int,
  document_bytes bigint,
  document_count int,
  message_count int,
  total_bytes bigint,
  media_breakdown jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(m.file_size), 0)::bigint as media_bytes,
    COUNT(m.id)::int as media_count,
    COALESCE((SELECT SUM(d.file_size) FROM documents d WHERE d.profile_id = p_profile_id AND d.user_id = p_user_id), 0)::bigint as document_bytes,
    COALESCE((SELECT COUNT(*) FROM documents d WHERE d.profile_id = p_profile_id AND d.user_id = p_user_id), 0)::int as document_count,
    COALESCE((SELECT COUNT(*) FROM messages msg JOIN conversations c ON c.id = msg.conversation_id WHERE c.profile_id = p_profile_id AND c.user_id = p_user_id), 0)::int as message_count,
    (
      COALESCE(SUM(m.file_size), 0) +
      COALESCE((SELECT SUM(d.file_size) FROM documents d WHERE d.profile_id = p_profile_id AND d.user_id = p_user_id), 0)
    )::bigint as total_bytes,
    jsonb_build_object(
      'images', COALESCE(SUM(CASE WHEN m.media_type = 'image' THEN m.file_size ELSE 0 END), 0),
      'videos', COALESCE(SUM(CASE WHEN m.media_type = 'video' THEN m.file_size ELSE 0 END), 0),
      'audio', COALESCE(SUM(CASE WHEN m.media_type = 'audio' THEN m.file_size ELSE 0 END), 0),
      'image_count', COUNT(CASE WHEN m.media_type = 'image' THEN 1 END),
      'video_count', COUNT(CASE WHEN m.media_type = 'video' THEN 1 END),
      'audio_count', COUNT(CASE WHEN m.media_type = 'audio' THEN 1 END)
    ) as media_breakdown
  FROM media m
  WHERE m.profile_id = p_profile_id AND m.user_id = p_user_id
  GROUP BY m.profile_id;
END;
$$;

-- Function to get overall storage summary
CREATE OR REPLACE FUNCTION get_storage_summary(p_user_id uuid)
RETURNS TABLE (
  total_bytes bigint,
  total_media_bytes bigint,
  total_document_bytes bigint,
  total_media_files int,
  total_document_files int,
  total_messages int,
  contact_count int
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COALESCE(SUM(css.total_bytes), 0)::bigint as total_bytes,
    COALESCE(SUM(css.media_bytes), 0)::bigint as total_media_bytes,
    COALESCE(SUM(css.document_bytes), 0)::bigint as total_document_bytes,
    COALESCE(SUM(css.media_count), 0)::int as total_media_files,
    COALESCE(SUM(css.document_count), 0)::int as total_document_files,
    COALESCE(SUM(css.message_count), 0)::int as total_messages,
    COUNT(DISTINCT css.profile_id)::int as contact_count
  FROM contact_storage_stats css
  WHERE css.user_id = p_user_id AND css.total_bytes > 0;
$$;