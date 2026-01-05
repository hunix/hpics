-- Create table for storing conversation analyses
CREATE TABLE public.conversation_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  analysis_type TEXT NOT NULL DEFAULT 'full',
  messaging_patterns JSONB,
  sentiment_analysis JSONB,
  intent_breakdown JSONB,
  topic_clusters JSONB,
  communication_dynamics JSONB,
  insights TEXT[],
  confidence_score INTEGER,
  ai_model_used TEXT,
  anonymization_enabled BOOLEAN DEFAULT true,
  message_count_analyzed INTEGER,
  date_range_start TIMESTAMPTZ,
  date_range_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conversation_analyses ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own conversation analyses"
ON public.conversation_analyses
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversation analyses"
ON public.conversation_analyses
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversation analyses"
ON public.conversation_analyses
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversation analyses"
ON public.conversation_analyses
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_conversation_analyses_updated_at
BEFORE UPDATE ON public.conversation_analyses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_conversation_analyses_conversation_id ON public.conversation_analyses(conversation_id);
CREATE INDEX idx_conversation_analyses_user_id ON public.conversation_analyses(user_id);