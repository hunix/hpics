-- Create contact_observations table for storing user observations
CREATE TABLE public.contact_observations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('personality', 'communication', 'behavioral', 'professional')),
  title TEXT NOT NULL,
  observation TEXT NOT NULL,
  confidence_level TEXT CHECK (confidence_level IN ('low', 'medium', 'high')),
  ai_validation_status TEXT DEFAULT 'pending' CHECK (ai_validation_status IN ('pending', 'validated', 'challenged', 'inconclusive')),
  ai_validation_result JSONB,
  ai_confidence_score NUMERIC,
  related_analysis_ids UUID[],
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_observations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own observations"
  ON public.contact_observations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own observations"
  ON public.contact_observations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own observations"
  ON public.contact_observations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own observations"
  ON public.contact_observations FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_contact_observations_updated_at
  BEFORE UPDATE ON public.contact_observations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();