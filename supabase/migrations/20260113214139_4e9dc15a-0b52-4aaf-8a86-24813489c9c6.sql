-- ============================================================
-- PLATFORM CONFIGURATION SYSTEM
-- Centralized, hierarchical configuration management
-- ============================================================

-- Platform-level configurations (admin only)
CREATE TABLE public.platform_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  config_key TEXT NOT NULL UNIQUE,
  config_value JSONB NOT NULL DEFAULT '{}',
  category TEXT NOT NULL, -- 'ai', 'analysis', 'biometric', 'intelligence', 'relationship', 'security', 'enrichment', 'automation'
  subcategory TEXT, -- more specific grouping
  display_name TEXT NOT NULL,
  description TEXT,
  value_type TEXT NOT NULL DEFAULT 'number', -- 'number', 'boolean', 'string', 'json', 'percentage', 'enum'
  value_constraints JSONB, -- min, max, options for enums, etc.
  default_value JSONB NOT NULL,
  is_sensitive BOOLEAN DEFAULT false,
  requires_restart BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User-level configuration overrides
CREATE TABLE public.user_config_overrides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  config_key TEXT NOT NULL REFERENCES platform_config(config_key) ON DELETE CASCADE,
  config_value JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, config_key)
);

-- Per-contact configuration (overrides user & platform defaults)
CREATE TABLE public.contact_config_overrides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  config_key TEXT NOT NULL REFERENCES platform_config(config_key) ON DELETE CASCADE,
  config_value JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, profile_id, config_key)
);

-- Per-analysis-type configuration
CREATE TABLE public.analysis_type_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  analysis_type TEXT NOT NULL, -- 'personality', 'deception', 'sentiment', 'facial', 'vocal', etc.
  config_key TEXT NOT NULL,
  config_value JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, analysis_type, config_key)
);

-- Enable RLS
ALTER TABLE public.platform_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_config_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_config_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_type_config ENABLE ROW LEVEL SECURITY;

-- Platform config is readable by all authenticated, writable by admin (platform owner)
CREATE POLICY "Anyone can read platform config" 
  ON public.platform_config FOR SELECT 
  USING (true);

-- User config overrides
CREATE POLICY "Users can manage their own config overrides" 
  ON public.user_config_overrides FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Contact config overrides
CREATE POLICY "Users can manage their contact config overrides" 
  ON public.contact_config_overrides FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Analysis type config
CREATE POLICY "Users can manage their analysis config" 
  ON public.analysis_type_config FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_platform_config_category ON platform_config(category);
CREATE INDEX idx_user_config_user ON user_config_overrides(user_id);
CREATE INDEX idx_contact_config_profile ON contact_config_overrides(profile_id);
CREATE INDEX idx_analysis_config_type ON analysis_type_config(analysis_type);

-- Trigger for updated_at
CREATE TRIGGER update_platform_config_updated_at
  BEFORE UPDATE ON platform_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_config_overrides_updated_at
  BEFORE UPDATE ON user_config_overrides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contact_config_overrides_updated_at
  BEFORE UPDATE ON contact_config_overrides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analysis_type_config_updated_at
  BEFORE UPDATE ON analysis_type_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- SEED DEFAULT PLATFORM CONFIGURATIONS
-- ============================================================

-- AI & Cost Settings
INSERT INTO platform_config (config_key, category, subcategory, display_name, description, value_type, value_constraints, default_value, config_value) VALUES
('ai.batch_size', 'ai', 'processing', 'Batch Processing Size', 'Number of items to process in a single batch', 'number', '{"min": 10, "max": 500}', '50', '50'),
('ai.rate_limit_delay_ms', 'ai', 'processing', 'Rate Limit Delay (ms)', 'Delay between API calls to avoid rate limiting', 'number', '{"min": 100, "max": 10000}', '1000', '1000'),
('ai.max_concurrent_requests', 'ai', 'processing', 'Max Concurrent Requests', 'Maximum parallel AI requests', 'number', '{"min": 1, "max": 10}', '3', '3'),
('ai.cache_ttl_hours', 'ai', 'caching', 'Cache TTL (hours)', 'How long to cache AI responses', 'number', '{"min": 1, "max": 168}', '24', '24'),
('ai.default_temperature', 'ai', 'model', 'Default Temperature', 'Default creativity/randomness for AI models', 'percentage', '{"min": 0, "max": 1}', '0.4', '0.4'),
('ai.max_tokens_default', 'ai', 'model', 'Default Max Tokens', 'Default maximum tokens for AI responses', 'number', '{"min": 500, "max": 32000}', '2000', '2000');

-- Relationship Score Settings
INSERT INTO platform_config (config_key, category, subcategory, display_name, description, value_type, value_constraints, default_value, config_value) VALUES
('relationship.decay_rate_daily', 'relationship', 'scoring', 'Daily Decay Rate (%)', 'Relationship score decay per day without contact', 'percentage', '{"min": 0, "max": 5}', '0.5', '0.5'),
('relationship.favorite_decay_rate', 'relationship', 'scoring', 'Favorite Decay Rate (%)', 'Decay rate for favorited contacts (slower)', 'percentage', '{"min": 0, "max": 2}', '0.25', '0.25'),
('relationship.minimum_score', 'relationship', 'scoring', 'Minimum Score', 'Floor for relationship scores', 'number', '{"min": 0, "max": 50}', '10', '10'),
('relationship.high_value_threshold', 'relationship', 'classification', 'High Value Threshold', 'Score threshold for high-value contacts', 'number', '{"min": 50, "max": 100}', '75', '75'),
('relationship.at_risk_threshold', 'relationship', 'classification', 'At-Risk Threshold', 'Score threshold for at-risk classification', 'number', '{"min": 10, "max": 50}', '30', '30');

-- Biometric Settings (defaults, users can override)
INSERT INTO platform_config (config_key, category, subcategory, display_name, description, value_type, value_constraints, default_value, config_value) VALUES
('biometric.face_match_threshold', 'biometric', 'matching', 'Face Match Threshold', 'Minimum confidence for facial match', 'percentage', '{"min": 0.5, "max": 0.99}', '0.85', '0.85'),
('biometric.voice_match_threshold', 'biometric', 'matching', 'Voice Match Threshold', 'Minimum confidence for voice match', 'percentage', '{"min": 0.5, "max": 0.99}', '0.85', '0.85'),
('biometric.auto_tag_threshold', 'biometric', 'automation', 'Auto-Tag Threshold', 'Confidence required for automatic tagging', 'percentage', '{"min": 0.8, "max": 0.99}', '0.90', '0.90'),
('biometric.min_face_quality', 'biometric', 'quality', 'Minimum Face Quality', 'Minimum quality score for face enrollment', 'percentage', '{"min": 0.3, "max": 0.9}', '0.5', '0.5'),
('biometric.enrollment_samples_required', 'biometric', 'enrollment', 'Enrollment Samples Required', 'Number of samples needed for enrollment', 'number', '{"min": 1, "max": 10}', '3', '3');

-- Analysis Settings
INSERT INTO platform_config (config_key, category, subcategory, display_name, description, value_type, value_constraints, default_value, config_value) VALUES
('analysis.deception_high_threshold', 'analysis', 'deception', 'High Deception Threshold', 'Score threshold for high deception risk', 'percentage', '{"min": 0.5, "max": 0.95}', '0.7', '0.7'),
('analysis.personality_confidence_min', 'analysis', 'personality', 'Min Personality Confidence', 'Minimum confidence for personality insights', 'percentage', '{"min": 0.3, "max": 0.8}', '0.5', '0.5'),
('analysis.sentiment_neutral_range', 'analysis', 'sentiment', 'Neutral Sentiment Range', 'Range around 0 considered neutral', 'percentage', '{"min": 0.05, "max": 0.3}', '0.15', '0.15'),
('analysis.max_message_samples', 'analysis', 'processing', 'Max Message Samples', 'Maximum messages to sample for analysis', 'number', '{"min": 100, "max": 5000}', '2000', '2000'),
('analysis.recency_weight', 'analysis', 'weighting', 'Recency Weight', 'Weight given to recent vs older data', 'percentage', '{"min": 0.3, "max": 0.8}', '0.6', '0.6');

-- Intelligence Settings
INSERT INTO platform_config (config_key, category, subcategory, display_name, description, value_type, value_constraints, default_value, config_value) VALUES
('intelligence.churn_prediction_days', 'intelligence', 'prediction', 'Churn Prediction Window (days)', 'Days ahead to predict relationship churn', 'number', '{"min": 7, "max": 180}', '30', '30'),
('intelligence.opportunity_min_confidence', 'intelligence', 'opportunities', 'Min Opportunity Confidence', 'Minimum confidence to show opportunities', 'percentage', '{"min": 0.3, "max": 0.8}', '0.5', '0.5'),
('intelligence.risk_alert_threshold', 'intelligence', 'alerts', 'Risk Alert Threshold', 'Risk level to trigger alerts', 'percentage', '{"min": 0.4, "max": 0.9}', '0.6', '0.6'),
('intelligence.briefing_lookahead_days', 'intelligence', 'briefing', 'Briefing Lookahead (days)', 'Days ahead to include in briefings', 'number', '{"min": 1, "max": 14}', '7', '7'),
('intelligence.network_depth', 'intelligence', 'network', 'Network Analysis Depth', 'Degrees of separation to analyze', 'number', '{"min": 1, "max": 5}', '3', '3');

-- Enrichment Settings
INSERT INTO platform_config (config_key, category, subcategory, display_name, description, value_type, value_constraints, default_value, config_value) VALUES
('enrichment.auto_enrich_enabled', 'enrichment', 'automation', 'Auto-Enrich Enabled', 'Automatically enrich new contacts', 'boolean', null, 'true', 'true'),
('enrichment.rate_limit_per_hour', 'enrichment', 'limits', 'Rate Limit (per hour)', 'Maximum enrichments per hour', 'number', '{"min": 10, "max": 500}', '60', '60'),
('enrichment.max_cost_per_contact', 'enrichment', 'limits', 'Max Cost Per Contact (cents)', 'Maximum spend on single contact enrichment', 'number', '{"min": 10, "max": 500}', '100', '100'),
('enrichment.stale_data_days', 'enrichment', 'freshness', 'Stale Data Threshold (days)', 'Days before data is considered stale', 'number', '{"min": 30, "max": 365}', '90', '90'),
('enrichment.priority_sources', 'enrichment', 'sources', 'Priority Sources', 'Preferred enrichment data sources', 'json', null, '["linkedin", "company_website", "social"]', '["linkedin", "company_website", "social"]');

-- Automation Settings
INSERT INTO platform_config (config_key, category, subcategory, display_name, description, value_type, value_constraints, default_value, config_value) VALUES
('automation.cooldown_minutes', 'automation', 'limits', 'Automation Cooldown (minutes)', 'Minimum time between automation runs', 'number', '{"min": 5, "max": 1440}', '60', '60'),
('automation.max_daily_actions', 'automation', 'limits', 'Max Daily Actions', 'Maximum automated actions per day', 'number', '{"min": 10, "max": 1000}', '100', '100'),
('automation.require_approval_threshold', 'automation', 'safety', 'Approval Threshold', 'Risk score requiring manual approval', 'percentage', '{"min": 0.3, "max": 0.9}', '0.7', '0.7');

-- Security Settings
INSERT INTO platform_config (config_key, category, subcategory, display_name, description, value_type, value_constraints, default_value, config_value) VALUES
('security.anomaly_deviation_multiplier', 'security', 'detection', 'Anomaly Deviation Multiplier', 'Standard deviations for anomaly detection', 'number', '{"min": 1, "max": 5}', '2', '2'),
('security.threat_assessment_frequency_hours', 'security', 'assessment', 'Threat Assessment Frequency (hours)', 'How often to run threat assessments', 'number', '{"min": 1, "max": 168}', '24', '24'),
('security.max_failed_auth_attempts', 'security', 'authentication', 'Max Failed Auth Attempts', 'Failed attempts before lockout', 'number', '{"min": 3, "max": 20}', '5', '5'),
('security.session_timeout_hours', 'security', 'session', 'Session Timeout (hours)', 'Idle session timeout', 'number', '{"min": 1, "max": 168}', '24', '24');