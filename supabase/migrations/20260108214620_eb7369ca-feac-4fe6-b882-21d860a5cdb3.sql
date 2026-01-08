-- Auto-Enrichment Pipeline Triggers (Phase 5 Item 10)
-- Creates queue entries when new data arrives for automatic processing

-- Create enrichment queue table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.enrichment_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id),
  enrichment_type TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_id UUID NOT NULL,
  priority INTEGER DEFAULT 5,
  status TEXT DEFAULT 'pending',
  scheduled_for TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.enrichment_queue ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own enrichment queue"
  ON public.enrichment_queue FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own enrichment queue"
  ON public.enrichment_queue FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own enrichment queue"
  ON public.enrichment_queue FOR UPDATE
  USING (auth.uid() = user_id);

-- Create relationship_inferences table for graph ML results
CREATE TABLE IF NOT EXISTS public.relationship_inferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  source_profile_id UUID REFERENCES public.profiles(id),
  target_profile_id UUID REFERENCES public.profiles(id),
  inference_type TEXT NOT NULL,
  path_profiles UUID[],
  path_distance INTEGER,
  relationship_strength DECIMAL,
  confidence_score DECIMAL,
  evidence JSONB DEFAULT '{}',
  opportunity_score DECIMAL,
  opportunity_type TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, source_profile_id, target_profile_id, inference_type)
);

ALTER TABLE public.relationship_inferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own inferences"
  ON public.relationship_inferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own inferences"
  ON public.relationship_inferences FOR ALL
  USING (auth.uid() = user_id);

-- Function to queue enrichment for new messages
CREATE OR REPLACE FUNCTION public.queue_message_enrichment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_profile_id UUID;
BEGIN
  -- Get user_id and profile_id from the conversation
  SELECT c.user_id, c.profile_id INTO v_user_id, v_profile_id
  FROM public.conversations c
  WHERE c.id = NEW.conversation_id;

  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.enrichment_queue (
      user_id,
      profile_id,
      enrichment_type,
      source_type,
      source_id,
      priority,
      metadata
    ) VALUES (
      v_user_id,
      v_profile_id,
      'embedding',
      'messages',
      NEW.id,
      5,
      jsonb_build_object('content_length', length(COALESCE(NEW.content, '')))
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Function to queue enrichment for new documents
CREATE OR REPLACE FUNCTION public.queue_document_enrichment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.enrichment_queue (
    user_id,
    profile_id,
    enrichment_type,
    source_type,
    source_id,
    priority,
    metadata
  ) VALUES (
    NEW.user_id,
    NEW.profile_id,
    'embedding',
    'documents',
    NEW.id,
    7, -- Higher priority for documents
    jsonb_build_object('document_type', NEW.document_type, 'title', NEW.title)
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- Function to queue enrichment for new observations
CREATE OR REPLACE FUNCTION public.queue_observation_enrichment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.enrichment_queue (
    user_id,
    profile_id,
    enrichment_type,
    source_type,
    source_id,
    priority,
    metadata
  ) VALUES (
    NEW.user_id,
    NEW.profile_id,
    'embedding',
    'contact_observations',
    NEW.id,
    4,
    jsonb_build_object('observation_type', NEW.observation_type)
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- Create triggers for auto-enrichment
DROP TRIGGER IF EXISTS trg_queue_message_enrichment ON public.messages;
CREATE TRIGGER trg_queue_message_enrichment
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.queue_message_enrichment();

DROP TRIGGER IF EXISTS trg_queue_document_enrichment ON public.documents;
CREATE TRIGGER trg_queue_document_enrichment
  AFTER INSERT ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.queue_document_enrichment();

DROP TRIGGER IF EXISTS trg_queue_observation_enrichment ON public.contact_observations;
CREATE TRIGGER trg_queue_observation_enrichment
  AFTER INSERT ON public.contact_observations
  FOR EACH ROW
  EXECUTE FUNCTION public.queue_observation_enrichment();

-- Add indexes for queue processing
CREATE INDEX IF NOT EXISTS idx_enrichment_queue_pending 
  ON public.enrichment_queue(status, scheduled_for, priority DESC)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_relationship_inferences_lookup
  ON public.relationship_inferences(user_id, source_profile_id, inference_type);