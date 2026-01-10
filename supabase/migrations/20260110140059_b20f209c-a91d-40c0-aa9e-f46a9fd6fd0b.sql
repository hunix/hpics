-- Device sync tracking for multi-device ecosystem
CREATE TABLE public.device_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  device_id TEXT NOT NULL,
  device_type TEXT NOT NULL, -- 's25_ultra', 'tab_s9_ultra', 'watch_ultra', 'iphone_17_pro', 'ipad_pro', 'galaxy_buds_3_pro', 'watch_7_classic'
  device_name TEXT,
  sync_type TEXT NOT NULL, -- 'screenshot', 'voice', 'health', 'location', 'nfc', 'document', 'photo'
  data_count INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}',
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for device sync queries
CREATE INDEX idx_device_sync_user_device ON public.device_sync_log(user_id, device_type);
CREATE INDEX idx_device_sync_type ON public.device_sync_log(sync_type, synced_at DESC);

-- Enable RLS
ALTER TABLE public.device_sync_log ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own device sync logs"
ON public.device_sync_log FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own device sync logs"
ON public.device_sync_log FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own device sync logs"
ON public.device_sync_log FOR DELETE USING (auth.uid() = user_id);

-- Wearable biometrics during interactions
CREATE TABLE public.interaction_biometrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  interaction_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  avg_heart_rate INTEGER,
  max_heart_rate INTEGER,
  min_heart_rate INTEGER,
  heart_rate_variability NUMERIC,
  stress_level NUMERIC, -- 0-100 scale
  energy_level NUMERIC,
  location_lat NUMERIC,
  location_lng NUMERIC,
  location_name TEXT,
  duration_minutes INTEGER,
  steps_during INTEGER,
  calories_burned INTEGER,
  device_source TEXT, -- 'watch_ultra', 'watch_7', 'apple_watch', etc.
  raw_data JSONB DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for biometrics queries
CREATE INDEX idx_interaction_biometrics_user ON public.interaction_biometrics(user_id);
CREATE INDEX idx_interaction_biometrics_profile ON public.interaction_biometrics(profile_id);
CREATE INDEX idx_interaction_biometrics_date ON public.interaction_biometrics(interaction_date DESC);

-- Enable RLS
ALTER TABLE public.interaction_biometrics ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own interaction biometrics"
ON public.interaction_biometrics FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own interaction biometrics"
ON public.interaction_biometrics FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interaction biometrics"
ON public.interaction_biometrics FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interaction biometrics"
ON public.interaction_biometrics FOR DELETE USING (auth.uid() = user_id);

-- NFC tag associations for quick logging
CREATE TABLE public.nfc_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tag_id TEXT NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  tag_label TEXT,
  tag_type TEXT DEFAULT 'interaction', -- 'interaction', 'voice_record', 'checkin', 'custom'
  action_config JSONB DEFAULT '{}', -- Custom actions to trigger
  tap_count INTEGER DEFAULT 0,
  last_tapped_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, tag_id)
);

-- Index for NFC lookups
CREATE INDEX idx_nfc_tags_user ON public.nfc_tags(user_id);
CREATE INDEX idx_nfc_tags_tag_id ON public.nfc_tags(tag_id);

-- Enable RLS
ALTER TABLE public.nfc_tags ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own NFC tags"
ON public.nfc_tags FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own NFC tags"
ON public.nfc_tags FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own NFC tags"
ON public.nfc_tags FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own NFC tags"
ON public.nfc_tags FOR DELETE USING (auth.uid() = user_id);

-- Screenshot import queue for social profile parsing
CREATE TABLE public.screenshot_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  source_type TEXT NOT NULL, -- 'linkedin', 'instagram', 'twitter', 'facebook', 'whatsapp', 'business_card', 'document', 'other'
  image_urls TEXT[] NOT NULL,
  storage_paths TEXT[],
  extracted_data JSONB DEFAULT '{}',
  confidence_score NUMERIC,
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'review', 'completed', 'failed', 'rejected'
  error_message TEXT,
  device_source TEXT,
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for screenshot imports
CREATE INDEX idx_screenshot_imports_user ON public.screenshot_imports(user_id);
CREATE INDEX idx_screenshot_imports_status ON public.screenshot_imports(status);
CREATE INDEX idx_screenshot_imports_profile ON public.screenshot_imports(profile_id);
CREATE INDEX idx_screenshot_imports_source ON public.screenshot_imports(source_type);

-- Enable RLS
ALTER TABLE public.screenshot_imports ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own screenshot imports"
ON public.screenshot_imports FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own screenshot imports"
ON public.screenshot_imports FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own screenshot imports"
ON public.screenshot_imports FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own screenshot imports"
ON public.screenshot_imports FOR DELETE USING (auth.uid() = user_id);

-- Voice recording sessions for intel capture
CREATE TABLE public.voice_recording_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  recording_type TEXT NOT NULL, -- 'meeting', 'quick_signature', 'ambient', 'voice_note', 'call'
  title TEXT,
  duration_seconds INTEGER,
  file_url TEXT,
  storage_path TEXT,
  file_size_bytes BIGINT,
  audio_format TEXT, -- 'wav', 'mp3', 'webm', 'ogg'
  sample_rate INTEGER,
  channels INTEGER,
  transcription TEXT,
  transcription_status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  speaker_diarization JSONB DEFAULT '[]',
  detected_speakers TEXT[],
  keywords_detected TEXT[],
  sentiment_analysis JSONB,
  voice_signatures_extracted UUID[], -- References to biometric_samples
  device_source TEXT,
  location_lat NUMERIC,
  location_lng NUMERIC,
  location_name TEXT,
  participants UUID[], -- Profile IDs of participants
  metadata JSONB DEFAULT '{}',
  status TEXT DEFAULT 'recording', -- 'recording', 'paused', 'completed', 'processing', 'analyzed', 'failed'
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for voice recordings
CREATE INDEX idx_voice_recordings_user ON public.voice_recording_sessions(user_id);
CREATE INDEX idx_voice_recordings_profile ON public.voice_recording_sessions(profile_id);
CREATE INDEX idx_voice_recordings_type ON public.voice_recording_sessions(recording_type);
CREATE INDEX idx_voice_recordings_status ON public.voice_recording_sessions(status);
CREATE INDEX idx_voice_recordings_date ON public.voice_recording_sessions(started_at DESC);

-- Enable RLS
ALTER TABLE public.voice_recording_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own voice recordings"
ON public.voice_recording_sessions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own voice recordings"
ON public.voice_recording_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own voice recordings"
ON public.voice_recording_sessions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own voice recordings"
ON public.voice_recording_sessions FOR DELETE USING (auth.uid() = user_id);

-- Quick capture queue for all device captures
CREATE TABLE public.device_captures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  capture_type TEXT NOT NULL, -- 'screenshot', 'photo', 'voice', 'document', 'clipboard', 'nfc', 'location', 'health'
  source_app TEXT, -- 'linkedin', 'instagram', 'camera', 'share_target', 'clipboard', 'watch', 'buds'
  device_source TEXT,
  file_urls TEXT[],
  storage_paths TEXT[],
  raw_content TEXT, -- For clipboard text
  extracted_data JSONB DEFAULT '{}',
  ai_analysis JSONB,
  confidence_score NUMERIC,
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'review', 'applied', 'rejected', 'failed'
  error_message TEXT,
  location_lat NUMERIC,
  location_lng NUMERIC,
  location_name TEXT,
  metadata JSONB DEFAULT '{}',
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for device captures
CREATE INDEX idx_device_captures_user ON public.device_captures(user_id);
CREATE INDEX idx_device_captures_profile ON public.device_captures(profile_id);
CREATE INDEX idx_device_captures_type ON public.device_captures(capture_type);
CREATE INDEX idx_device_captures_status ON public.device_captures(status);
CREATE INDEX idx_device_captures_date ON public.device_captures(created_at DESC);

-- Enable RLS
ALTER TABLE public.device_captures ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own device captures"
ON public.device_captures FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own device captures"
ON public.device_captures FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own device captures"
ON public.device_captures FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own device captures"
ON public.device_captures FOR DELETE USING (auth.uid() = user_id);

-- Update triggers for all new tables
CREATE TRIGGER update_interaction_biometrics_updated_at
  BEFORE UPDATE ON public.interaction_biometrics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_nfc_tags_updated_at
  BEFORE UPDATE ON public.nfc_tags
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_screenshot_imports_updated_at
  BEFORE UPDATE ON public.screenshot_imports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_voice_recording_sessions_updated_at
  BEFORE UPDATE ON public.voice_recording_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_device_captures_updated_at
  BEFORE UPDATE ON public.device_captures
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();