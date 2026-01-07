-- ENTERPRISE-GRADE ARCHITECTURE - Phase 1: Core Indexes and Materialized View

-- Drop existing view
DROP VIEW IF EXISTS contact_storage_stats;

-- Create materialized view
CREATE MATERIALIZED VIEW contact_storage_stats_mv AS
SELECT 
  p.id AS profile_id,
  p.user_id,
  p.first_name,
  p.last_name,
  p.avatar_url,
  COALESCE(media_agg.bytes, 0)::bigint AS media_bytes,
  COALESCE(media_agg.count, 0)::int AS media_count,
  COALESCE(doc_agg.bytes, 0)::bigint AS document_bytes,
  COALESCE(doc_agg.count, 0)::int AS document_count,
  COALESCE(msg_agg.count, 0)::int AS message_count,
  (COALESCE(media_agg.bytes, 0) + COALESCE(doc_agg.bytes, 0))::bigint AS total_bytes
FROM profiles p
LEFT JOIN LATERAL (
  SELECT SUM(file_size)::bigint AS bytes, COUNT(*)::int AS count
  FROM media WHERE profile_id = p.id
) media_agg ON true
LEFT JOIN LATERAL (
  SELECT SUM(file_size)::bigint AS bytes, COUNT(*)::int AS count
  FROM documents WHERE profile_id = p.id
) doc_agg ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*)::int AS count
  FROM messages msg
  JOIN conversations c ON c.id = msg.conversation_id
  WHERE c.profile_id = p.id
) msg_agg ON true;

-- Indexes for materialized view
CREATE UNIQUE INDEX idx_storage_stats_mv_profile ON contact_storage_stats_mv(profile_id);
CREATE INDEX idx_storage_stats_mv_user ON contact_storage_stats_mv(user_id);

-- Backward compatible view
CREATE OR REPLACE VIEW contact_storage_stats AS SELECT * FROM contact_storage_stats_mv;

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_contact_storage_stats()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY contact_storage_stats_mv;
END;
$$;

-- Critical composite indexes
CREATE INDEX IF NOT EXISTS idx_messages_conv_sent ON messages(conversation_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_profile_created ON media(profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conv_profile_last_msg ON conversations(profile_id, last_message_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_conv_user_last_msg ON conversations(user_id, last_message_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_profiles_user_names ON profiles(user_id, first_name, last_name);
CREATE INDEX IF NOT EXISTS idx_profiles_user_favorite ON profiles(user_id, is_favorite) WHERE is_favorite = true;
CREATE INDEX IF NOT EXISTS idx_documents_profile_created ON documents(profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_user_time ON contact_activity_feed(user_id, occurred_at DESC);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_messages_content_fts ON messages USING gin(to_tsvector('english', COALESCE(content, '')));
CREATE INDEX IF NOT EXISTS idx_profiles_search_fts ON profiles USING gin(
  to_tsvector('english', COALESCE(first_name, '') || ' ' || COALESCE(last_name, '') || ' ' || COALESCE(organization, ''))
);

-- Server-side contact search function
CREATE OR REPLACE FUNCTION search_contacts_v2(
  p_user_id uuid, p_search_query text DEFAULT NULL, p_relationship_type text DEFAULT NULL,
  p_is_favorite boolean DEFAULT NULL, p_limit int DEFAULT 50, p_offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid, first_name text, last_name text, organization text, job_title text,
  relationship_type text, avatar_url text, is_favorite boolean, tags text[], total_count bigint
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  WITH filtered AS (
    SELECT p.id, p.first_name, p.last_name, p.organization, p.job_title,
           p.relationship_type, p.avatar_url, p.is_favorite, p.tags, COUNT(*) OVER() AS total_count
    FROM profiles p
    WHERE p.user_id = p_user_id
      AND (p_search_query IS NULL OR to_tsvector('english', 
           COALESCE(p.first_name,'') || ' ' || COALESCE(p.last_name,'') || ' ' || COALESCE(p.organization,'')
         ) @@ plainto_tsquery('english', p_search_query))
      AND (p_relationship_type IS NULL OR p.relationship_type = p_relationship_type)
      AND (p_is_favorite IS NULL OR p.is_favorite = p_is_favorite)
  )
  SELECT f.id, f.first_name, f.last_name, f.organization, f.job_title,
         f.relationship_type, f.avatar_url, f.is_favorite, f.tags, f.total_count
  FROM filtered f ORDER BY f.is_favorite DESC, f.first_name LIMIT p_limit OFFSET p_offset;
END;
$$;

-- Server-side message search function
CREATE OR REPLACE FUNCTION search_messages_v2(
  p_user_id uuid, p_conversation_id uuid DEFAULT NULL, p_profile_id uuid DEFAULT NULL,
  p_search_query text DEFAULT NULL, p_limit int DEFAULT 50, p_cursor_time timestamptz DEFAULT NULL
)
RETURNS TABLE (id uuid, content text, is_from_contact boolean, sent_at timestamptz, conversation_id uuid, profile_id uuid)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT m.id, m.content, m.is_from_contact, m.sent_at, m.conversation_id, c.profile_id
  FROM messages m JOIN conversations c ON c.id = m.conversation_id
  WHERE c.user_id = p_user_id
    AND (p_conversation_id IS NULL OR m.conversation_id = p_conversation_id)
    AND (p_profile_id IS NULL OR c.profile_id = p_profile_id)
    AND (p_search_query IS NULL OR to_tsvector('english', COALESCE(m.content,'')) @@ plainto_tsquery('english', p_search_query))
    AND (p_cursor_time IS NULL OR m.sent_at < p_cursor_time)
  ORDER BY m.sent_at DESC LIMIT p_limit;
END;
$$;