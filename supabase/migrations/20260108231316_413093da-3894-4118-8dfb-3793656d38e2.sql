-- Phase 1.1: Enhanced RAG 2.0 Database Enhancements (Fixed)

-- Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding_metadata table for tracking embedding quality
CREATE TABLE IF NOT EXISTS public.embedding_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_embedding_id UUID REFERENCES public.document_embeddings(id) ON DELETE CASCADE,
  chunk_index INTEGER DEFAULT 0,
  chunk_total INTEGER DEFAULT 1,
  token_count INTEGER,
  embedding_model TEXT DEFAULT 'text-embedding-3-small',
  embedding_dimensions INTEGER DEFAULT 1536,
  quality_score NUMERIC(4,3),
  is_stale BOOLEAN DEFAULT false,
  last_refreshed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID NOT NULL
);

-- Create RAG query logs for tracking search quality
CREATE TABLE IF NOT EXISTS public.rag_query_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  query_text TEXT NOT NULL,
  query_embedding vector(1536),
  result_count INTEGER DEFAULT 0,
  top_result_score NUMERIC(5,4),
  avg_result_score NUMERIC(5,4),
  search_mode TEXT DEFAULT 'hybrid',
  filters_applied JSONB,
  response_time_ms INTEGER,
  user_feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add missing columns to saved_searches if they don't exist
ALTER TABLE public.saved_searches ADD COLUMN IF NOT EXISTS query_text TEXT;
ALTER TABLE public.saved_searches ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ;

-- Create query suggestions table for auto-complete
CREATE TABLE IF NOT EXISTS public.query_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  suggestion_text TEXT NOT NULL,
  suggestion_type TEXT DEFAULT 'history',
  relevance_score NUMERIC(4,3) DEFAULT 0.5,
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enhanced match_documents function with hybrid search support
CREATE OR REPLACE FUNCTION public.match_documents_v2(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 10,
  p_user_id UUID DEFAULT NULL,
  p_profile_id UUID DEFAULT NULL,
  p_source_types TEXT[] DEFAULT NULL,
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  profile_id UUID,
  source_type TEXT,
  source_id TEXT,
  content TEXT,
  metadata JSONB,
  similarity FLOAT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    de.id,
    de.profile_id,
    de.source_type,
    de.source_id,
    de.content,
    de.metadata,
    1 - (de.embedding <=> query_embedding) AS similarity,
    de.created_at
  FROM document_embeddings de
  WHERE 
    (p_user_id IS NULL OR de.user_id = p_user_id)
    AND (p_profile_id IS NULL OR de.profile_id = p_profile_id)
    AND (p_source_types IS NULL OR de.source_type = ANY(p_source_types))
    AND (p_date_from IS NULL OR de.created_at >= p_date_from)
    AND (p_date_to IS NULL OR de.created_at <= p_date_to)
    AND (1 - (de.embedding <=> query_embedding)) > match_threshold
  ORDER BY de.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Keyword search function using full-text search
CREATE OR REPLACE FUNCTION public.keyword_search_documents(
  search_query TEXT,
  p_user_id UUID DEFAULT NULL,
  p_profile_id UUID DEFAULT NULL,
  p_source_types TEXT[] DEFAULT NULL,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  profile_id UUID,
  source_type TEXT,
  source_id TEXT,
  content TEXT,
  metadata JSONB,
  rank FLOAT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    de.id,
    de.profile_id,
    de.source_type,
    de.source_id,
    de.content,
    de.metadata,
    ts_rank_cd(to_tsvector('english', de.content), plainto_tsquery('english', search_query)) AS rank,
    de.created_at
  FROM document_embeddings de
  WHERE 
    (p_user_id IS NULL OR de.user_id = p_user_id)
    AND (p_profile_id IS NULL OR de.profile_id = p_profile_id)
    AND (p_source_types IS NULL OR de.source_type = ANY(p_source_types))
    AND to_tsvector('english', de.content) @@ plainto_tsquery('english', search_query)
  ORDER BY rank DESC
  LIMIT match_count;
END;
$$;

-- Enable RLS on new tables
ALTER TABLE public.embedding_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rag_query_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.query_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS Policies (drop if exist first to avoid conflicts)
DROP POLICY IF EXISTS "Users can manage their own embedding metadata" ON public.embedding_metadata;
CREATE POLICY "Users can manage their own embedding metadata"
  ON public.embedding_metadata FOR ALL
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own RAG query logs" ON public.rag_query_logs;
CREATE POLICY "Users can view their own RAG query logs"
  ON public.rag_query_logs FOR ALL
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own query suggestions" ON public.query_suggestions;
CREATE POLICY "Users can manage their own query suggestions"
  ON public.query_suggestions FOR ALL
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_embedding_metadata_document ON public.embedding_metadata(document_embedding_id);
CREATE INDEX IF NOT EXISTS idx_embedding_metadata_stale ON public.embedding_metadata(is_stale) WHERE is_stale = true;
CREATE INDEX IF NOT EXISTS idx_rag_query_logs_user ON public.rag_query_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_searches_user_pinned ON public.saved_searches(user_id, is_pinned DESC, last_used_at DESC);
CREATE INDEX IF NOT EXISTS idx_query_suggestions_user ON public.query_suggestions(user_id, relevance_score DESC);

-- Create full-text search index on document_embeddings content
CREATE INDEX IF NOT EXISTS idx_document_embeddings_content_fts 
  ON public.document_embeddings 
  USING gin(to_tsvector('english', content));