-- ============================================================
-- PHASE 1.1: UNIFIED ANALYSIS STORE
-- Consolidates 85+ analysis tables into one polymorphic table
-- ============================================================

CREATE TABLE IF NOT EXISTS unified_analysis_store (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Polymorphic type discrimination
  analysis_domain TEXT NOT NULL, -- 'intelligence', 'biometric', 'warfare', 'network', 'fusion', 'psychological'
  analysis_type TEXT NOT NULL,   -- 'mice_assessment', 'behavioral_dna', 'dark_triad', etc.
  
  -- Unified result storage
  result JSONB NOT NULL DEFAULT '{}',
  confidence_score NUMERIC(5,4) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical', 'unknown')),
  
  -- Metadata
  source_ids TEXT[] DEFAULT '{}',
  model_used TEXT,
  processing_time_ms INTEGER,
  cost_cents NUMERIC(10,4),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  
  -- Unique constraint for latest analysis per type
  CONSTRAINT unique_latest_analysis UNIQUE (user_id, profile_id, analysis_type)
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_unified_analysis_result ON unified_analysis_store USING GIN (result);
CREATE INDEX IF NOT EXISTS idx_unified_analysis_domain_type ON unified_analysis_store (analysis_domain, analysis_type);
CREATE INDEX IF NOT EXISTS idx_unified_analysis_user_profile ON unified_analysis_store (user_id, profile_id);
CREATE INDEX IF NOT EXISTS idx_unified_analysis_created ON unified_analysis_store (created_at DESC);

-- RLS Policy
ALTER TABLE unified_analysis_store ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own analyses"
  ON unified_analysis_store FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analyses"
  ON unified_analysis_store FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analyses"
  ON unified_analysis_store FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analyses"
  ON unified_analysis_store FOR DELETE
  USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_unified_analysis_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_unified_analysis_updated
  BEFORE UPDATE ON unified_analysis_store
  FOR EACH ROW
  EXECUTE FUNCTION update_unified_analysis_timestamp();

-- ============================================================
-- PHASE 1.2: UNIFIED PREDICTION STORE
-- Consolidates 40+ prediction tables into one
-- ============================================================

CREATE TABLE IF NOT EXISTS unified_prediction_store (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Polymorphic type discrimination
  prediction_domain TEXT NOT NULL, -- 'behavioral', 'network', 'temporal', 'financial', 'relationship'
  prediction_type TEXT NOT NULL,   -- 'churn', 'betrayal', 'trajectory', 'opportunity', 'breaking_point'
  
  -- Prediction data
  prediction JSONB NOT NULL DEFAULT '{}',
  probability NUMERIC(5,4) CHECK (probability >= 0 AND probability <= 1),
  time_horizon_days INTEGER,
  
  -- Validation tracking
  validated_at TIMESTAMPTZ,
  actual_outcome JSONB,
  accuracy_score NUMERIC(5,4),
  
  -- Metadata
  model_used TEXT,
  factors JSONB DEFAULT '[]',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  
  CONSTRAINT unique_latest_prediction UNIQUE (user_id, profile_id, prediction_type)
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_unified_prediction_domain_type ON unified_prediction_store (prediction_domain, prediction_type);
CREATE INDEX IF NOT EXISTS idx_unified_prediction_user_profile ON unified_prediction_store (user_id, profile_id);
CREATE INDEX IF NOT EXISTS idx_unified_prediction_probability ON unified_prediction_store (probability DESC);
CREATE INDEX IF NOT EXISTS idx_unified_prediction_expires ON unified_prediction_store (expires_at) WHERE expires_at IS NOT NULL;

-- RLS Policy
ALTER TABLE unified_prediction_store ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own predictions"
  ON unified_prediction_store FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own predictions"
  ON unified_prediction_store FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own predictions"
  ON unified_prediction_store FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own predictions"
  ON unified_prediction_store FOR DELETE
  USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER trigger_unified_prediction_updated
  BEFORE UPDATE ON unified_prediction_store
  FOR EACH ROW
  EXECUTE FUNCTION update_unified_analysis_timestamp();

-- ============================================================
-- PHASE 1.3: UNIFIED EVENT LOG (Non-partitioned for simplicity)
-- Consolidates 25+ audit/event tables
-- ============================================================

CREATE TABLE IF NOT EXISTS unified_event_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Event classification
  event_domain TEXT NOT NULL, -- 'audit', 'cascade', 'analysis', 'system', 'security', 'agent'
  event_type TEXT NOT NULL,   -- 'login', 'analysis_completed', 'cascade_triggered', etc.
  event_data JSONB NOT NULL DEFAULT '{}',
  
  -- Severity/priority
  severity TEXT CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical')) DEFAULT 'info',
  
  -- Correlation for tracing
  correlation_id UUID,
  parent_event_id UUID,
  trace_id TEXT,
  
  -- Source metadata
  source_function TEXT,
  source_component TEXT,
  
  -- Client metadata
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_unified_event_domain_type ON unified_event_log (event_domain, event_type);
CREATE INDEX IF NOT EXISTS idx_unified_event_user ON unified_event_log (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_unified_event_correlation ON unified_event_log (correlation_id) WHERE correlation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_unified_event_created ON unified_event_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_unified_event_severity ON unified_event_log (severity) WHERE severity IN ('error', 'critical');

-- RLS Policy - more permissive for system events
ALTER TABLE unified_event_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own events"
  ON unified_event_log FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert events"
  ON unified_event_log FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- ============================================================
-- HELPER: Legacy type mapping function
-- Maps old table names to new domain/type pairs
-- ============================================================

CREATE OR REPLACE FUNCTION get_legacy_analysis_mapping(legacy_table TEXT)
RETURNS TABLE(domain TEXT, analysis_type TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN legacy_table IN ('mice_assessments', 'betrayal_predictions', 'behavioral_analyses', 'loyalty_assessments') THEN 'intelligence'
      WHEN legacy_table IN ('dark_triad_scores', 'sacred_values', 'attachment_styles', 'trauma_profiles') THEN 'psychological'
      WHEN legacy_table IN ('face_embeddings', 'voice_signatures', 'gait_patterns', 'signature_features') THEN 'biometric'
      WHEN legacy_table IN ('campaign_analyses', 'threat_assessments', 'vulnerability_maps') THEN 'warfare'
      WHEN legacy_table IN ('network_snapshots', 'influence_scores', 'relationship_strengths') THEN 'network'
      ELSE 'fusion'
    END as domain,
    REPLACE(legacy_table, '_', '-') as analysis_type;
END;
$$ LANGUAGE plpgsql IMMUTABLE;