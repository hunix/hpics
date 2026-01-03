-- Create AI usage logs table to track all AI API calls
CREATE TABLE public.ai_usage_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Request details
  function_name TEXT NOT NULL,
  model_name TEXT NOT NULL,
  provider TEXT NOT NULL,
  prompt_summary TEXT,
  
  -- Token usage
  input_tokens INTEGER,
  output_tokens INTEGER,
  total_tokens INTEGER,
  
  -- Cost tracking (in USD, stored as cents for precision)
  estimated_cost_cents INTEGER NOT NULL DEFAULT 0,
  actual_cost_cents INTEGER,
  
  -- Metadata
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  recording_id UUID REFERENCES public.meeting_recordings(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  response_time_ms INTEGER,
  
  -- Raw request/response for debugging
  request_metadata JSONB DEFAULT '{}'::jsonb,
  response_metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own AI usage logs"
ON public.ai_usage_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own AI usage logs"
ON public.ai_usage_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI usage logs"
ON public.ai_usage_logs FOR UPDATE
USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_ai_usage_logs_user_created ON public.ai_usage_logs(user_id, created_at DESC);
CREATE INDEX idx_ai_usage_logs_status ON public.ai_usage_logs(status);