-- Create identity_destabilization_logs table for AGIS Phase 4
CREATE TABLE IF NOT EXISTS public.identity_destabilization_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id),
  user_id UUID NOT NULL,
  technique_type TEXT NOT NULL,
  script_content TEXT,
  intensity_level TEXT DEFAULT 'moderate',
  delivery_context JSONB DEFAULT '{}',
  response_observed TEXT,
  effectiveness_score NUMERIC(3,2),
  deployed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.identity_destabilization_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own identity destabilization logs"
ON public.identity_destabilization_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own identity destabilization logs"
ON public.identity_destabilization_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own identity destabilization logs"
ON public.identity_destabilization_logs FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own identity destabilization logs"
ON public.identity_destabilization_logs FOR DELETE
USING (auth.uid() = user_id);