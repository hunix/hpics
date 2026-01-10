-- Create only the NEW tables that don't exist yet
CREATE TABLE IF NOT EXISTS public.entity_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  entity_type TEXT NOT NULL,
  entity_name TEXT NOT NULL,
  normalized_name TEXT,
  source_type TEXT NOT NULL,
  source_id UUID NOT NULL,
  mentioned_in_profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  context TEXT,
  sentiment NUMERIC CHECK (sentiment >= -1 AND sentiment <= 1),
  confidence NUMERIC CHECK (confidence >= 0 AND confidence <= 1),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.voice_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  embedding_vector vector(512),
  sample_duration_seconds INTEGER,
  sample_count INTEGER DEFAULT 1,
  quality_score NUMERIC CHECK (quality_score >= 0 AND quality_score <= 1),
  audio_characteristics JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.device_health_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  device_type TEXT NOT NULL,
  device_id TEXT,
  metric_type TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_unit TEXT,
  recorded_at TIMESTAMPTZ NOT NULL,
  interaction_context_id UUID,
  interaction_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.extension_scrape_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  profile_url TEXT,
  profile_username TEXT,
  pages_captured INTEGER DEFAULT 0,
  posts_captured INTEGER DEFAULT 0,
  comments_captured INTEGER DEFAULT 0,
  followers_count INTEGER,
  following_count INTEGER,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  raw_data JSONB DEFAULT '{}',
  processed_data JSONB DEFAULT '{}',
  target_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.cross_contact_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  insight_type TEXT NOT NULL,
  profile_ids UUID[] NOT NULL,
  entity_or_pattern TEXT,
  description TEXT,
  confidence_score NUMERIC CHECK (confidence_score >= 0 AND confidence_score <= 1),
  evidence JSONB DEFAULT '[]',
  is_dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add missing columns to existing intelligence_alerts
ALTER TABLE intelligence_alerts ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';
ALTER TABLE intelligence_alerts ADD COLUMN IF NOT EXISTS related_entity_ids UUID[];
ALTER TABLE intelligence_alerts ADD COLUMN IF NOT EXISTS action_suggestions JSONB DEFAULT '[]';
ALTER TABLE intelligence_alerts ADD COLUMN IF NOT EXISTS source_analysis_id UUID;
ALTER TABLE intelligence_alerts ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;
ALTER TABLE intelligence_alerts ADD COLUMN IF NOT EXISTS is_actioned BOOLEAN DEFAULT false;
ALTER TABLE intelligence_alerts ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Enable RLS
ALTER TABLE entity_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_health_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE extension_scrape_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cross_contact_insights ENABLE ROW LEVEL SECURITY;

-- RLS policies for new tables
DO $$ BEGIN
  CREATE POLICY "Users can manage their entity mentions" ON entity_mentions FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can manage their voice signatures" ON voice_signatures FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can manage their health data" ON device_health_data FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can manage their scrape sessions" ON extension_scrape_sessions FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can manage their cross-contact insights" ON cross_contact_insights FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_entity_mentions_user_profile ON entity_mentions(user_id, mentioned_in_profile_id);
CREATE INDEX IF NOT EXISTS idx_entity_mentions_entity ON entity_mentions(user_id, entity_type, normalized_name);
CREATE INDEX IF NOT EXISTS idx_voice_signatures_profile ON voice_signatures(user_id, profile_id);
CREATE INDEX IF NOT EXISTS idx_health_data_user_time ON device_health_data(user_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_scrape_sessions_user ON extension_scrape_sessions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cross_insights_user ON cross_contact_insights(user_id, created_at DESC);

-- Update trigger
CREATE OR REPLACE TRIGGER update_voice_signatures_updated_at BEFORE UPDATE ON voice_signatures FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_cross_insights_updated_at BEFORE UPDATE ON cross_contact_insights FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Get entity mentions across contacts
CREATE OR REPLACE FUNCTION get_entity_mentions_cross_contact(
  p_user_id UUID,
  p_entity_name TEXT,
  p_entity_type TEXT DEFAULT NULL
)
RETURNS TABLE(
  profile_id UUID,
  first_name TEXT,
  last_name TEXT,
  mention_count BIGINT,
  avg_sentiment NUMERIC,
  contexts TEXT[]
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    em.mentioned_in_profile_id,
    p.first_name,
    p.last_name,
    COUNT(*)::BIGINT as mention_count,
    AVG(em.sentiment) as avg_sentiment,
    ARRAY_AGG(DISTINCT LEFT(em.context, 200)) as contexts
  FROM entity_mentions em
  JOIN profiles p ON p.id = em.mentioned_in_profile_id
  WHERE em.user_id = p_user_id
    AND em.normalized_name ILIKE '%' || lower(p_entity_name) || '%'
    AND (p_entity_type IS NULL OR em.entity_type = p_entity_type)
  GROUP BY em.mentioned_in_profile_id, p.first_name, p.last_name
  ORDER BY mention_count DESC;
END;
$$;

-- Function: Get unread alerts count (using existing column name)
CREATE OR REPLACE FUNCTION get_unread_alerts_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER 
  FROM intelligence_alerts ia
  WHERE ia.user_id = p_user_id 
    AND (ia.is_acknowledged = false OR ia.is_acknowledged IS NULL)
    AND (ia.is_dismissed = false OR ia.is_dismissed IS NULL);
$$;