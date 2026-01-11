-- Create social_identity_links table for cross-platform identity linking
CREATE TABLE IF NOT EXISTS public.social_identity_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  primary_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  capture_ids UUID[] NOT NULL,
  platforms TEXT[] NOT NULL,
  usernames JSONB,
  confidence_score NUMERIC(4,3) DEFAULT 0,
  match_reasons JSONB,
  is_confirmed BOOLEAN DEFAULT false,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create unique constraint on capture_ids to prevent duplicates
CREATE UNIQUE INDEX idx_social_identity_links_captures 
  ON public.social_identity_links (user_id, capture_ids);

-- Create indexes for performance
CREATE INDEX idx_social_identity_links_user ON public.social_identity_links(user_id);
CREATE INDEX idx_social_identity_links_profile ON public.social_identity_links(primary_profile_id);
CREATE INDEX idx_social_identity_links_platforms ON public.social_identity_links USING GIN(platforms);

-- Enable RLS
ALTER TABLE public.social_identity_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own identity links"
  ON public.social_identity_links FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own identity links"
  ON public.social_identity_links FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own identity links"
  ON public.social_identity_links FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own identity links"
  ON public.social_identity_links FOR DELETE
  USING (auth.uid() = user_id);

-- Add last_capture_at to profiles for incremental tracking
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS last_social_capture_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS social_platforms JSONB DEFAULT '[]'::jsonb;

-- Create trigger for updated_at
CREATE TRIGGER update_social_identity_links_updated_at
  BEFORE UPDATE ON public.social_identity_links
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();