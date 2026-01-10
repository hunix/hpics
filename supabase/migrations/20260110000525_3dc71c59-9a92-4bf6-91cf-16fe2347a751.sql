-- Create face_regions table for storing tagged face locations
CREATE TABLE public.face_regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  media_id UUID NOT NULL REFERENCES public.media(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Region coordinates (normalized 0-1 for any image size)
  x DECIMAL NOT NULL,
  y DECIMAL NOT NULL,
  width DECIMAL NOT NULL,
  height DECIMAL NOT NULL,
  shape TEXT NOT NULL DEFAULT 'rectangle',
  
  -- Cropped face storage
  cropped_storage_path TEXT,
  cropped_thumbnail_url TEXT,
  
  -- Detection metadata
  detection_method TEXT NOT NULL DEFAULT 'manual',
  confidence DECIMAL,
  verified BOOLEAN DEFAULT false,
  
  -- Embedding for matching
  embedding TEXT,
  descriptor TEXT,
  features JSONB,
  
  -- Linking & status
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  job_id UUID,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create face_scan_jobs table for resumable jobs
CREATE TABLE public.face_scan_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
  -- Job configuration
  job_type TEXT NOT NULL,
  model_key TEXT,
  scan_mode TEXT DEFAULT 'all',
  auto_tag_threshold DECIMAL DEFAULT 0.85,
  confirm_threshold DECIMAL DEFAULT 0.60,
  
  -- Scope
  media_ids TEXT[],
  profile_ids TEXT[],
  
  -- Progress tracking
  status TEXT DEFAULT 'pending',
  total_items INTEGER DEFAULT 0,
  processed_items INTEGER DEFAULT 0,
  successful_items INTEGER DEFAULT 0,
  failed_items INTEGER DEFAULT 0,
  skipped_items INTEGER DEFAULT 0,
  
  -- Track which items are done (for resume)
  processed_media_ids TEXT[] DEFAULT '{}',
  failed_media_ids JSONB DEFAULT '[]',
  current_batch_index INTEGER DEFAULT 0,
  
  -- Statistics
  faces_detected INTEGER DEFAULT 0,
  faces_matched INTEGER DEFAULT 0,
  faces_auto_tagged INTEGER DEFAULT 0,
  faces_pending_review INTEGER DEFAULT 0,
  
  -- Cost tracking
  estimated_cost_cents INTEGER,
  actual_cost_cents INTEGER DEFAULT 0,
  tokens_used INTEGER DEFAULT 0,
  
  -- Timing
  started_at TIMESTAMPTZ,
  paused_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_progress_at TIMESTAMPTZ,
  
  -- Error handling
  last_error TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for face_regions
CREATE INDEX idx_face_regions_media ON public.face_regions(media_id);
CREATE INDEX idx_face_regions_profile ON public.face_regions(profile_id);
CREATE INDEX idx_face_regions_user_status ON public.face_regions(user_id, status);
CREATE INDEX idx_face_regions_detection ON public.face_regions(detection_method);
CREATE INDEX idx_face_regions_job ON public.face_regions(job_id);

-- Indexes for face_scan_jobs
CREATE INDEX idx_face_scan_jobs_user ON public.face_scan_jobs(user_id);
CREATE INDEX idx_face_scan_jobs_status ON public.face_scan_jobs(status);

-- Enable RLS
ALTER TABLE public.face_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.face_scan_jobs ENABLE ROW LEVEL SECURITY;

-- RLS policies for face_regions
CREATE POLICY "Users can view their own face regions"
ON public.face_regions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own face regions"
ON public.face_regions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own face regions"
ON public.face_regions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own face regions"
ON public.face_regions FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for face_scan_jobs
CREATE POLICY "Users can view their own face scan jobs"
ON public.face_scan_jobs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own face scan jobs"
ON public.face_scan_jobs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own face scan jobs"
ON public.face_scan_jobs FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own face scan jobs"
ON public.face_scan_jobs FOR DELETE
USING (auth.uid() = user_id);

-- Enable realtime for job progress
ALTER PUBLICATION supabase_realtime ADD TABLE public.face_scan_jobs;

-- Update trigger for face_regions
CREATE TRIGGER update_face_regions_updated_at
BEFORE UPDATE ON public.face_regions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update trigger for face_scan_jobs
CREATE TRIGGER update_face_scan_jobs_updated_at
BEFORE UPDATE ON public.face_scan_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();