-- Add new columns to contact_biometrics for advanced biometric signatures
ALTER TABLE public.contact_biometrics 
ADD COLUMN IF NOT EXISTS facial_multi_angle_data JSONB,
ADD COLUMN IF NOT EXISTS facial_unique_identifiers JSONB,
ADD COLUMN IF NOT EXISTS facial_age_estimation JSONB,
ADD COLUMN IF NOT EXISTS body_measurements JSONB,
ADD COLUMN IF NOT EXISTS body_language_baseline JSONB,
ADD COLUMN IF NOT EXISTS gait_patterns JSONB,
ADD COLUMN IF NOT EXISTS handwriting_features JSONB,
ADD COLUMN IF NOT EXISTS handwriting_samples_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS handwriting_confidence NUMERIC,
ADD COLUMN IF NOT EXISTS handwriting_last_updated TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS signature_features JSONB,
ADD COLUMN IF NOT EXISTS signature_samples_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS signature_confidence NUMERIC,
ADD COLUMN IF NOT EXISTS signature_last_updated TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS fingerprint_data JSONB,
ADD COLUMN IF NOT EXISTS fingerprint_samples_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS voice_speaker_profile JSONB,
ADD COLUMN IF NOT EXISTS voice_emotional_baseline JSONB,
ADD COLUMN IF NOT EXISTS voice_deception_baseline JSONB,
ADD COLUMN IF NOT EXISTS cross_id_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS cross_id_matches JSONB,
ADD COLUMN IF NOT EXISTS detected_in_contacts JSONB,
ADD COLUMN IF NOT EXISTS signature_strength NUMERIC DEFAULT 0;

-- Create biometric_enrollment_sessions table
CREATE TABLE IF NOT EXISTS public.biometric_enrollment_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  session_type TEXT NOT NULL,
  samples_uploaded INTEGER DEFAULT 0,
  samples_required INTEGER DEFAULT 5,
  quality_scores JSONB DEFAULT '[]'::jsonb,
  aggregate_signature JSONB,
  status TEXT DEFAULT 'in_progress',
  ai_model TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Enable RLS on biometric_enrollment_sessions
ALTER TABLE public.biometric_enrollment_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for biometric_enrollment_sessions
CREATE POLICY "Users can view their own enrollment sessions"
  ON public.biometric_enrollment_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own enrollment sessions"
  ON public.biometric_enrollment_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own enrollment sessions"
  ON public.biometric_enrollment_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own enrollment sessions"
  ON public.biometric_enrollment_sessions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create cross_contact_detections table for tracking where contacts appear
CREATE TABLE IF NOT EXISTS public.cross_contact_detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  detected_profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  owner_profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  media_id UUID REFERENCES media(id) ON DELETE CASCADE,
  detection_type TEXT NOT NULL,
  confidence_score NUMERIC,
  timestamp_in_media TEXT,
  detected_features JSONB,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on cross_contact_detections
ALTER TABLE public.cross_contact_detections ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for cross_contact_detections
CREATE POLICY "Users can view their own cross detections"
  ON public.cross_contact_detections
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cross detections"
  ON public.cross_contact_detections
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cross detections"
  ON public.cross_contact_detections
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cross detections"
  ON public.cross_contact_detections
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add biometric_type to biometric_samples for new types
ALTER TABLE public.biometric_samples 
ALTER COLUMN biometric_type TYPE TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_biometric_enrollment_sessions_profile ON public.biometric_enrollment_sessions(profile_id);
CREATE INDEX IF NOT EXISTS idx_biometric_enrollment_sessions_status ON public.biometric_enrollment_sessions(status);
CREATE INDEX IF NOT EXISTS idx_cross_contact_detections_detected ON public.cross_contact_detections(detected_profile_id);
CREATE INDEX IF NOT EXISTS idx_cross_contact_detections_owner ON public.cross_contact_detections(owner_profile_id);