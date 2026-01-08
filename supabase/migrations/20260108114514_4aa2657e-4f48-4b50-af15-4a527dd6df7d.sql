-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding vector column to document_embeddings
ALTER TABLE public.document_embeddings 
ADD COLUMN IF NOT EXISTS embedding_vector vector(1536);

-- Create HNSW index for fast similarity search
CREATE INDEX IF NOT EXISTS idx_document_embeddings_vector 
ON public.document_embeddings 
USING hnsw (embedding_vector vector_cosine_ops);

-- Create enrichment queue table for auto-enrichment pipeline
CREATE TABLE IF NOT EXISTS public.enrichment_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  enrichment_type TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_id UUID,
  priority INTEGER DEFAULT 5,
  status TEXT DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient queue processing
CREATE INDEX IF NOT EXISTS idx_enrichment_queue_status_priority 
ON public.enrichment_queue (status, priority DESC, scheduled_for ASC)
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_enrichment_queue_user_profile 
ON public.enrichment_queue (user_id, profile_id);

-- Enable RLS on enrichment_queue
ALTER TABLE public.enrichment_queue ENABLE ROW LEVEL SECURITY;

-- RLS policies for enrichment_queue
CREATE POLICY "Users can view their own enrichment queue"
ON public.enrichment_queue FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert to their own enrichment queue"
ON public.enrichment_queue FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own enrichment queue"
ON public.enrichment_queue FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from their own enrichment queue"
ON public.enrichment_queue FOR DELETE
USING (auth.uid() = user_id);

-- Function to match documents by vector similarity
CREATE OR REPLACE FUNCTION public.match_documents(
  p_user_id UUID,
  p_query_embedding vector(1536),
  p_match_threshold FLOAT DEFAULT 0.7,
  p_match_count INT DEFAULT 10,
  p_profile_id UUID DEFAULT NULL,
  p_source_types TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  source_type TEXT,
  source_id UUID,
  profile_id UUID,
  content TEXT,
  content_summary TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    de.id,
    de.source_type,
    de.source_id,
    de.profile_id,
    de.content,
    de.content_summary,
    de.metadata,
    1 - (de.embedding_vector <=> p_query_embedding) as similarity
  FROM document_embeddings de
  WHERE de.user_id = p_user_id
    AND de.embedding_vector IS NOT NULL
    AND (p_profile_id IS NULL OR de.profile_id = p_profile_id)
    AND (p_source_types IS NULL OR de.source_type = ANY(p_source_types))
    AND 1 - (de.embedding_vector <=> p_query_embedding) > p_match_threshold
  ORDER BY de.embedding_vector <=> p_query_embedding
  LIMIT p_match_count;
END;
$$;

-- Trigger function to queue enrichment on new messages
CREATE OR REPLACE FUNCTION public.queue_semantic_enrichment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_profile_id UUID;
  v_priority INT;
BEGIN
  -- Get user_id and profile_id based on trigger source
  IF TG_TABLE_NAME = 'messages' THEN
    SELECT c.user_id, c.profile_id INTO v_user_id, v_profile_id
    FROM conversations c WHERE c.id = NEW.conversation_id;
    
    -- Only queue messages with substantial content
    IF length(COALESCE(NEW.content, '')) < 50 THEN
      RETURN NEW;
    END IF;
  ELSIF TG_TABLE_NAME = 'documents' THEN
    v_user_id := NEW.user_id;
    v_profile_id := NEW.profile_id;
  ELSIF TG_TABLE_NAME = 'contact_observations' THEN
    v_user_id := NEW.user_id;
    v_profile_id := NEW.profile_id;
  END IF;
  
  -- Calculate priority based on profile importance
  SELECT CASE WHEN p.is_favorite THEN 10 ELSE 5 END INTO v_priority
  FROM profiles p WHERE p.id = v_profile_id;
  
  -- Insert into enrichment queue
  INSERT INTO enrichment_queue (
    user_id, profile_id, enrichment_type, source_type, source_id, priority, metadata
  ) VALUES (
    v_user_id, v_profile_id, 'embedding', TG_TABLE_NAME, NEW.id, COALESCE(v_priority, 5),
    jsonb_build_object('table', TG_TABLE_NAME, 'operation', TG_OP)
  )
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create triggers for auto-enrichment
DROP TRIGGER IF EXISTS trg_queue_message_embedding ON public.messages;
CREATE TRIGGER trg_queue_message_embedding
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION queue_semantic_enrichment();

DROP TRIGGER IF EXISTS trg_queue_document_embedding ON public.documents;
CREATE TRIGGER trg_queue_document_embedding
  AFTER INSERT ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION queue_semantic_enrichment();

DROP TRIGGER IF EXISTS trg_queue_observation_embedding ON public.contact_observations;
CREATE TRIGGER trg_queue_observation_embedding
  AFTER INSERT ON public.contact_observations
  FOR EACH ROW
  EXECUTE FUNCTION queue_semantic_enrichment();

-- Add updated_at trigger
CREATE TRIGGER update_enrichment_queue_updated_at
  BEFORE UPDATE ON public.enrichment_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();