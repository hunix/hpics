-- Enable pgvector extension for similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Create contact_biometrics table - main biometric identity storage
CREATE TABLE public.contact_biometrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Facial Biometrics
  facial_embedding vector(512),
  facial_landmarks jsonb,
  facial_features jsonb,
  facial_sample_count integer DEFAULT 0,
  facial_confidence numeric,
  facial_last_updated timestamptz,
  
  -- Voice Biometrics  
  voice_embedding vector(256),
  voice_characteristics jsonb,
  voice_sample_count integer DEFAULT 0,
  voice_confidence numeric,
  voice_last_updated timestamptz,
  
  -- Combined Identity Score
  identity_confidence numeric,
  
  -- Metadata
  ai_model_used text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(user_id, profile_id)
);

-- Create biometric_samples table - track individual samples
CREATE TABLE public.biometric_samples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  biometric_type text NOT NULL CHECK (biometric_type IN ('face', 'voice')),
  
  -- Source reference
  source_type text NOT NULL,
  source_id uuid,
  source_url text,
  
  -- Extracted data
  embedding text, -- Store as text, convert to vector for matching
  features jsonb,
  quality_score numeric,
  
  -- Processing
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'processed', 'failed', 'enrolled')),
  error_message text,
  processed_at timestamptz,
  
  created_at timestamptz DEFAULT now()
);

-- Create biometric_matches table - log match attempts
CREATE TABLE public.biometric_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- What we're trying to match
  source_type text NOT NULL,
  source_id uuid,
  match_type text NOT NULL CHECK (match_type IN ('face', 'voice')),
  
  -- Match results
  matched_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  confidence_score numeric,
  alternative_matches jsonb,
  
  -- User feedback for learning
  user_confirmed boolean,
  user_corrected_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Auto-action taken
  auto_tagged boolean DEFAULT false,
  
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_biometrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.biometric_samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.biometric_matches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contact_biometrics
CREATE POLICY "Users can view their own biometrics"
  ON public.contact_biometrics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own biometrics"
  ON public.contact_biometrics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own biometrics"
  ON public.contact_biometrics FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own biometrics"
  ON public.contact_biometrics FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for biometric_samples
CREATE POLICY "Users can view their own samples"
  ON public.biometric_samples FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own samples"
  ON public.biometric_samples FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own samples"
  ON public.biometric_samples FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own samples"
  ON public.biometric_samples FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for biometric_matches
CREATE POLICY "Users can view their own matches"
  ON public.biometric_matches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own matches"
  ON public.biometric_matches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own matches"
  ON public.biometric_matches FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own matches"
  ON public.biometric_matches FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_contact_biometrics_profile ON public.contact_biometrics(profile_id);
CREATE INDEX idx_contact_biometrics_user ON public.contact_biometrics(user_id);
CREATE INDEX idx_biometric_samples_profile ON public.biometric_samples(profile_id);
CREATE INDEX idx_biometric_samples_status ON public.biometric_samples(status);
CREATE INDEX idx_biometric_matches_profile ON public.biometric_matches(matched_profile_id);
CREATE INDEX idx_biometric_matches_pending ON public.biometric_matches(user_id) WHERE user_confirmed IS NULL;

-- Trigger for updated_at
CREATE TRIGGER update_contact_biometrics_updated_at
  BEFORE UPDATE ON public.contact_biometrics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();