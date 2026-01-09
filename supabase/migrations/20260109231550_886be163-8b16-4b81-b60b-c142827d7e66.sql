-- Create pgvector function for facial embedding similarity search
CREATE OR REPLACE FUNCTION match_facial_embeddings(
  query_embedding vector(512),
  match_threshold float DEFAULT 0.6,
  match_count int DEFAULT 10,
  p_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  profile_id uuid,
  first_name text,
  last_name text,
  avatar_url text,
  facial_confidence numeric,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cb.profile_id,
    p.first_name,
    p.last_name,
    p.avatar_url,
    cb.facial_confidence,
    1 - (cb.facial_embedding <=> query_embedding) as similarity
  FROM contact_biometrics cb
  JOIN profiles p ON p.id = cb.profile_id
  WHERE 
    cb.facial_embedding IS NOT NULL
    AND (p_user_id IS NULL OR cb.user_id = p_user_id)
    AND 1 - (cb.facial_embedding <=> query_embedding) >= match_threshold
  ORDER BY cb.facial_embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION match_facial_embeddings TO authenticated;

-- Create index for faster vector similarity search
CREATE INDEX IF NOT EXISTS idx_contact_biometrics_facial_embedding 
ON contact_biometrics 
USING ivfflat (facial_embedding vector_cosine_ops)
WITH (lists = 100);

-- Add detection_method column to media_contact_tags if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'media_contact_tags' AND column_name = 'detection_method'
  ) THEN
    ALTER TABLE media_contact_tags ADD COLUMN detection_method text DEFAULT 'manual';
  END IF;
END $$;