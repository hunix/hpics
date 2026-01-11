-- Bulk Upload Sessions - Track overall upload operations
CREATE TABLE public.bulk_upload_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT,
  source_type TEXT NOT NULL DEFAULT 'file_selection' CHECK (source_type IN ('file_selection', 'zip_extraction', 'folder_drop')),
  status TEXT NOT NULL DEFAULT 'preparing' CHECK (status IN ('preparing', 'uploading', 'processing', 'paused', 'completed', 'failed', 'cancelled')),
  total_files INTEGER NOT NULL DEFAULT 0,
  completed_files INTEGER NOT NULL DEFAULT 0,
  failed_files INTEGER NOT NULL DEFAULT 0,
  skipped_files INTEGER NOT NULL DEFAULT 0,
  total_bytes BIGINT NOT NULL DEFAULT 0,
  uploaded_bytes BIGINT NOT NULL DEFAULT 0,
  auto_analyze BOOLEAN NOT NULL DEFAULT false,
  analysis_priority INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  paused_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Bulk Upload Items - Individual file tracking
CREATE TABLE public.bulk_upload_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.bulk_upload_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  filename TEXT NOT NULL,
  original_path TEXT,
  file_size BIGINT NOT NULL DEFAULT 0,
  mime_type TEXT,
  file_type TEXT CHECK (file_type IN ('image', 'video', 'audio', 'document', 'other')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'uploading', 'uploaded', 'failed', 'skipped', 'duplicate', 'cancelled')),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  storage_path TEXT,
  storage_bucket TEXT,
  media_id UUID REFERENCES public.media(id) ON DELETE SET NULL,
  document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  recording_id UUID REFERENCES public.meeting_recordings(id) ON DELETE SET NULL,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  error_message TEXT,
  content_hash TEXT,
  is_duplicate_of UUID REFERENCES public.bulk_upload_items(id),
  queued_for_analysis BOOLEAN NOT NULL DEFAULT false,
  analysis_job_id UUID,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX idx_bulk_upload_sessions_user_id ON public.bulk_upload_sessions(user_id);
CREATE INDEX idx_bulk_upload_sessions_status ON public.bulk_upload_sessions(status);
CREATE INDEX idx_bulk_upload_sessions_profile_id ON public.bulk_upload_sessions(profile_id);
CREATE INDEX idx_bulk_upload_items_session_id ON public.bulk_upload_items(session_id);
CREATE INDEX idx_bulk_upload_items_status ON public.bulk_upload_items(status);
CREATE INDEX idx_bulk_upload_items_user_id ON public.bulk_upload_items(user_id);
CREATE INDEX idx_bulk_upload_items_content_hash ON public.bulk_upload_items(content_hash);

-- Enable RLS
ALTER TABLE public.bulk_upload_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_upload_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bulk_upload_sessions
CREATE POLICY "Users can view their own upload sessions"
  ON public.bulk_upload_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own upload sessions"
  ON public.bulk_upload_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own upload sessions"
  ON public.bulk_upload_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own upload sessions"
  ON public.bulk_upload_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for bulk_upload_items
CREATE POLICY "Users can view their own upload items"
  ON public.bulk_upload_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own upload items"
  ON public.bulk_upload_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own upload items"
  ON public.bulk_upload_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own upload items"
  ON public.bulk_upload_items FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_bulk_upload_sessions_updated_at
  BEFORE UPDATE ON public.bulk_upload_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bulk_upload_items_updated_at
  BEFORE UPDATE ON public.bulk_upload_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update session stats when items change
CREATE OR REPLACE FUNCTION public.update_bulk_session_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.bulk_upload_sessions
  SET 
    completed_files = (
      SELECT COUNT(*) FROM public.bulk_upload_items 
      WHERE session_id = COALESCE(NEW.session_id, OLD.session_id) 
      AND status = 'uploaded'
    ),
    failed_files = (
      SELECT COUNT(*) FROM public.bulk_upload_items 
      WHERE session_id = COALESCE(NEW.session_id, OLD.session_id) 
      AND status = 'failed'
    ),
    skipped_files = (
      SELECT COUNT(*) FROM public.bulk_upload_items 
      WHERE session_id = COALESCE(NEW.session_id, OLD.session_id) 
      AND status IN ('skipped', 'duplicate', 'cancelled')
    ),
    uploaded_bytes = (
      SELECT COALESCE(SUM(file_size), 0) FROM public.bulk_upload_items 
      WHERE session_id = COALESCE(NEW.session_id, OLD.session_id) 
      AND status = 'uploaded'
    ),
    updated_at = now()
  WHERE id = COALESCE(NEW.session_id, OLD.session_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_session_stats_on_item_change
  AFTER INSERT OR UPDATE OR DELETE ON public.bulk_upload_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_bulk_session_stats();

-- Function to auto-complete session when all items processed
CREATE OR REPLACE FUNCTION public.check_bulk_session_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_session RECORD;
  v_pending_count INTEGER;
BEGIN
  SELECT * INTO v_session FROM public.bulk_upload_sessions 
  WHERE id = COALESCE(NEW.session_id, OLD.session_id);
  
  IF v_session.status = 'uploading' THEN
    SELECT COUNT(*) INTO v_pending_count 
    FROM public.bulk_upload_items 
    WHERE session_id = v_session.id 
    AND status IN ('pending', 'uploading');
    
    IF v_pending_count = 0 THEN
      UPDATE public.bulk_upload_sessions
      SET status = 'completed', completed_at = now()
      WHERE id = v_session.id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER check_session_completion
  AFTER UPDATE ON public.bulk_upload_items
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.check_bulk_session_completion();