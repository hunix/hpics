-- Create user biometric settings table for configurable thresholds
CREATE TABLE public.biometric_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  face_match_threshold NUMERIC(3,2) NOT NULL DEFAULT 0.85,
  voice_match_threshold NUMERIC(3,2) NOT NULL DEFAULT 0.85,
  auto_tag_enabled BOOLEAN NOT NULL DEFAULT true,
  auto_tag_face_threshold NUMERIC(3,2) NOT NULL DEFAULT 0.90,
  auto_tag_voice_threshold NUMERIC(3,2) NOT NULL DEFAULT 0.90,
  notify_on_match BOOLEAN NOT NULL DEFAULT true,
  notify_threshold NUMERIC(3,2) NOT NULL DEFAULT 0.70,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT biometric_settings_user_unique UNIQUE (user_id),
  CONSTRAINT face_threshold_range CHECK (face_match_threshold >= 0.50 AND face_match_threshold <= 1.00),
  CONSTRAINT voice_threshold_range CHECK (voice_match_threshold >= 0.50 AND voice_match_threshold <= 1.00),
  CONSTRAINT auto_tag_face_range CHECK (auto_tag_face_threshold >= 0.50 AND auto_tag_face_threshold <= 1.00),
  CONSTRAINT auto_tag_voice_range CHECK (auto_tag_voice_threshold >= 0.50 AND auto_tag_voice_threshold <= 1.00),
  CONSTRAINT notify_threshold_range CHECK (notify_threshold >= 0.50 AND notify_threshold <= 1.00)
);

-- Enable RLS
ALTER TABLE public.biometric_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own biometric settings"
  ON public.biometric_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own biometric settings"
  ON public.biometric_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own biometric settings"
  ON public.biometric_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Add index
CREATE INDEX idx_biometric_settings_user_id ON public.biometric_settings(user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_biometric_settings_updated_at
  BEFORE UPDATE ON public.biometric_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();