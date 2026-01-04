-- Enable the pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Add fields to contact_identity_documents for file storage and AI parsing
ALTER TABLE contact_identity_documents
ADD COLUMN IF NOT EXISTS storage_path text,
ADD COLUMN IF NOT EXISTS file_url text,
ADD COLUMN IF NOT EXISTS parsed_data jsonb,
ADD COLUMN IF NOT EXISTS ai_parsed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS reminder_days_before integer DEFAULT 60,
ADD COLUMN IF NOT EXISTS linked_event_id uuid REFERENCES events(id) ON DELETE SET NULL;

-- Create document_embeddings table for RAG
CREATE TABLE IF NOT EXISTS document_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source_type text NOT NULL,
  source_id uuid NOT NULL,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  content_summary text,
  embedding extensions.vector(1536),
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_document_embeddings_user ON document_embeddings(user_id);
CREATE INDEX IF NOT EXISTS idx_document_embeddings_source ON document_embeddings(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_document_embeddings_profile ON document_embeddings(profile_id);

-- Enable RLS
ALTER TABLE document_embeddings ENABLE ROW LEVEL SECURITY;

-- RLS policies for document_embeddings
CREATE POLICY "Users can view their own embeddings"
ON document_embeddings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own embeddings"
ON document_embeddings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own embeddings"
ON document_embeddings FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own embeddings"
ON document_embeddings FOR DELETE
USING (auth.uid() = user_id);

-- Function to search documents by text similarity (will use AI for semantic search in edge function)
CREATE OR REPLACE FUNCTION search_document_embeddings(
  p_user_id uuid,
  p_profile_id uuid DEFAULT NULL,
  p_source_type text DEFAULT NULL,
  p_limit int DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  source_type text,
  source_id uuid,
  profile_id uuid,
  content text,
  content_summary text,
  metadata jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    de.metadata
  FROM document_embeddings de
  WHERE
    de.user_id = p_user_id
    AND (p_profile_id IS NULL OR de.profile_id = p_profile_id)
    AND (p_source_type IS NULL OR de.source_type = p_source_type)
  ORDER BY de.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Add trigger for updated_at
CREATE TRIGGER update_document_embeddings_updated_at
BEFORE UPDATE ON document_embeddings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();