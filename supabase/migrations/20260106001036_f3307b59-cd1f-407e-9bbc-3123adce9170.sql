-- Store individual media analysis results
CREATE TABLE media_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id UUID REFERENCES media(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id),
  user_id UUID REFERENCES auth.users(id),
  
  -- Media type and context
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'audio', 'video', 'document')),
  analysis_context JSONB,
  
  -- Analysis configuration
  analysis_modes TEXT[],
  analysis_depth TEXT CHECK (analysis_depth IN ('quick', 'standard', 'deep')),
  model_used TEXT,
  
  -- Results by category
  face_intelligence JSONB,
  scene_intelligence JSONB,
  vocal_psychology JSONB,
  content_intelligence JSONB,
  behavioral_analysis JSONB,
  entity_extraction JSONB,
  relationship_mapping JSONB,
  sentiment_analysis JSONB,
  lifestyle_profiling JSONB,
  document_extraction JSONB,
  temporal_analysis JSONB,
  
  -- Intelligence outputs
  key_insights TEXT[],
  red_flags TEXT[],
  yellow_flags TEXT[],
  action_items TEXT[],
  personality_cues JSONB,
  certainties TEXT[],
  
  -- Quality metrics
  confidence_score NUMERIC,
  processing_time_ms INTEGER,
  token_usage JSONB,
  estimated_cost_cents NUMERIC,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE media_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own media analyses"
  ON media_analyses FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own media analyses"
  ON media_analyses FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own media analyses"
  ON media_analyses FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own media analyses"
  ON media_analyses FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_media_analyses_updated_at
  BEFORE UPDATE ON media_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_media_analyses_profile ON media_analyses(profile_id);
CREATE INDEX idx_media_analyses_media ON media_analyses(media_id);
CREATE INDEX idx_media_analyses_document ON media_analyses(document_id);
CREATE INDEX idx_media_analyses_type ON media_analyses(media_type);
CREATE INDEX idx_media_analyses_created ON media_analyses(created_at DESC);