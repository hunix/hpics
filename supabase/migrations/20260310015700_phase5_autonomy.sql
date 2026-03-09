-- ============================================================
-- Phase 5: Autonomy at Scale
-- Date: 2026-03-10
-- ============================================================
-- Goal-directed intelligence, proactive briefings, memory
-- consolidation, adaptive prompt evolution, and performance.
-- ============================================================

-- ============================================================
-- 1. Strategic Goals (user-defined intelligence objectives)
-- ============================================================

CREATE TABLE IF NOT EXISTS strategic_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  -- Goal definition
  title text NOT NULL,
  description text,
  goal_type text NOT NULL DEFAULT 'investigation', -- 'investigation' | 'monitoring' | 'assessment' | 'collection' | 'influence'
  priority text NOT NULL DEFAULT 'medium',         -- 'low' | 'medium' | 'high' | 'critical'
  -- Autonomous execution
  status text NOT NULL DEFAULT 'active',           -- 'active' | 'paused' | 'completed' | 'archived'
  progress_pct float DEFAULT 0,                    -- 0-100
  sub_tasks jsonb DEFAULT '[]',                    -- [{id, description, status, assigned_agent, completed_at}]
  -- Intelligence output
  findings jsonb DEFAULT '[]',                     -- [{finding, confidence, source, timestamp}]
  intelligence_gaps jsonb DEFAULT '[]',            -- [{gap, priority, suggested_action}]
  reports_generated uuid[] DEFAULT '{}',            -- references to intelligence_reports
  -- Scheduling
  execution_frequency text DEFAULT 'daily',        -- 'hourly' | 'daily' | 'weekly' | 'on_demand'
  last_execution_at timestamptz,
  next_execution_at timestamptz,
  executions_count integer DEFAULT 0,
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS strategic_goals_user_idx
  ON strategic_goals (user_id, status, priority DESC)
  WHERE status = 'active';

ALTER TABLE strategic_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own strategic goals"
  ON strategic_goals FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- 2. Memory Consolidation Log
-- ============================================================

CREATE TABLE IF NOT EXISTS memory_consolidation_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  -- Consolidation run
  run_type text NOT NULL DEFAULT 'nightly',  -- 'nightly' | 'weekly' | 'manual'
  status text NOT NULL DEFAULT 'running',    -- 'running' | 'completed' | 'failed'
  -- Stats
  episodic_events_processed integer DEFAULT 0,
  semantic_facts_created integer DEFAULT 0,
  semantic_facts_updated integer DEFAULT 0,
  low_confidence_pruned integer DEFAULT 0,
  contradictions_resolved integer DEFAULT 0,
  -- Quality
  knowledge_graph_nodes_before integer,
  knowledge_graph_nodes_after integer,
  average_fact_confidence_before float,
  average_fact_confidence_after float,
  -- Timing
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE memory_consolidation_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own consolidation log"
  ON memory_consolidation_log FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- 3. Prompt Evolution (A/B testing + multi-armed bandit)
-- ============================================================

CREATE TABLE IF NOT EXISTS prompt_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Variant definition
  agent_role text NOT NULL,            -- 'researcher' | 'analyst' | etc.
  variant_name text NOT NULL,
  prompt_text text NOT NULL,
  is_active boolean DEFAULT true,
  is_champion boolean DEFAULT false,   -- current best performer
  -- Performance tracking (multi-armed bandit)
  total_uses integer DEFAULT 0,
  total_reward float DEFAULT 0,        -- cumulative quality score
  average_reward float DEFAULT 0,      -- average quality per use
  ucb_score float DEFAULT 999,         -- Upper Confidence Bound score
  -- Quality metrics
  avg_confidence float DEFAULT 0,
  avg_completeness float DEFAULT 0,
  avg_reasoning_quality float DEFAULT 0,
  avg_user_rating float,               -- 1-5 from user feedback
  user_ratings_count integer DEFAULT 0,
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS prompt_variants_agent_idx
  ON prompt_variants (agent_role, is_active, ucb_score DESC)
  WHERE is_active = true;

ALTER TABLE prompt_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own prompt variants"
  ON prompt_variants FOR ALL
  USING (auth.uid() = user_id OR user_id IS NULL);

-- ============================================================
-- 4. Intelligence Convergence (gap tracking)
-- ============================================================

CREATE TABLE IF NOT EXISTS intelligence_convergence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  -- Overall score
  convergence_score float NOT NULL DEFAULT 0,  -- 0-100
  -- Dimension scores
  financial_depth float DEFAULT 0,
  family_network float DEFAULT 0,
  professional_network float DEFAULT 0,
  behavioral_baseline float DEFAULT 0,
  stress_triggers float DEFAULT 0,
  communication_patterns float DEFAULT 0,
  travel_patterns float DEFAULT 0,
  digital_footprint float DEFAULT 0,
  biometric_coverage float DEFAULT 0,
  osint_coverage float DEFAULT 0,
  -- Gaps
  identified_gaps jsonb DEFAULT '[]',    -- [{dimension, current_score, priority, suggested_collection_action}]
  auto_collection_tasks jsonb DEFAULT '[]', -- [{task_id, status, description}]
  -- History
  previous_score float,
  score_delta float,
  -- Timestamps
  computed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS intelligence_convergence_profile_idx
  ON intelligence_convergence (user_id, profile_id, computed_at DESC);

ALTER TABLE intelligence_convergence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own convergence"
  ON intelligence_convergence FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- 5. Materialized Views for Performance
-- ============================================================

-- Dashboard aggregation view
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_dashboard_stats AS
SELECT
  user_id,
  COUNT(DISTINCT e.id) AS total_events,
  COUNT(DISTINCT e.id) FILTER (WHERE e.severity IN ('high', 'critical') AND NOT e.acknowledged) AS urgent_events,
  COUNT(DISTINCT e.profile_id) AS contacts_with_events,
  COUNT(DISTINCT o.id) AS total_osint_mentions,
  COUNT(DISTINCT o.id) FILTER (WHERE o.is_actionable AND NOT o.reviewed) AS actionable_osint,
  COUNT(DISTINCT b.id) AS total_biometric_templates,
  COUNT(DISTINCT s.id) AS total_agent_sessions,
  COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'completed') AS completed_sessions,
  AVG(s.confidence_score) FILTER (WHERE s.status = 'completed') AS avg_session_confidence,
  COUNT(DISTINCT g.id) FILTER (WHERE g.status = 'active') AS active_goals
FROM intelligence_events e
FULL OUTER JOIN osint_mentions o ON e.user_id = o.user_id
FULL OUTER JOIN biometric_embeddings b ON e.user_id = b.user_id
FULL OUTER JOIN agent_sessions s ON e.user_id = s.user_id
FULL OUTER JOIN strategic_goals g ON e.user_id = g.user_id
GROUP BY user_id;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX IF NOT EXISTS mv_dashboard_stats_user_idx ON mv_dashboard_stats (user_id);

-- Contact intelligence summary view
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_contact_intelligence AS
SELECT
  e.user_id,
  e.profile_id,
  COUNT(e.id) AS event_count,
  COUNT(e.id) FILTER (WHERE e.severity IN ('high', 'critical')) AS high_severity_events,
  MAX(e.occurred_at) AS last_event_at,
  AVG(e.anomaly_score) FILTER (WHERE e.anomaly_score IS NOT NULL) AS avg_anomaly_score
FROM intelligence_events e
WHERE e.profile_id IS NOT NULL
GROUP BY e.user_id, e.profile_id;

CREATE UNIQUE INDEX IF NOT EXISTS mv_contact_intelligence_idx
  ON mv_contact_intelligence (user_id, profile_id);
