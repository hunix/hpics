-- Create integration test history table
CREATE TABLE IF NOT EXISTS public.integration_test_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  integration_id TEXT NOT NULL,
  secret_key TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  message TEXT,
  response_time_ms INTEGER,
  tested_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups by user and integration
CREATE INDEX idx_test_history_user_integration 
  ON public.integration_test_history(user_id, integration_id, tested_at DESC);

-- Index for recent tests
CREATE INDEX idx_test_history_recent 
  ON public.integration_test_history(user_id, tested_at DESC);

-- Enable RLS
ALTER TABLE public.integration_test_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own test history
CREATE POLICY "Users can view own test history" 
  ON public.integration_test_history 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can insert their own test history
CREATE POLICY "Users can insert own test history" 
  ON public.integration_test_history 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own test history
CREATE POLICY "Users can delete own test history" 
  ON public.integration_test_history 
  FOR DELETE 
  USING (auth.uid() = user_id);