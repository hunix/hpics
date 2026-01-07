-- Create relationship_opportunities table
CREATE TABLE public.relationship_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  opportunity_type TEXT NOT NULL,
  trigger_event TEXT,
  suggested_action TEXT,
  suggested_methodology_id UUID REFERENCES public.intelligence_methodologies(id) ON DELETE SET NULL,
  optimal_timing TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  confidence_score NUMERIC(3,2),
  priority INTEGER DEFAULT 5,
  status TEXT DEFAULT 'active',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create prompt_versions table for A/B testing
CREATE TABLE public.prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  prompt_key TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  prompt_text TEXT NOT NULL,
  variables TEXT[],
  model_tier TEXT DEFAULT 'balanced',
  is_active BOOLEAN DEFAULT true,
  success_rate NUMERIC(5,2),
  avg_cost_cents NUMERIC(10,2),
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, prompt_key, version)
);

-- Enable RLS
ALTER TABLE public.relationship_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_versions ENABLE ROW LEVEL SECURITY;

-- RLS policies for relationship_opportunities
CREATE POLICY "Users can view own relationship opportunities"
  ON public.relationship_opportunities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own relationship opportunities"
  ON public.relationship_opportunities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own relationship opportunities"
  ON public.relationship_opportunities FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own relationship opportunities"
  ON public.relationship_opportunities FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for prompt_versions
CREATE POLICY "Users can view own prompt versions"
  ON public.prompt_versions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own prompt versions"
  ON public.prompt_versions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own prompt versions"
  ON public.prompt_versions FOR UPDATE
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_relationship_opportunities_user ON public.relationship_opportunities(user_id);
CREATE INDEX idx_relationship_opportunities_profile ON public.relationship_opportunities(profile_id);
CREATE INDEX idx_relationship_opportunities_status ON public.relationship_opportunities(status) WHERE status = 'active';
CREATE INDEX idx_relationship_opportunities_timing ON public.relationship_opportunities(optimal_timing) WHERE status = 'active';
CREATE INDEX idx_prompt_versions_key ON public.prompt_versions(user_id, prompt_key);

-- Create trigger function for auto-enrichment queue (messages)
CREATE OR REPLACE FUNCTION public.queue_message_enrichment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only queue if message has substantial content
  IF length(COALESCE(NEW.content, '')) > 20 THEN
    INSERT INTO public.bulk_operation_queue (
      user_id, 
      operation_type, 
      target_ids, 
      total_items,
      status, 
      metadata
    )
    VALUES (
      (SELECT user_id FROM conversations WHERE id = NEW.conversation_id),
      'message_enrichment',
      ARRAY[NEW.id::text],
      1,
      'pending',
      jsonb_build_object('conversation_id', NEW.conversation_id, 'priority', 5)
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger function for auto-enrichment queue (media)
CREATE OR REPLACE FUNCTION public.queue_media_analysis()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Queue media for AI analysis if it's an image or video
  IF NEW.mime_type LIKE 'image/%' OR NEW.mime_type LIKE 'video/%' THEN
    INSERT INTO public.bulk_operation_queue (
      user_id, 
      operation_type, 
      target_ids, 
      total_items,
      status, 
      metadata
    )
    VALUES (
      NEW.user_id,
      'media_analysis',
      ARRAY[NEW.id::text],
      1,
      'pending',
      jsonb_build_object('media_type', NEW.mime_type, 'profile_id', NEW.profile_id, 'priority', 3)
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Attach triggers
CREATE TRIGGER on_message_insert_queue_enrichment
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.queue_message_enrichment();

CREATE TRIGGER on_media_insert_queue_analysis
  AFTER INSERT ON public.media
  FOR EACH ROW
  EXECUTE FUNCTION public.queue_media_analysis();

-- Add updated_at trigger for new tables
CREATE TRIGGER update_relationship_opportunities_updated_at
  BEFORE UPDATE ON public.relationship_opportunities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_prompt_versions_updated_at
  BEFORE UPDATE ON public.prompt_versions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Schedule additional pg_cron jobs for nightly processing
SELECT cron.schedule(
  'nightly-relationship-scoring',
  '30 2 * * *',
  $$SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/calculate-relationship-scores',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')),
    body := '{}'::jsonb
  )$$
);

SELECT cron.schedule(
  'nightly-opportunity-detection',
  '0 3 * * *',
  $$SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/detect-influence-opportunities',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')),
    body := '{}'::jsonb
  )$$
);

SELECT cron.schedule(
  'nightly-methodology-analysis',
  '30 3 * * *',
  $$SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/analyze-methodology-effectiveness',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')),
    body := '{}'::jsonb
  )$$
);

SELECT cron.schedule(
  'weekly-network-intelligence',
  '0 4 * * 0',
  $$SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/analyze-network-intelligence',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')),
    body := '{}'::jsonb
  )$$
);