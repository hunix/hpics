-- ============================================================
-- Phase 3: Real-Time Intelligence Stream + OSINT Engine
-- Date: 2026-03-10
-- ============================================================
-- Intelligence event bus, CEP rules, OSINT collection tracking,
-- threat assessments, anomaly scoring, and temporal attack graphs.
-- ============================================================

-- ============================================================
-- 1. Intelligence Events (real-time event bus)
-- ============================================================

CREATE TABLE IF NOT EXISTS intelligence_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  -- Event classification
  event_type text NOT NULL,           -- 'ContactMentioned' | 'BehaviorAnomaly' | 'NewIntelligence' | 'ThreatDetected' | 'VulnerabilityWindow' | 'DeceptionMarker' | 'TravelDetected' | 'FinancialAnomaly' | 'CommunicationPattern' | 'OSINTHit'
  severity text NOT NULL DEFAULT 'info',  -- 'info' | 'low' | 'medium' | 'high' | 'critical'
  -- Content
  title text NOT NULL,
  description text,
  raw_data jsonb DEFAULT '{}',
  -- Source tracking
  source_function text,               -- which edge function emitted this
  source_type text,                    -- 'internal' | 'osint' | 'behavioral' | 'biometric' | 'cep_rule'
  -- Correlation
  correlation_id uuid,                 -- for grouping related events
  parent_event_id uuid REFERENCES intelligence_events(id),
  -- Anomaly scoring
  anomaly_score float,                 -- 0-100, null if not anomaly-scored
  baseline_deviation float,            -- standard deviations from behavioral baseline
  -- Status
  acknowledged boolean DEFAULT false,
  acknowledged_at timestamptz,
  resolved boolean DEFAULT false,
  resolution_notes text,
  -- Timestamps
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS intelligence_events_user_time_idx
  ON intelligence_events (user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS intelligence_events_type_severity_idx
  ON intelligence_events (user_id, event_type, severity, occurred_at DESC);
CREATE INDEX IF NOT EXISTS intelligence_events_profile_idx
  ON intelligence_events (user_id, profile_id, occurred_at DESC)
  WHERE profile_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS intelligence_events_unack_idx
  ON intelligence_events (user_id, acknowledged, severity, occurred_at DESC)
  WHERE acknowledged = false;

ALTER TABLE intelligence_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own intelligence events"
  ON intelligence_events FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- 2. CEP Rules (Complex Event Processing)
-- ============================================================

CREATE TABLE IF NOT EXISTS cep_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Rule definition
  rule_name text NOT NULL,
  description text,
  is_system boolean DEFAULT false,    -- true = system-provided, false = user-created
  is_active boolean DEFAULT true,
  -- Trigger conditions
  trigger_events text[] NOT NULL,     -- event_types that activate this rule
  time_window_hours integer NOT NULL DEFAULT 48,  -- window to correlate events
  min_event_count integer DEFAULT 2,  -- minimum events to trigger
  condition_expression jsonb,         -- additional filter: {"field": "anomaly_score", "op": ">", "value": 70}
  -- Output
  output_event_type text NOT NULL,    -- what event to emit
  output_severity text NOT NULL DEFAULT 'high',
  output_title_template text NOT NULL,  -- "Threat escalation: {contact_name}"
  output_description_template text,
  -- Scoring
  priority integer DEFAULT 50,        -- higher = evaluated first
  confidence_weight float DEFAULT 1.0,
  -- Stats
  times_triggered integer DEFAULT 0,
  last_triggered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cep_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own CEP rules"
  ON cep_rules FOR ALL
  USING (auth.uid() = user_id OR is_system = true);

-- Seed system CEP rules
INSERT INTO cep_rules (user_id, rule_name, description, is_system, trigger_events, time_window_hours, min_event_count, output_event_type, output_severity, output_title_template, output_description_template, priority) VALUES
  (NULL, 'Threat Escalation', 'Behavioral change + travel detected within 48h', true,
    ARRAY['BehaviorAnomaly', 'TravelDetected'], 48, 2,
    'ThreatDetected', 'high',
    'Threat Escalation: behavioral shift coinciding with travel',
    'Contact showed behavioral anomaly within 48h of detected travel activity. Consider operational review.', 90),
  (NULL, 'High Deception Risk', '3+ deception markers within 7 days', true,
    ARRAY['DeceptionMarker'], 168, 3,
    'ThreatDetected', 'high',
    'High Deception Risk: multiple deception signals detected',
    'Three or more deception markers detected within 7 days. Confidence in subject reliability should be downgraded.', 85),
  (NULL, 'Financial Anomaly Cluster', '2+ financial anomalies within 30 days', true,
    ARRAY['FinancialAnomaly'], 720, 2,
    'ThreatDetected', 'medium',
    'Financial Anomaly Cluster detected',
    'Multiple financial irregularities detected within 30 days. May indicate operational changes or vulnerability.', 70),
  (NULL, 'Communication Pattern Shift', 'Sudden change in communication frequency/style', true,
    ARRAY['CommunicationPattern', 'BehaviorAnomaly'], 72, 2,
    'BehaviorAnomaly', 'medium',
    'Communication pattern shift detected',
    'Significant change in communication patterns correlated with behavioral anomaly.', 60),
  (NULL, 'OSINT + Behavioral Convergence', 'OSINT finding coincides with behavioral change', true,
    ARRAY['OSINTHit', 'BehaviorAnomaly'], 96, 2,
    'NewIntelligence', 'high',
    'OSINT corroborates behavioral change',
    'External intelligence matches observed behavioral shift. High-confidence intelligence event.', 80)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 3. OSINT Collections (tracking what was collected)
-- ============================================================

CREATE TABLE IF NOT EXISTS osint_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  -- Collection metadata
  collection_type text NOT NULL,      -- 'news' | 'social_media' | 'regulatory' | 'domain' | 'dark_web' | 'deep_scan'
  source_name text NOT NULL,          -- 'tavily' | 'perplexity' | 'sec_edgar' | 'companies_house' | 'whois' | 'cert_transparency'
  status text NOT NULL DEFAULT 'pending',  -- 'pending' | 'running' | 'completed' | 'failed' | 'rate_limited'
  -- Results
  mentions_found integer DEFAULT 0,
  entities_extracted jsonb DEFAULT '[]',   -- [{entity, type, confidence, source_url}]
  raw_results jsonb DEFAULT '{}',
  -- Entity resolution
  resolved_entities jsonb DEFAULT '[]',    -- [{entity, matched_profile_id, confidence, method}]
  new_entities_discovered integer DEFAULT 0,
  -- Quality
  relevance_score float,               -- 0-100 how relevant were the results
  noise_ratio float,                    -- 0-1 how much noise vs signal
  -- Timing
  scheduled_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  duration_ms integer,
  next_scheduled_at timestamptz,
  -- Errors
  error_message text,
  retry_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS osint_collections_profile_idx
  ON osint_collections (user_id, profile_id, collection_type, created_at DESC);
CREATE INDEX IF NOT EXISTS osint_collections_schedule_idx
  ON osint_collections (user_id, status, next_scheduled_at)
  WHERE status NOT IN ('failed');

ALTER TABLE osint_collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own OSINT collections"
  ON osint_collections FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- 4. OSINT Mentions (individual findings)
-- ============================================================

CREATE TABLE IF NOT EXISTS osint_mentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  collection_id uuid REFERENCES osint_collections(id) ON DELETE CASCADE,
  -- Content
  source_type text NOT NULL,           -- 'news' | 'social' | 'regulatory' | 'domain' | 'forum'
  source_url text,
  source_name text,                    -- 'Reuters', 'LinkedIn', 'SEC EDGAR'
  title text,
  snippet text NOT NULL,
  full_content text,
  -- NER extraction
  entities_mentioned jsonb DEFAULT '[]',  -- [{entity, type, position}]
  sentiment text,                      -- 'positive' | 'neutral' | 'negative'
  sentiment_score float,               -- -1 to 1
  -- Relevance
  relevance_score float NOT NULL DEFAULT 0.5,  -- 0-1
  is_actionable boolean DEFAULT false,
  -- Entity resolution
  matched_confidence float,            -- how confident is the entity match
  match_method text,                   -- 'exact' | 'fuzzy' | 'ml_classifier'
  -- Embedding for dedup & search
  embedding vector(1536),
  -- Status
  reviewed boolean DEFAULT false,
  dismissed boolean DEFAULT false,
  -- Timestamps
  published_at timestamptz,
  discovered_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS osint_mentions_profile_idx
  ON osint_mentions (user_id, profile_id, discovered_at DESC);
CREATE INDEX IF NOT EXISTS osint_mentions_actionable_idx
  ON osint_mentions (user_id, is_actionable, reviewed)
  WHERE is_actionable = true AND reviewed = false;
DROP INDEX IF EXISTS osint_mentions_embedding_idx;
CREATE INDEX osint_mentions_embedding_idx
  ON osint_mentions
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

ALTER TABLE osint_mentions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own OSINT mentions"
  ON osint_mentions FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- 5. Threat Assessments (aggregated threat picture)
-- ============================================================

CREATE TABLE IF NOT EXISTS threat_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  -- Threat scoring
  overall_threat_level text NOT NULL DEFAULT 'low',  -- 'minimal' | 'low' | 'medium' | 'elevated' | 'high' | 'critical'
  threat_score float NOT NULL DEFAULT 0,             -- 0-100 composite
  -- Dimension scores
  deception_threat float DEFAULT 0,
  financial_threat float DEFAULT 0,
  operational_threat float DEFAULT 0,
  loyalty_threat float DEFAULT 0,
  external_threat float DEFAULT 0,
  -- Evidence
  contributing_events jsonb DEFAULT '[]',  -- [{event_id, weight, description}]
  cep_rules_triggered jsonb DEFAULT '[]',  -- [{rule_id, rule_name, triggered_at}]
  osint_signals jsonb DEFAULT '[]',        -- [{mention_id, signal, relevance}]
  -- Assessment
  ai_assessment text,
  recommended_actions jsonb DEFAULT '[]',  -- [{action, priority, rationale}]
  -- Temporal
  assessment_window_start timestamptz NOT NULL,
  assessment_window_end timestamptz NOT NULL,
  -- History
  previous_assessment_id uuid REFERENCES threat_assessments(id),
  score_delta float,                       -- change from previous assessment
  -- Metadata
  computed_by text DEFAULT 'stream-processor',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS threat_assessments_profile_idx
  ON threat_assessments (user_id, profile_id, created_at DESC);

ALTER TABLE threat_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own threat assessments"
  ON threat_assessments FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- 6. Temporal Attack Graph Nodes (event pattern tracking)
-- ============================================================

CREATE TABLE IF NOT EXISTS temporal_attack_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  -- Node data
  event_id uuid REFERENCES intelligence_events(id),
  node_type text NOT NULL,            -- 'meeting' | 'communication' | 'financial' | 'travel' | 'behavioral' | 'osint'
  label text NOT NULL,
  timestamp timestamptz NOT NULL,
  significance float DEFAULT 50,      -- 0-100
  -- Graph edges (stored as adjacency)
  connected_to uuid[] DEFAULT '{}',   -- other temporal_attack_nodes
  edge_types text[] DEFAULT '{}',     -- corresponding edge labels
  edge_weights float[] DEFAULT '{}',  -- corresponding edge strengths
  -- Pattern detection
  pattern_cluster text,               -- AI-assigned pattern group
  attack_stage text,                  -- 'reconnaissance' | 'approach' | 'development' | 'exploitation' | 'extraction'
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS temporal_attack_profile_idx
  ON temporal_attack_nodes (user_id, profile_id, timestamp DESC);

ALTER TABLE temporal_attack_nodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own temporal attack nodes"
  ON temporal_attack_nodes FOR ALL
  USING (auth.uid() = user_id);
