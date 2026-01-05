-- Add AI metadata columns to media table
ALTER TABLE media ADD COLUMN IF NOT EXISTS ai_metadata JSONB DEFAULT NULL;
ALTER TABLE media ADD COLUMN IF NOT EXISTS ai_metadata_generated_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE media ADD COLUMN IF NOT EXISTS ai_model_used TEXT DEFAULT NULL;
ALTER TABLE media ADD COLUMN IF NOT EXISTS ai_generation_status TEXT DEFAULT 'pending';
ALTER TABLE media ADD COLUMN IF NOT EXISTS ai_generation_error TEXT DEFAULT NULL;

-- Add AI metadata columns to documents table
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ai_metadata JSONB DEFAULT NULL;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ai_metadata_generated_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ai_model_used TEXT DEFAULT NULL;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ai_generation_status TEXT DEFAULT 'pending';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ai_generation_error TEXT DEFAULT NULL;

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_media_ai_status ON media(ai_generation_status);
CREATE INDEX IF NOT EXISTS idx_media_ai_metadata ON media USING GIN(ai_metadata);
CREATE INDEX IF NOT EXISTS idx_documents_ai_status ON documents(ai_generation_status);
CREATE INDEX IF NOT EXISTS idx_documents_ai_metadata ON documents USING GIN(ai_metadata);

-- Create job queue table for bulk processing
CREATE TABLE IF NOT EXISTS media_metadata_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  media_id UUID REFERENCES media(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL DEFAULT 'generate',
  status TEXT DEFAULT 'pending',
  priority INTEGER DEFAULT 0,
  model_key TEXT DEFAULT 'google/gemini-2.5-flash',
  result JSONB,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  estimated_cost_cents INTEGER,
  actual_cost_cents INTEGER,
  CONSTRAINT valid_target CHECK (
    (media_id IS NOT NULL AND document_id IS NULL) OR
    (media_id IS NULL AND document_id IS NOT NULL)
  )
);

-- Enable RLS on jobs table
ALTER TABLE media_metadata_jobs ENABLE ROW LEVEL SECURITY;

-- RLS policies for jobs table
CREATE POLICY "Users can view their own jobs"
  ON media_metadata_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own jobs"
  ON media_metadata_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own jobs"
  ON media_metadata_jobs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own jobs"
  ON media_metadata_jobs FOR DELETE
  USING (auth.uid() = user_id);

-- Index for job queue processing
CREATE INDEX IF NOT EXISTS idx_metadata_jobs_status ON media_metadata_jobs(status, priority DESC, created_at);
CREATE INDEX IF NOT EXISTS idx_metadata_jobs_user ON media_metadata_jobs(user_id);