-- Intelligence Sessions: Persists overall generation session state
CREATE TABLE public.intelligence_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  force_refresh BOOLEAN DEFAULT false,
  total_tasks INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  failed_tasks INTEGER DEFAULT 0,
  skipped_tasks INTEGER DEFAULT 0,
  current_category TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  resumed_at TIMESTAMPTZ,
  paused_at TIMESTAMPTZ
);

-- Intelligence Session Tasks: Persists individual task state for resume capability
CREATE TABLE public.intelligence_session_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.intelligence_sessions(id) ON DELETE CASCADE,
  task_name TEXT NOT NULL,
  edge_function TEXT NOT NULL,
  analysis_type TEXT,
  category TEXT NOT NULL,
  priority INTEGER DEFAULT 5,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  result JSONB,
  error_message TEXT,
  error_details JSONB,
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.intelligence_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intelligence_session_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for intelligence_sessions
CREATE POLICY "Users can view their own sessions"
  ON public.intelligence_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions"
  ON public.intelligence_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON public.intelligence_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
  ON public.intelligence_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for intelligence_session_tasks
CREATE POLICY "Users can view tasks for their sessions"
  ON public.intelligence_session_tasks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.intelligence_sessions s
    WHERE s.id = session_id AND s.user_id = auth.uid()
  ));

CREATE POLICY "Users can create tasks for their sessions"
  ON public.intelligence_session_tasks FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.intelligence_sessions s
    WHERE s.id = session_id AND s.user_id = auth.uid()
  ));

CREATE POLICY "Users can update tasks for their sessions"
  ON public.intelligence_session_tasks FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.intelligence_sessions s
    WHERE s.id = session_id AND s.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete tasks for their sessions"
  ON public.intelligence_session_tasks FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.intelligence_sessions s
    WHERE s.id = session_id AND s.user_id = auth.uid()
  ));

-- Indexes for performance
CREATE INDEX idx_intelligence_sessions_user_id ON public.intelligence_sessions(user_id);
CREATE INDEX idx_intelligence_sessions_profile_id ON public.intelligence_sessions(profile_id);
CREATE INDEX idx_intelligence_sessions_status ON public.intelligence_sessions(status);
CREATE INDEX idx_intelligence_session_tasks_session_id ON public.intelligence_session_tasks(session_id);
CREATE INDEX idx_intelligence_session_tasks_status ON public.intelligence_session_tasks(status);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.intelligence_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.intelligence_session_tasks;

-- Function to update session progress
CREATE OR REPLACE FUNCTION public.update_intelligence_session_progress()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.intelligence_sessions
  SET 
    completed_tasks = (SELECT COUNT(*) FROM public.intelligence_session_tasks WHERE session_id = NEW.session_id AND status = 'completed'),
    failed_tasks = (SELECT COUNT(*) FROM public.intelligence_session_tasks WHERE session_id = NEW.session_id AND status = 'failed'),
    skipped_tasks = (SELECT COUNT(*) FROM public.intelligence_session_tasks WHERE session_id = NEW.session_id AND status = 'skipped'),
    updated_at = now()
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-update session progress when tasks change
CREATE TRIGGER trigger_update_session_progress
  AFTER UPDATE OF status ON public.intelligence_session_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_intelligence_session_progress();