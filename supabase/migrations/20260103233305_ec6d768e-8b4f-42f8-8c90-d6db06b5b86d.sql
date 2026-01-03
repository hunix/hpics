-- Create table for tracking analysis sessions with pause/resume/skip capabilities
CREATE TABLE public.analysis_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  media_id UUID NOT NULL REFERENCES public.media(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, running, paused, completed, failed
  analysis_mode TEXT NOT NULL DEFAULT 'video', -- video, mosaic
  media_url TEXT NOT NULL,
  mosaic_url TEXT,
  context_type TEXT NOT NULL DEFAULT 'screening', -- screening, interview
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  total_duration_ms INTEGER DEFAULT 0,
  total_cost_cents INTEGER DEFAULT 0
);

-- Create table for individual analysis jobs within a session
CREATE TABLE public.analysis_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.analysis_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  analysis_type TEXT NOT NULL, -- behavioral, facial, body_language, vocal
  model_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, running, paused, completed, failed, skipped
  progress INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER DEFAULT 0,
  estimated_cost_cents INTEGER DEFAULT 0,
  actual_cost_cents INTEGER DEFAULT 0,
  input_tokens INTEGER,
  output_tokens INTEGER,
  result_id UUID, -- Reference to the specific analysis result table
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.analysis_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_jobs ENABLE ROW LEVEL SECURITY;

-- Create policies for analysis_sessions
CREATE POLICY "Users can view their own sessions" 
ON public.analysis_sessions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions" 
ON public.analysis_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" 
ON public.analysis_sessions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions" 
ON public.analysis_sessions FOR DELETE USING (auth.uid() = user_id);

-- Create policies for analysis_jobs
CREATE POLICY "Users can view their own jobs" 
ON public.analysis_jobs FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own jobs" 
ON public.analysis_jobs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own jobs" 
ON public.analysis_jobs FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own jobs" 
ON public.analysis_jobs FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for faster lookups
CREATE INDEX idx_analysis_sessions_user_id ON public.analysis_sessions(user_id);
CREATE INDEX idx_analysis_sessions_profile_id ON public.analysis_sessions(profile_id);
CREATE INDEX idx_analysis_jobs_session_id ON public.analysis_jobs(session_id);

-- Add trigger for updated_at
CREATE TRIGGER update_analysis_sessions_updated_at
BEFORE UPDATE ON public.analysis_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_analysis_jobs_updated_at
BEFORE UPDATE ON public.analysis_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();