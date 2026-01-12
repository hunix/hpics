-- Phase 1 & 2: Comprehensive Intelligence Scan & Preference Predictions

-- Track comprehensive scan sessions
CREATE TABLE IF NOT EXISTS comprehensive_scan_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  stages_completed JSONB DEFAULT '[]'::jsonb,
  total_stages INTEGER DEFAULT 10,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  results_summary JSONB,
  cost_cents INTEGER DEFAULT 0,
  error_message TEXT,
  device_type TEXT DEFAULT 'desktop', -- 'mobile' or 'desktop'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE comprehensive_scan_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own scan sessions"
ON comprehensive_scan_sessions FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_scan_sessions_profile ON comprehensive_scan_sessions(profile_id);
CREATE INDEX IF NOT EXISTS idx_scan_sessions_user_status ON comprehensive_scan_sessions(user_id, status);

-- Contact predicted preferences table
CREATE TABLE IF NOT EXISTS contact_predicted_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  preference_category TEXT NOT NULL CHECK (preference_category IN ('food', 'academic', 'professional', 'lifestyle', 'social', 'personal', 'entertainment', 'health', 'financial')),
  preference_key TEXT NOT NULL,
  predicted_value TEXT,
  confidence_score REAL DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  evidence_sources JSONB DEFAULT '[]'::jsonb,
  evidence_count INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(profile_id, user_id, preference_category, preference_key)
);

-- Enable RLS
ALTER TABLE contact_predicted_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own preference predictions"
ON contact_predicted_preferences FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_preferences_profile ON contact_predicted_preferences(profile_id);
CREATE INDEX IF NOT EXISTS idx_preferences_category ON contact_predicted_preferences(profile_id, preference_category);
CREATE INDEX IF NOT EXISTS idx_preferences_confidence ON contact_predicted_preferences(profile_id, confidence_score DESC);

-- Phase 4: Enhanced storage tracking - Account-level storage summary function
CREATE OR REPLACE FUNCTION get_account_storage_summary(p_user_id UUID)
RETURNS TABLE (
  total_bytes BIGINT,
  media_bytes BIGINT,
  document_bytes BIGINT,
  recording_bytes BIGINT,
  message_count BIGINT,
  contact_count INTEGER,
  ai_tokens_used BIGINT,
  ai_cost_cents BIGINT,
  storage_quota_bytes BIGINT,
  usage_percentage REAL
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quota BIGINT := 10737418240; -- 10GB default quota
BEGIN
  RETURN QUERY
  WITH media_stats AS (
    SELECT COALESCE(SUM(file_size), 0) as size FROM media WHERE user_id = p_user_id
  ),
  doc_stats AS (
    SELECT COALESCE(SUM(file_size), 0) as size FROM documents WHERE user_id = p_user_id
  ),
  recording_stats AS (
    SELECT COALESCE(SUM(file_size), 0) as size FROM meeting_recordings WHERE user_id = p_user_id
  ),
  msg_stats AS (
    SELECT COUNT(*) as cnt FROM messages WHERE user_id = p_user_id
  ),
  contact_stats AS (
    SELECT COUNT(*) as cnt FROM profiles WHERE user_id = p_user_id
  ),
  ai_stats AS (
    SELECT 
      COALESCE(SUM(total_tokens), 0) as tokens,
      COALESCE(SUM(actual_cost_cents), 0) as cost
    FROM ai_usage_logs 
    WHERE user_id = p_user_id AND status = 'completed'
  )
  SELECT 
    (SELECT size FROM media_stats) + (SELECT size FROM doc_stats) + (SELECT size FROM recording_stats),
    (SELECT size FROM media_stats),
    (SELECT size FROM doc_stats),
    (SELECT size FROM recording_stats),
    (SELECT cnt FROM msg_stats),
    (SELECT cnt FROM contact_stats)::INTEGER,
    (SELECT tokens FROM ai_stats),
    (SELECT cost FROM ai_stats),
    v_quota,
    ((SELECT size FROM media_stats) + (SELECT size FROM doc_stats) + (SELECT size FROM recording_stats))::REAL / v_quota * 100;
END;
$$;

-- Phase 5: Data access monitoring for security
CREATE TABLE IF NOT EXISTS data_access_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  access_type TEXT NOT NULL CHECK (access_type IN ('view', 'create', 'update', 'delete', 'export', 'analysis')),
  ip_address INET,
  user_agent TEXT,
  accessed_at TIMESTAMPTZ DEFAULT now(),
  anomaly_score REAL DEFAULT 0,
  is_flagged BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE data_access_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own access events"
ON data_access_events FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert access events"
ON data_access_events FOR INSERT
WITH CHECK (true);

-- Create indexes for access events
CREATE INDEX IF NOT EXISTS idx_access_events_user ON data_access_events(user_id, accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_access_events_flagged ON data_access_events(user_id, is_flagged) WHERE is_flagged = true;
CREATE INDEX IF NOT EXISTS idx_access_events_resource ON data_access_events(resource_type, resource_id);

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION update_scan_session_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_scan_sessions_timestamp
BEFORE UPDATE ON comprehensive_scan_sessions
FOR EACH ROW EXECUTE FUNCTION update_scan_session_updated_at();