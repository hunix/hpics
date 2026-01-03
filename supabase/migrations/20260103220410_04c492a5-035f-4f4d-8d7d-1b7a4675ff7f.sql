-- Meeting recordings and transcriptions table
CREATE TABLE public.meeting_recordings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  duration_seconds INTEGER,
  mime_type TEXT,
  transcription TEXT,
  transcription_with_speakers JSONB,
  audio_events JSONB,
  folder TEXT DEFAULT 'general',
  status TEXT DEFAULT 'pending',
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Behavioral analysis results
CREATE TABLE public.behavioral_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL, -- 'screening', 'interview', 'general'
  video_url TEXT,
  source_recording_id UUID REFERENCES public.meeting_recordings(id),
  behavioral_patterns JSONB,
  personality_indicators JSONB,
  confidence_score NUMERIC,
  ai_model_used TEXT,
  raw_analysis JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Facial/micro-expression analysis
CREATE TABLE public.facial_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  video_url TEXT,
  source_recording_id UUID REFERENCES public.meeting_recordings(id),
  micro_expressions JSONB,
  stress_indicators JSONB,
  emotional_timeline JSONB,
  deception_indicators JSONB,
  confidence_score NUMERIC,
  ai_model_used TEXT,
  raw_analysis JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Body language analysis
CREATE TABLE public.body_language_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  video_url TEXT,
  source_recording_id UUID REFERENCES public.meeting_recordings(id),
  posture_analysis JSONB,
  gesture_patterns JSONB,
  movement_indicators JSONB,
  comfort_indicators JSONB,
  rapport_signals JSONB,
  confidence_score NUMERIC,
  ai_model_used TEXT,
  raw_analysis JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Vocal analysis
CREATE TABLE public.vocal_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  audio_url TEXT,
  source_recording_id UUID REFERENCES public.meeting_recordings(id),
  stress_points JSONB,
  mood_changes JSONB,
  speech_patterns JSONB,
  hesitation_markers JSONB,
  confidence_indicators JSONB,
  deception_likelihood JSONB,
  confidence_score NUMERIC,
  ai_model_used TEXT,
  raw_analysis JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Local AI model endpoints configuration
CREATE TABLE public.local_ai_endpoints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  endpoint_url TEXT NOT NULL,
  model_type TEXT NOT NULL, -- 'text', 'vision', 'audio', 'multimodal'
  capabilities JSONB DEFAULT '[]',
  api_format TEXT DEFAULT 'openai', -- 'openai', 'custom'
  is_active BOOLEAN DEFAULT true,
  last_health_check TIMESTAMP WITH TIME ZONE,
  health_status TEXT DEFAULT 'unknown',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.meeting_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.behavioral_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facial_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.body_language_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocal_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.local_ai_endpoints ENABLE ROW LEVEL SECURITY;

-- RLS policies for meeting_recordings
CREATE POLICY "Users can create their own recordings" ON public.meeting_recordings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own recordings" ON public.meeting_recordings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own recordings" ON public.meeting_recordings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own recordings" ON public.meeting_recordings FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for behavioral_analyses
CREATE POLICY "Users can create their own behavioral analyses" ON public.behavioral_analyses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own behavioral analyses" ON public.behavioral_analyses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own behavioral analyses" ON public.behavioral_analyses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own behavioral analyses" ON public.behavioral_analyses FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for facial_analyses
CREATE POLICY "Users can create their own facial analyses" ON public.facial_analyses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own facial analyses" ON public.facial_analyses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own facial analyses" ON public.facial_analyses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own facial analyses" ON public.facial_analyses FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for body_language_analyses
CREATE POLICY "Users can create their own body language analyses" ON public.body_language_analyses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own body language analyses" ON public.body_language_analyses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own body language analyses" ON public.body_language_analyses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own body language analyses" ON public.body_language_analyses FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for vocal_analyses
CREATE POLICY "Users can create their own vocal analyses" ON public.vocal_analyses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own vocal analyses" ON public.vocal_analyses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own vocal analyses" ON public.vocal_analyses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own vocal analyses" ON public.vocal_analyses FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for local_ai_endpoints
CREATE POLICY "Users can create their own AI endpoints" ON public.local_ai_endpoints FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own AI endpoints" ON public.local_ai_endpoints FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own AI endpoints" ON public.local_ai_endpoints FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own AI endpoints" ON public.local_ai_endpoints FOR DELETE USING (auth.uid() = user_id);

-- Create storage bucket for recordings
INSERT INTO storage.buckets (id, name, public) VALUES ('recordings', 'recordings', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for recordings bucket
CREATE POLICY "Users can upload their own recordings" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'recordings' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view their own recordings" ON storage.objects FOR SELECT USING (bucket_id = 'recordings' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own recordings" ON storage.objects FOR DELETE USING (bucket_id = 'recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add triggers for updated_at
CREATE TRIGGER update_meeting_recordings_updated_at BEFORE UPDATE ON public.meeting_recordings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_behavioral_analyses_updated_at BEFORE UPDATE ON public.behavioral_analyses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_facial_analyses_updated_at BEFORE UPDATE ON public.facial_analyses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_body_language_analyses_updated_at BEFORE UPDATE ON public.body_language_analyses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_vocal_analyses_updated_at BEFORE UPDATE ON public.vocal_analyses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_local_ai_endpoints_updated_at BEFORE UPDATE ON public.local_ai_endpoints FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();