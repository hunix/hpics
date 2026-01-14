-- Phase 1-7: Database schema additions for all new features

-- Keystroke Profiles table
CREATE TABLE IF NOT EXISTS public.keystroke_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  features JSONB NOT NULL DEFAULT '{}',
  feature_vector FLOAT8[] DEFAULT '{}',
  sample_text TEXT,
  total_characters INTEGER DEFAULT 0,
  total_duration_ms INTEGER DEFAULT 0,
  quality_score FLOAT8 DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.keystroke_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for keystroke_profiles
CREATE POLICY "Users can view their own keystroke profiles"
  ON public.keystroke_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own keystroke profiles"
  ON public.keystroke_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own keystroke profiles"
  ON public.keystroke_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own keystroke profiles"
  ON public.keystroke_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- Gait Profiles table
CREATE TABLE IF NOT EXISTS public.gait_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  features JSONB NOT NULL DEFAULT '{}',
  feature_vector FLOAT8[] DEFAULT '{}',
  total_steps INTEGER DEFAULT 0,
  walking_duration_ms INTEGER DEFAULT 0,
  quality_score FLOAT8 DEFAULT 0,
  anomalies JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gait_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for gait_profiles
CREATE POLICY "Users can view their own gait profiles"
  ON public.gait_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own gait profiles"
  ON public.gait_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own gait profiles"
  ON public.gait_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own gait profiles"
  ON public.gait_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- Psychology Assessments table
CREATE TABLE IF NOT EXISTS public.psychology_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assessment_type TEXT NOT NULL DEFAULT 'dark_triad',
  dark_triad_scores JSONB DEFAULT '{}',
  cognitive_biases JSONB DEFAULT '[]',
  influence_susceptibility JSONB DEFAULT '{}',
  vulnerability_profile JSONB DEFAULT '{}',
  influence_resistance JSONB DEFAULT '{}',
  exploitation_playbook JSONB DEFAULT '{}',
  risk_level TEXT DEFAULT 'unknown',
  confidence_score FLOAT8 DEFAULT 0,
  source_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.psychology_assessments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for psychology_assessments
CREATE POLICY "Users can view their own psychology assessments"
  ON public.psychology_assessments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own psychology assessments"
  ON public.psychology_assessments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own psychology assessments"
  ON public.psychology_assessments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own psychology assessments"
  ON public.psychology_assessments FOR DELETE
  USING (auth.uid() = user_id);

-- Deception Analyses table
CREATE TABLE IF NOT EXISTS public.deception_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL DEFAULT 'comprehensive',
  linguistic_signals JSONB DEFAULT '{}',
  vocal_signals JSONB DEFAULT '{}',
  facial_signals JSONB DEFAULT '{}',
  behavioral_signals JSONB DEFAULT '{}',
  cross_modal_score FLOAT8 DEFAULT 0,
  deception_probability FLOAT8 DEFAULT 0,
  confidence_level FLOAT8 DEFAULT 0,
  evidence_trail JSONB DEFAULT '[]',
  statements_analyzed JSONB DEFAULT '[]',
  recommendations JSONB DEFAULT '[]',
  source_recording_id UUID REFERENCES public.meeting_recordings(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.deception_analyses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for deception_analyses
CREATE POLICY "Users can view their own deception analyses"
  ON public.deception_analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own deception analyses"
  ON public.deception_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own deception analyses"
  ON public.deception_analyses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own deception analyses"
  ON public.deception_analyses FOR DELETE
  USING (auth.uid() = user_id);

-- Local ML Cache table
CREATE TABLE IF NOT EXISTS public.local_ml_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  model_name TEXT NOT NULL,
  model_version TEXT,
  cache_status TEXT DEFAULT 'pending',
  cache_size_bytes BIGINT DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  performance_metrics JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, model_name)
);

-- Enable RLS
ALTER TABLE public.local_ml_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies for local_ml_cache
CREATE POLICY "Users can view their own ML cache"
  ON public.local_ml_cache FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own ML cache"
  ON public.local_ml_cache FOR ALL
  USING (auth.uid() = user_id);

-- Add keystroke and gait columns to contact_biometrics if not exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contact_biometrics' AND column_name = 'keystroke_profile_id') THEN
    ALTER TABLE public.contact_biometrics ADD COLUMN keystroke_profile_id UUID REFERENCES public.keystroke_profiles(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contact_biometrics' AND column_name = 'gait_profile_id') THEN
    ALTER TABLE public.contact_biometrics ADD COLUMN gait_profile_id UUID REFERENCES public.gait_profiles(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contact_biometrics' AND column_name = 'keystroke_samples_count') THEN
    ALTER TABLE public.contact_biometrics ADD COLUMN keystroke_samples_count INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contact_biometrics' AND column_name = 'gait_samples_count') THEN
    ALTER TABLE public.contact_biometrics ADD COLUMN gait_samples_count INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contact_biometrics' AND column_name = 'keystroke_confidence') THEN
    ALTER TABLE public.contact_biometrics ADD COLUMN keystroke_confidence FLOAT8;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contact_biometrics' AND column_name = 'gait_confidence') THEN
    ALTER TABLE public.contact_biometrics ADD COLUMN gait_confidence FLOAT8;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_keystroke_profiles_profile ON public.keystroke_profiles(profile_id);
CREATE INDEX IF NOT EXISTS idx_keystroke_profiles_user ON public.keystroke_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_gait_profiles_profile ON public.gait_profiles(profile_id);
CREATE INDEX IF NOT EXISTS idx_gait_profiles_user ON public.gait_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_psychology_assessments_profile ON public.psychology_assessments(profile_id);
CREATE INDEX IF NOT EXISTS idx_deception_analyses_profile ON public.deception_analyses(profile_id);
CREATE INDEX IF NOT EXISTS idx_local_ml_cache_user ON public.local_ml_cache(user_id);