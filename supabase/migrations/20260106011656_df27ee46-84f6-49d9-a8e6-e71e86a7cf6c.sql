-- Create bulk_analysis_sessions table for persistent session tracking
CREATE TABLE public.bulk_analysis_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  -- pending, queued, running, paused, completed, failed, cancelled
  
  -- Scope configuration
  scope_type TEXT NOT NULL DEFAULT 'single_contact', -- 'single_contact', 'multiple_contacts', 'all_contacts', 'unanalyzed_only'
  profile_ids UUID[],
  media_types TEXT[], -- ['image', 'video', 'audio', 'document']
  analysis_modes TEXT[],
  analysis_context JSONB,
  analysis_depth TEXT DEFAULT 'standard',
  
  -- Progress tracking
  total_items INTEGER DEFAULT 0,
  completed_items INTEGER DEFAULT 0,
  failed_items INTEGER DEFAULT 0,
  skipped_items INTEGER DEFAULT 0,
  current_item_index INTEGER DEFAULT 0,
  
  -- Scheduling
  scheduled_for TIMESTAMPTZ,
  priority INTEGER DEFAULT 5, -- 1-10, higher = more urgent
  
  -- Budget controls
  max_cost_cents INTEGER,
  current_cost_cents INTEGER DEFAULT 0,
  stop_on_budget_exceeded BOOLEAN DEFAULT true,
  
  -- Aggregation settings
  auto_aggregate BOOLEAN DEFAULT true,
  trigger_deep_analysis BOOLEAN DEFAULT false,
  aggregation_result JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  paused_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  estimated_completion TIMESTAMPTZ,
  
  -- Error tracking
  last_error TEXT,
  error_count INTEGER DEFAULT 0
);

-- Create bulk_analysis_items table for individual items in a session
CREATE TABLE public.bulk_analysis_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.bulk_analysis_sessions(id) ON DELETE CASCADE,
  
  -- Target reference
  media_id UUID REFERENCES public.media(id) ON DELETE SET NULL,
  document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  media_type TEXT NOT NULL,
  media_url TEXT,
  storage_path TEXT,
  file_name TEXT,
  file_size BIGINT,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending',
  -- pending, queued, running, completed, failed, skipped
  queue_position INTEGER,
  priority_score NUMERIC DEFAULT 0,
  priority_boost INTEGER DEFAULT 0,
  
  -- Results
  analysis_id UUID REFERENCES public.media_analyses(id) ON DELETE SET NULL,
  result JSONB,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  -- Timing
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  processing_time_ms INTEGER,
  
  -- Cost tracking
  estimated_cost_cents INTEGER,
  actual_cost_cents INTEGER
);

-- Create indexes for performance
CREATE INDEX idx_bulk_sessions_user_status ON public.bulk_analysis_sessions(user_id, status);
CREATE INDEX idx_bulk_sessions_scheduled ON public.bulk_analysis_sessions(scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX idx_bulk_items_session_status ON public.bulk_analysis_items(session_id, status);
CREATE INDEX idx_bulk_items_queue_position ON public.bulk_analysis_items(session_id, queue_position);
CREATE INDEX idx_bulk_items_priority ON public.bulk_analysis_items(session_id, priority_score DESC);

-- Enable RLS
ALTER TABLE public.bulk_analysis_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_analysis_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for bulk_analysis_sessions
CREATE POLICY "Users can view their own bulk sessions"
ON public.bulk_analysis_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bulk sessions"
ON public.bulk_analysis_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bulk sessions"
ON public.bulk_analysis_sessions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bulk sessions"
ON public.bulk_analysis_sessions FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for bulk_analysis_items
CREATE POLICY "Users can view items in their sessions"
ON public.bulk_analysis_items FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.bulk_analysis_sessions s 
  WHERE s.id = session_id AND s.user_id = auth.uid()
));

CREATE POLICY "Users can create items in their sessions"
ON public.bulk_analysis_items FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.bulk_analysis_sessions s 
  WHERE s.id = session_id AND s.user_id = auth.uid()
));

CREATE POLICY "Users can update items in their sessions"
ON public.bulk_analysis_items FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.bulk_analysis_sessions s 
  WHERE s.id = session_id AND s.user_id = auth.uid()
));

CREATE POLICY "Users can delete items in their sessions"
ON public.bulk_analysis_items FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.bulk_analysis_sessions s 
  WHERE s.id = session_id AND s.user_id = auth.uid()
));

-- Trigger to update updated_at
CREATE TRIGGER update_bulk_sessions_updated_at
  BEFORE UPDATE ON public.bulk_analysis_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for progress tracking
ALTER PUBLICATION supabase_realtime ADD TABLE public.bulk_analysis_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bulk_analysis_items;