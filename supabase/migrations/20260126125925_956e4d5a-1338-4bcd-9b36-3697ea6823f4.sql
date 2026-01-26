-- Voice Analysis Sessions (parent) - tracks overall session state
CREATE TABLE public.voice_analysis_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT,
  status TEXT DEFAULT 'idle' CHECK (status IN ('idle', 'running', 'paused', 'completed', 'failed', 'cancelled')),
  processing_mode TEXT DEFAULT 'local' CHECK (processing_mode IN ('local', 'cloud', 'hybrid')),
  whisper_model TEXT DEFAULT 'small',
  total_items INTEGER DEFAULT 0,
  completed_items INTEGER DEFAULT 0,
  failed_items INTEGER DEFAULT 0,
  skipped_items INTEGER DEFAULT 0,
  current_item_id UUID,
  total_cost_cents INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Voice Analysis Items (children) - tracks each audio file
CREATE TABLE public.voice_analysis_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.voice_analysis_sessions(id) ON DELETE CASCADE,
  media_id UUID,
  recording_id UUID,
  source TEXT CHECK (source IN ('media', 'voice_recording_sessions')),
  file_url TEXT,
  file_name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'skipped')),
  queue_position INTEGER,
  transcription_text TEXT,
  detected_language TEXT,
  processing_time_ms INTEGER,
  error_message TEXT,
  error_type TEXT,
  can_retry BOOLEAN DEFAULT true,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 2,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Create indexes for performance
CREATE INDEX idx_voice_sessions_user_status ON public.voice_analysis_sessions(user_id, status);
CREATE INDEX idx_voice_items_session_status ON public.voice_analysis_items(session_id, status);
CREATE INDEX idx_voice_items_queue ON public.voice_analysis_items(session_id, queue_position) WHERE status = 'pending';

-- Enable RLS
ALTER TABLE public.voice_analysis_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_analysis_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sessions
CREATE POLICY "Users can view own voice sessions" 
  ON public.voice_analysis_sessions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own voice sessions" 
  ON public.voice_analysis_sessions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own voice sessions" 
  ON public.voice_analysis_sessions FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own voice sessions" 
  ON public.voice_analysis_sessions FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS Policies for items (via parent session ownership)
CREATE POLICY "Users can view own voice items" 
  ON public.voice_analysis_items FOR SELECT 
  USING (session_id IN (SELECT id FROM public.voice_analysis_sessions WHERE user_id = auth.uid()));

CREATE POLICY "Users can create own voice items" 
  ON public.voice_analysis_items FOR INSERT 
  WITH CHECK (session_id IN (SELECT id FROM public.voice_analysis_sessions WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own voice items" 
  ON public.voice_analysis_items FOR UPDATE 
  USING (session_id IN (SELECT id FROM public.voice_analysis_sessions WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own voice items" 
  ON public.voice_analysis_items FOR DELETE 
  USING (session_id IN (SELECT id FROM public.voice_analysis_sessions WHERE user_id = auth.uid()));

-- Enable Realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.voice_analysis_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.voice_analysis_items;

-- RPC for atomic progress increment
CREATE OR REPLACE FUNCTION public.increment_voice_session_progress(
  p_session_id UUID,
  p_is_completed BOOLEAN,
  p_is_failed BOOLEAN,
  p_is_skipped BOOLEAN DEFAULT FALSE,
  p_cost_cents INTEGER DEFAULT 0
) RETURNS VOID AS $$
BEGIN
  UPDATE public.voice_analysis_sessions SET
    completed_items = CASE WHEN p_is_completed THEN completed_items + 1 ELSE completed_items END,
    failed_items = CASE WHEN p_is_failed THEN failed_items + 1 ELSE failed_items END,
    skipped_items = CASE WHEN p_is_skipped THEN skipped_items + 1 ELSE skipped_items END,
    total_cost_cents = total_cost_cents + COALESCE(p_cost_cents, 0),
    updated_at = now()
  WHERE id = p_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_voice_session_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_voice_analysis_sessions_updated_at
  BEFORE UPDATE ON public.voice_analysis_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_voice_session_updated_at();