-- ============================================================
-- ENTERPRISE-GRADE ARCHITECTURE - Data Archiving System
-- ============================================================

-- Create archive schema
CREATE SCHEMA IF NOT EXISTS archive;

-- Archive table for old messages (structure mirrors messages)
CREATE TABLE IF NOT EXISTS archive.messages (
  id uuid PRIMARY KEY,
  conversation_id uuid,
  topic text,
  user_id uuid,
  extension text,
  is_from_contact boolean,
  content text,
  payload jsonb,
  event text,
  sent_at timestamptz,
  metadata jsonb,
  private boolean,
  updated_at timestamp,
  created_at timestamptz,
  whatsapp_message_id text,
  inserted_at timestamp,
  whatsapp_status text,
  media_id uuid,
  media_type text,
  media_filename text,
  archived_at timestamptz DEFAULT now()
);

-- Index for archived messages
CREATE INDEX IF NOT EXISTS idx_archive_messages_user ON archive.messages(user_id);
CREATE INDEX IF NOT EXISTS idx_archive_messages_conv ON archive.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_archive_messages_sent ON archive.messages(sent_at);

-- Storage snapshots for analytics pre-computation
CREATE TABLE IF NOT EXISTS public.storage_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  snapshot_date date NOT NULL,
  total_contacts int DEFAULT 0,
  total_messages bigint DEFAULT 0,
  total_media_files int DEFAULT 0,
  total_media_bytes bigint DEFAULT 0,
  total_document_files int DEFAULT 0,
  total_document_bytes bigint DEFAULT 0,
  media_by_type jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, snapshot_date)
);

-- RLS for storage snapshots
ALTER TABLE public.storage_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own snapshots"
ON public.storage_snapshots FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own snapshots"
ON public.storage_snapshots FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Bulk operation queue for tracking long-running operations
CREATE TABLE IF NOT EXISTS public.bulk_operation_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  operation_type text NOT NULL,
  target_ids uuid[] NOT NULL,
  status text DEFAULT 'pending',
  progress int DEFAULT 0,
  total_items int NOT NULL,
  completed_items int DEFAULT 0,
  failed_items int DEFAULT 0,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz
);

-- RLS for bulk operation queue
ALTER TABLE public.bulk_operation_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own operations"
ON public.bulk_operation_queue FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own operations"
ON public.bulk_operation_queue FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own operations"
ON public.bulk_operation_queue FOR UPDATE
USING (auth.uid() = user_id);

-- Query cache table for expensive query results
CREATE TABLE IF NOT EXISTS public.query_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  cache_key text NOT NULL,
  result jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  UNIQUE(user_id, cache_key)
);

-- Index for cache lookups
CREATE INDEX IF NOT EXISTS idx_query_cache_lookup ON public.query_cache(user_id, cache_key, expires_at);

-- RLS for query cache
ALTER TABLE public.query_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own cache"
ON public.query_cache FOR ALL
USING (auth.uid() = user_id);

-- Function to archive old messages (older than specified days)
CREATE OR REPLACE FUNCTION archive_old_messages(days_old int DEFAULT 730)
RETURNS TABLE(archived_count bigint, freed_bytes bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cutoff_date timestamptz;
  archived bigint := 0;
BEGIN
  cutoff_date := now() - (days_old || ' days')::interval;
  
  -- Move old messages to archive
  WITH moved AS (
    DELETE FROM public.messages
    WHERE sent_at < cutoff_date
    RETURNING *
  )
  INSERT INTO archive.messages 
  SELECT m.*, now() AS archived_at
  FROM moved m;
  
  GET DIAGNOSTICS archived = ROW_COUNT;
  
  RETURN QUERY SELECT archived, (archived * 500)::bigint; -- Estimate ~500 bytes per message
END;
$$;

-- Function to create daily storage snapshot
CREATE OR REPLACE FUNCTION create_storage_snapshot(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
    total_contacts = EXCLUDED.total_contacts,
    total_messages = EXCLUDED.total_messages,
    total_media_files = EXCLUDED.total_media_files,
    total_media_bytes = EXCLUDED.total_media_bytes,
    total_document_files = EXCLUDED.total_document_files,
    total_document_bytes = EXCLUDED.total_document_bytes;
END;
$$;

-- Function to clean expired cache entries
CREATE OR REPLACE FUNCTION clean_expired_cache()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count int;
BEGIN
  DELETE FROM query_cache WHERE expires_at < now();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Function to get or set cache
CREATE OR REPLACE FUNCTION get_or_set_cache(
  p_user_id uuid,
  p_cache_key text,
  p_ttl_seconds int DEFAULT 300
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cached_result jsonb;
BEGIN
  SELECT result INTO cached_result
  FROM query_cache
  WHERE user_id = p_user_id 
    AND cache_key = p_cache_key 
    AND expires_at > now();
  
  RETURN cached_result;
END;
$$;