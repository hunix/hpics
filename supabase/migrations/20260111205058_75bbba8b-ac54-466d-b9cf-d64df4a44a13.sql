-- =====================================================
-- CENTRALIZED AI ANALYSIS SYSTEM (CAAS) - EVENT STORE
-- Immutable, append-only, hash-chained event sourcing
-- =====================================================

-- 1. SOURCE ASSET REGISTRY - Track assets even after deletion
CREATE TABLE IF NOT EXISTS public.source_asset_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
  -- Original Asset Reference
  asset_type TEXT NOT NULL, -- 'media', 'document', 'message', 'voice', 'capture'
  asset_id UUID NOT NULL,
  
  -- Preserved Metadata (survives asset deletion)
  original_filename TEXT,
  original_mime_type TEXT,
  content_hash TEXT,
  file_size_bytes BIGINT,
  metadata JSONB DEFAULT '{}',
  
  -- Lifecycle
  first_seen_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  last_analyzed_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  deletion_reason TEXT,
  
  -- Analysis State
  analysis_count INT DEFAULT 0,
  has_active_analyses BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  UNIQUE(user_id, asset_type, asset_id)
);

-- 2. ANALYSIS EVENTS - Immutable Append-Only Event Log
CREATE TABLE IF NOT EXISTS public.analysis_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_number BIGSERIAL UNIQUE NOT NULL,
  user_id UUID NOT NULL,
  profile_id UUID,
  
  -- Event Identity
  event_type TEXT NOT NULL, -- 'analysis_created', 'insight_added', 'pattern_detected', 'correlation_found'
  event_version INT DEFAULT 1,
  
  -- Source Asset Reference (preserved even if source deleted)
  source_type TEXT,
  source_id UUID,
  source_registry_id UUID REFERENCES source_asset_registry(id),
  source_hash TEXT,
  source_metadata JSONB DEFAULT '{}',
  
  -- Analysis Payload (immutable)
  analysis_type TEXT NOT NULL, -- 'psychological', 'linguistic', 'behavioral', 'biometric', 'facial', 'voice'
  analysis_subtype TEXT,
  analysis_model TEXT,
  analysis_version TEXT,
  raw_result JSONB NOT NULL,
  confidence_score NUMERIC(5,4),
  
  -- Extracted Insights (searchable)
  key_insights TEXT[],
  tags TEXT[],
  entities_mentioned JSONB,
  
  -- Chain Integrity (tamper-proof)
  previous_event_id UUID,
  previous_hash TEXT,
  event_hash TEXT NOT NULL,
  
  -- Metadata
  processing_duration_ms INT,
  cost_cents NUMERIC(10,2),
  tokens_used INT,
  
  -- Soft delete for user-requested removal only
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  deletion_request_id UUID,
  
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  CONSTRAINT valid_confidence CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1)),
  CONSTRAINT no_future_events CHECK (created_at <= now() + interval '1 minute')
);

-- 3. ANALYSIS AGGREGATES - Computed Current State
CREATE TABLE IF NOT EXISTS public.analysis_aggregates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID NOT NULL,
  aggregate_type TEXT NOT NULL, -- 'personality', 'behavior', 'biometric', 'linguistic', 'comprehensive'
  
  -- Current State (rebuilt from events)
  current_state JSONB NOT NULL DEFAULT '{}',
  version INT DEFAULT 1,
  last_event_sequence BIGINT,
  last_event_id UUID,
  
  -- Statistics
  total_events INT DEFAULT 0,
  active_events INT DEFAULT 0,
  first_analysis_at TIMESTAMPTZ,
  last_analysis_at TIMESTAMPTZ,
  
  -- Confidence Tracking
  average_confidence NUMERIC(5,4),
  confidence_trend JSONB DEFAULT '[]',
  
  -- Health
  rebuild_count INT DEFAULT 0,
  last_rebuild_at TIMESTAMPTZ,
  last_rebuild_duration_ms INT,
  needs_rebuild BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  UNIQUE(user_id, profile_id, aggregate_type)
);

-- 4. ANALYSIS SNAPSHOTS - Periodic State Snapshots for Performance
CREATE TABLE IF NOT EXISTS public.analysis_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aggregate_id UUID REFERENCES analysis_aggregates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  profile_id UUID NOT NULL,
  aggregate_type TEXT NOT NULL,
  
  -- Snapshot Data
  snapshot_sequence BIGINT NOT NULL,
  snapshot_data JSONB NOT NULL,
  snapshot_type TEXT DEFAULT 'periodic', -- 'periodic', 'milestone', 'user_requested', 'pre_deletion'
  
  -- Performance Data
  event_count_at_snapshot INT,
  events_since_last_snapshot INT,
  rebuild_duration_ms INT,
  
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 5. DELETION REQUESTS - User Consent for Data Removal
CREATE TABLE IF NOT EXISTS public.deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
  -- What to delete
  deletion_scope TEXT NOT NULL, -- 'single_event', 'asset_analysis', 'contact_all', 'date_range', 'analysis_type'
  scope_parameters JSONB NOT NULL,
  
  -- Impact Assessment
  events_affected INT,
  aggregates_affected INT,
  profiles_affected TEXT[],
  impact_preview JSONB,
  
  -- Consent & Audit
  requested_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  user_confirmation_method TEXT,
  confirmation_code TEXT,
  confirmed_at TIMESTAMPTZ,
  
  -- Execution
  status TEXT DEFAULT 'pending', -- 'pending', 'awaiting_confirmation', 'confirmed', 'executing', 'completed', 'failed', 'cancelled'
  executed_at TIMESTAMPTZ,
  events_deleted INT DEFAULT 0,
  execution_log JSONB DEFAULT '[]',
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 6. ENHANCED ANALYSIS JOBS - Central Job Tracking
CREATE TABLE IF NOT EXISTS public.orchestrator_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
  -- Job Identity
  job_type TEXT NOT NULL, -- 'single_analysis', 'batch_analysis', 'aggregate_rebuild', 'correlation', 'enrichment'
  job_subtype TEXT,
  idempotency_key TEXT UNIQUE,
  parent_job_id UUID REFERENCES orchestrator_jobs(id),
  
  -- Target
  profile_id UUID,
  source_type TEXT,
  source_id UUID,
  source_registry_id UUID REFERENCES source_asset_registry(id),
  
  -- State Machine
  status TEXT DEFAULT 'registered', -- 'registered', 'validating', 'queued', 'processing', 'completed', 'failed', 'cancelled', 'dead_letter'
  status_history JSONB DEFAULT '[]',
  
  -- Priority & Scheduling
  priority INT DEFAULT 5, -- 1-10, higher = more urgent
  scheduled_for TIMESTAMPTZ DEFAULT now(),
  deadline_at TIMESTAMPTZ,
  
  -- Processing
  worker_id TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  heartbeat_at TIMESTAMPTZ,
  
  -- Results
  result_event_ids UUID[],
  result_summary JSONB,
  
  -- Error Handling
  error_message TEXT,
  error_details JSONB,
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 3,
  last_retry_at TIMESTAMPTZ,
  
  -- Metrics
  estimated_cost_cents NUMERIC(10,2),
  actual_cost_cents NUMERIC(10,2),
  estimated_duration_ms INT,
  actual_duration_ms INT,
  tokens_used INT,
  
  -- Dependencies
  depends_on_jobs UUID[],
  blocks_jobs UUID[],
  
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 7. DEAD LETTER QUEUE - Failed Jobs for Manual Review
CREATE TABLE IF NOT EXISTS public.orchestrator_dead_letter (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_job_id UUID REFERENCES orchestrator_jobs(id),
  user_id UUID NOT NULL,
  
  -- Original Job Data
  job_snapshot JSONB NOT NULL,
  
  -- Failure Info
  failure_reason TEXT NOT NULL,
  failure_count INT DEFAULT 1,
  first_failure_at TIMESTAMPTZ DEFAULT now(),
  last_failure_at TIMESTAMPTZ DEFAULT now(),
  
  -- Resolution
  status TEXT DEFAULT 'pending', -- 'pending', 'reviewing', 'retrying', 'resolved', 'abandoned'
  resolution_notes TEXT,
  resolved_by TEXT,
  resolved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 8. SYSTEM HEALTH - Component Monitoring
CREATE TABLE IF NOT EXISTS public.system_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component TEXT NOT NULL UNIQUE, -- 'orchestrator', 'embeddings', 'biometrics', 'linguistic', 'behavioral'
  
  -- Health Status
  status TEXT DEFAULT 'unknown', -- 'healthy', 'degraded', 'down', 'unknown'
  last_heartbeat TIMESTAMPTZ,
  consecutive_failures INT DEFAULT 0,
  
  -- Metrics
  requests_last_hour INT DEFAULT 0,
  errors_last_hour INT DEFAULT 0,
  avg_latency_ms NUMERIC,
  p95_latency_ms NUMERIC,
  
  -- Circuit Breaker State
  circuit_state TEXT DEFAULT 'closed', -- 'closed', 'open', 'half_open'
  circuit_opened_at TIMESTAMPTZ,
  circuit_failure_count INT DEFAULT 0,
  
  -- Alerts
  active_alerts JSONB DEFAULT '[]',
  alert_history JSONB DEFAULT '[]',
  
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 9. CROSS-MODAL CORRELATIONS - Insights across analysis types
CREATE TABLE IF NOT EXISTS public.cross_modal_correlations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID NOT NULL,
  
  -- Correlation Identity
  correlation_type TEXT NOT NULL, -- 'voice_facial', 'linguistic_behavioral', 'temporal_pattern'
  
  -- Source Events
  source_event_ids UUID[] NOT NULL,
  source_analysis_types TEXT[] NOT NULL,
  
  -- Correlation Result
  correlation_strength NUMERIC(5,4),
  correlation_data JSONB NOT NULL,
  insights TEXT[],
  
  -- Validation
  confidence_score NUMERIC(5,4),
  validated_by_user BOOLEAN DEFAULT false,
  validation_feedback TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Analysis Events
CREATE INDEX idx_analysis_events_user_profile ON analysis_events(user_id, profile_id);
CREATE INDEX idx_analysis_events_sequence ON analysis_events(sequence_number);
CREATE INDEX idx_analysis_events_type ON analysis_events(analysis_type);
CREATE INDEX idx_analysis_events_source ON analysis_events(source_type, source_id);
CREATE INDEX idx_analysis_events_created ON analysis_events(created_at DESC);
CREATE INDEX idx_analysis_events_not_deleted ON analysis_events(user_id, profile_id) WHERE is_deleted = false;

-- Aggregates
CREATE INDEX idx_analysis_aggregates_user_profile ON analysis_aggregates(user_id, profile_id);
CREATE INDEX idx_analysis_aggregates_needs_rebuild ON analysis_aggregates(user_id) WHERE needs_rebuild = true;

-- Jobs
CREATE INDEX idx_orchestrator_jobs_status ON orchestrator_jobs(status);
CREATE INDEX idx_orchestrator_jobs_user ON orchestrator_jobs(user_id);
CREATE INDEX idx_orchestrator_jobs_scheduled ON orchestrator_jobs(scheduled_for) WHERE status IN ('registered', 'queued');
CREATE INDEX idx_orchestrator_jobs_processing ON orchestrator_jobs(worker_id, heartbeat_at) WHERE status = 'processing';

-- Source Registry
CREATE INDEX idx_source_registry_user ON source_asset_registry(user_id);
CREATE INDEX idx_source_registry_asset ON source_asset_registry(asset_type, asset_id);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to compute event hash
CREATE OR REPLACE FUNCTION compute_event_hash(
  p_event_id UUID,
  p_previous_hash TEXT,
  p_event_type TEXT,
  p_analysis_type TEXT,
  p_raw_result JSONB,
  p_created_at TIMESTAMPTZ
) RETURNS TEXT AS $$
BEGIN
  RETURN encode(
    sha256(
      (p_event_id::text || COALESCE(p_previous_hash, 'genesis') || p_event_type || p_analysis_type || p_raw_result::text || p_created_at::text)::bytea
    ),
    'hex'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to rebuild analysis aggregate from events
CREATE OR REPLACE FUNCTION rebuild_analysis_aggregate(
  p_user_id UUID,
  p_profile_id UUID,
  p_aggregate_type TEXT
) RETURNS JSONB AS $$
DECLARE
  v_result JSONB := '{}';
  v_event RECORD;
  v_last_sequence BIGINT := 0;
  v_last_event_id UUID;
  v_event_count INT := 0;
  v_active_count INT := 0;
  v_confidence_sum NUMERIC := 0;
  v_first_at TIMESTAMPTZ;
  v_last_at TIMESTAMPTZ;
  v_start_time TIMESTAMPTZ := clock_timestamp();
  v_duration_ms INT;
BEGIN
  -- Replay all non-deleted events in order
  FOR v_event IN 
    SELECT * FROM analysis_events 
    WHERE user_id = p_user_id 
      AND profile_id = p_profile_id
      AND analysis_type = p_aggregate_type
      AND is_deleted = false
    ORDER BY sequence_number ASC
  LOOP
    -- Deep merge event result into state
    v_result := v_result || v_event.raw_result;
    v_last_sequence := v_event.sequence_number;
    v_last_event_id := v_event.id;
    v_event_count := v_event_count + 1;
    v_active_count := v_active_count + 1;
    
    IF v_event.confidence_score IS NOT NULL THEN
      v_confidence_sum := v_confidence_sum + v_event.confidence_score;
    END IF;
    
    IF v_first_at IS NULL THEN
      v_first_at := v_event.created_at;
    END IF;
    v_last_at := v_event.created_at;
  END LOOP;
  
  v_duration_ms := EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start_time)::INT;
  
  -- Upsert aggregate
  INSERT INTO analysis_aggregates (
    user_id, profile_id, aggregate_type,
    current_state, version, last_event_sequence, last_event_id,
    total_events, active_events, first_analysis_at, last_analysis_at,
    average_confidence, rebuild_count, last_rebuild_at, last_rebuild_duration_ms,
    needs_rebuild, updated_at
  ) VALUES (
    p_user_id, p_profile_id, p_aggregate_type,
    v_result, 1, v_last_sequence, v_last_event_id,
    v_event_count, v_active_count, v_first_at, v_last_at,
    CASE WHEN v_active_count > 0 THEN v_confidence_sum / v_active_count ELSE NULL END,
    1, now(), v_duration_ms,
    false, now()
  )
  ON CONFLICT (user_id, profile_id, aggregate_type) DO UPDATE SET
    current_state = v_result,
    version = analysis_aggregates.version + 1,
    last_event_sequence = v_last_sequence,
    last_event_id = v_last_event_id,
    total_events = v_event_count,
    active_events = v_active_count,
    first_analysis_at = COALESCE(v_first_at, analysis_aggregates.first_analysis_at),
    last_analysis_at = v_last_at,
    average_confidence = CASE WHEN v_active_count > 0 THEN v_confidence_sum / v_active_count ELSE NULL END,
    rebuild_count = analysis_aggregates.rebuild_count + 1,
    last_rebuild_at = now(),
    last_rebuild_duration_ms = v_duration_ms,
    needs_rebuild = false,
    updated_at = now();
  
  RETURN jsonb_build_object(
    'success', true,
    'event_count', v_event_count,
    'duration_ms', v_duration_ms,
    'last_sequence', v_last_sequence
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get previous event for hash chaining
CREATE OR REPLACE FUNCTION get_previous_event_for_chain(p_user_id UUID, p_profile_id UUID)
RETURNS TABLE(event_id UUID, event_hash TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT ae.id, ae.event_hash
  FROM analysis_events ae
  WHERE ae.user_id = p_user_id
    AND (ae.profile_id = p_profile_id OR (ae.profile_id IS NULL AND p_profile_id IS NULL))
  ORDER BY ae.sequence_number DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-compute hash on insert
CREATE OR REPLACE FUNCTION trigger_compute_event_hash()
RETURNS TRIGGER AS $$
DECLARE
  v_prev_id UUID;
  v_prev_hash TEXT;
BEGIN
  -- Get previous event
  SELECT event_id, event_hash INTO v_prev_id, v_prev_hash
  FROM get_previous_event_for_chain(NEW.user_id, NEW.profile_id);
  
  NEW.previous_event_id := v_prev_id;
  NEW.previous_hash := v_prev_hash;
  NEW.event_hash := compute_event_hash(
    NEW.id,
    v_prev_hash,
    NEW.event_type,
    NEW.analysis_type,
    NEW.raw_result,
    NEW.created_at
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER analysis_events_compute_hash
BEFORE INSERT ON analysis_events
FOR EACH ROW
EXECUTE FUNCTION trigger_compute_event_hash();

-- Trigger to mark aggregate as needing rebuild on new event
CREATE OR REPLACE FUNCTION trigger_mark_aggregate_rebuild()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE analysis_aggregates
  SET needs_rebuild = true, updated_at = now()
  WHERE user_id = NEW.user_id
    AND profile_id = NEW.profile_id
    AND aggregate_type = NEW.analysis_type;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER analysis_events_mark_rebuild
AFTER INSERT ON analysis_events
FOR EACH ROW
EXECUTE FUNCTION trigger_mark_aggregate_rebuild();

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE source_asset_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_aggregates ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE orchestrator_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE orchestrator_dead_letter ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE cross_modal_correlations ENABLE ROW LEVEL SECURITY;

-- Source Asset Registry
CREATE POLICY "Users can view own asset registry" ON source_asset_registry FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own asset registry" ON source_asset_registry FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own asset registry" ON source_asset_registry FOR UPDATE USING (auth.uid() = user_id);

-- Analysis Events (no delete - immutable!)
CREATE POLICY "Users can view own analysis events" ON analysis_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own analysis events" ON analysis_events FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Note: No UPDATE or DELETE policies - events are immutable

-- Analysis Aggregates
CREATE POLICY "Users can view own aggregates" ON analysis_aggregates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own aggregates" ON analysis_aggregates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own aggregates" ON analysis_aggregates FOR UPDATE USING (auth.uid() = user_id);

-- Snapshots
CREATE POLICY "Users can view own snapshots" ON analysis_snapshots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own snapshots" ON analysis_snapshots FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Deletion Requests
CREATE POLICY "Users can view own deletion requests" ON deletion_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own deletion requests" ON deletion_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own deletion requests" ON deletion_requests FOR UPDATE USING (auth.uid() = user_id);

-- Orchestrator Jobs
CREATE POLICY "Users can view own jobs" ON orchestrator_jobs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own jobs" ON orchestrator_jobs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own jobs" ON orchestrator_jobs FOR UPDATE USING (auth.uid() = user_id);

-- Dead Letter
CREATE POLICY "Users can view own dead letter" ON orchestrator_dead_letter FOR SELECT USING (auth.uid() = user_id);

-- System Health (readable by all authenticated users)
CREATE POLICY "Authenticated users can view system health" ON system_health FOR SELECT USING (auth.uid() IS NOT NULL);

-- Cross Modal Correlations
CREATE POLICY "Users can view own correlations" ON cross_modal_correlations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own correlations" ON cross_modal_correlations FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- INITIAL SYSTEM HEALTH RECORDS
-- =====================================================

INSERT INTO system_health (component, status) VALUES
  ('orchestrator', 'healthy'),
  ('embeddings', 'healthy'),
  ('biometrics', 'healthy'),
  ('linguistic', 'healthy'),
  ('behavioral', 'healthy'),
  ('facial', 'healthy'),
  ('voice', 'healthy'),
  ('correlation', 'healthy')
ON CONFLICT (component) DO NOTHING;