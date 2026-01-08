-- Add backfill tracking columns
ALTER TABLE document_embeddings 
  ADD COLUMN IF NOT EXISTS backfill_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS backfill_error TEXT;

-- Add initial population flag to profiles
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS initial_intel_completed BOOLEAN DEFAULT FALSE;

-- Create batch job tracking table
CREATE TABLE IF NOT EXISTS batch_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  job_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  total_items INTEGER,
  processed_items INTEGER DEFAULT 0,
  failed_items INTEGER DEFAULT 0,
  error_message TEXT,
  estimated_cost_cents INTEGER,
  actual_cost_cents INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE batch_jobs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own batch jobs" ON batch_jobs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own batch jobs" ON batch_jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own batch jobs" ON batch_jobs
  FOR UPDATE USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_batch_jobs_user_status ON batch_jobs(user_id, status);
CREATE INDEX IF NOT EXISTS idx_batch_jobs_created ON batch_jobs(created_at DESC);