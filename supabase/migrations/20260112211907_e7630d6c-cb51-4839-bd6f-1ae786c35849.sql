-- Create capture_upload_progress table for tracking server-side chunked uploads
CREATE TABLE public.capture_upload_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  local_capture_id TEXT NOT NULL,
  total_chunks INTEGER NOT NULL,
  uploaded_chunks INTEGER DEFAULT 0,
  total_size BIGINT DEFAULT 0,
  storage_path TEXT,
  storage_bucket TEXT DEFAULT 'media',
  mime_type TEXT,
  checksum TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'uploading', 'completed', 'failed')),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  capture_type TEXT CHECK (capture_type IN ('photo', 'video', 'voice')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, local_capture_id)
);

-- Enable RLS
ALTER TABLE public.capture_upload_progress ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own capture progress"
  ON public.capture_upload_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own capture progress"
  ON public.capture_upload_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own capture progress"
  ON public.capture_upload_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own capture progress"
  ON public.capture_upload_progress FOR DELETE
  USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX idx_capture_upload_progress_user_status 
  ON public.capture_upload_progress(user_id, status);

CREATE INDEX idx_capture_upload_progress_local_id 
  ON public.capture_upload_progress(local_capture_id);

-- Trigger for updated_at
CREATE TRIGGER update_capture_upload_progress_updated_at
  BEFORE UPDATE ON public.capture_upload_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();