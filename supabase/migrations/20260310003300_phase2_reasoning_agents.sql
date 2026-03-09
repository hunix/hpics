-- ============================================================
-- Phase 2: Deep Reasoning Engine + Multi-Agent Runtime
-- Date: 2026-03-10
-- ============================================================
-- Agent sessions, reasoning chains, intelligence reports schema,
-- vulnerability window tracking, debate mode records.
-- ============================================================

-- ============================================================
-- 1. Agent Sessions (persisted agent conversations for audit)
-- ============================================================

CREATE TABLE IF NOT EXISTS agent_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  session_type text NOT NULL DEFAULT 'standard',  -- 'standard' | 'debate' | 'deep_analysis' | 'goal_driven'
  goal text NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  -- Multi-agent conversation
  agent_turns jsonb DEFAULT '[]',  -- [{agent_role, model, thinking, output, duration_ms, tokens}]
  inter_agent_messages jsonb DEFAULT '[]',  -- messages between agents
  -- Outputs
  final_report text,
  confidence_score float,            -- 0-100
  self_verification_score float,     -- 0-100
  contradiction_count integer DEFAULT 0,
  -- CoT chain
  reasoning_chain jsonb DEFAULT '[]', -- [{step, hypothesis, evidence, conclusion, confidence}]
  -- Model routing
  models_used jsonb DEFAULT '{}',    -- {agent_role: model_name}
  complexity_score float,            -- 0-100 classifier output
  -- Timing
  started_at timestamptz,
  completed_at timestamptz,
  duration_ms integer,
  total_tokens integer,
  estimated_cost_usd numeric(10,6),
  -- Metadata
  phase_ids integer[],  -- AGIS phases covered [1..22]
  sources_retrieved integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agent_sessions_user_profile_idx
  ON agent_sessions (user_id, profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS agent_sessions_status_idx
  ON agent_sessions (user_id, status, created_at DESC);

ALTER TABLE agent_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own agent sessions"
  ON agent_sessions FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- 2. Intelligence Reasoning Chains (persistent CoT storage)
-- ============================================================

CREATE TABLE IF NOT EXISTS intelligence_reasoning_chains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  agent_session_id uuid REFERENCES agent_sessions(id) ON DELETE CASCADE,
  agis_phase integer,
  -- Chain structure
  initial_query text NOT NULL,
  steps jsonb NOT NULL DEFAULT '[]',  -- [{step_number, type, content, sources, confidence, duration_ms}]
  -- Step types: 'hypothesis' | 'evidence_retrieval' | 'analysis' | 'contradiction_check' | 'synthesis' | 'verification'
  conclusion text,
  confidence_score float,
  uncertainty_flags text[] DEFAULT '{}',  -- ['insufficient_data', 'contradicting_evidence', 'recency_bias']
  -- Explainability
  key_evidence text[],
  alternative_conclusions jsonb DEFAULT '[]',
  model_used text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reasoning_chains_profile_idx
  ON intelligence_reasoning_chains (user_id, profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS reasoning_chains_phase_idx
  ON intelligence_reasoning_chains (user_id, agis_phase, created_at DESC);

ALTER TABLE intelligence_reasoning_chains ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own reasoning chains"
  ON intelligence_reasoning_chains FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- 3. Debate Records (Agent Debate Mode)
-- ============================================================

CREATE TABLE IF NOT EXISTS agent_debate_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  agent_session_id uuid REFERENCES agent_sessions(id) ON DELETE CASCADE,
  topic text NOT NULL,
  -- Debater outputs
  optimist_position text,
  pessimist_position text,
  optimist_evidence jsonb DEFAULT '[]',
  pessimist_evidence jsonb DEFAULT '[]',
  -- Judge output
  judge_conclusion text,
  judge_confidence float,
  calibrated_assessment text,
  -- Scores
  optimist_score float,    -- 0-100 strength of argument
  pessimist_score float,
  -- Metadata
  debate_rounds integer DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE agent_debate_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own debate records"
  ON agent_debate_records FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- 4. Vulnerability Window Predictions
-- ============================================================

CREATE TABLE IF NOT EXISTS vulnerability_window_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  -- Prediction
  window_start timestamptz NOT NULL,
  window_end timestamptz NOT NULL,
  vulnerability_type text NOT NULL,  -- 'stress_peak' | 'decision_fatigue' | 'emotional_disruption' | 'routine_break'
  predicted_intensity float NOT NULL,  -- 0-100
  confidence float NOT NULL,           -- 0-100
  -- Evidence
  contributing_factors jsonb DEFAULT '[]',  -- [{factor, weight, description}]
  behavioral_signals text[] DEFAULT '{}',
  -- Status
  status text DEFAULT 'predicted', -- 'predicted' | 'active' | 'passed' | 'validated'
  validation_score float,          -- post-hoc accuracy score
  -- Recommended actions
  recommended_actions jsonb DEFAULT '[]',  -- [{action, timing, rationale, expected_effectiveness}]
  -- Metadata
  model_used text,
  computed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS vuln_windows_profile_idx
  ON vulnerability_window_predictions (user_id, profile_id, window_start);
CREATE INDEX IF NOT EXISTS vuln_windows_active_idx
  ON vulnerability_window_predictions (user_id, status, window_start)
  WHERE status IN ('predicted', 'active');

ALTER TABLE vulnerability_window_predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own vulnerability predictions"
  ON vulnerability_window_predictions FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- 5. Intelligence Reports (structured AGIS output)
-- ============================================================

CREATE TABLE IF NOT EXISTS intelligence_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  agent_session_id uuid REFERENCES agent_sessions(id) ON DELETE SET NULL,
  -- Report identity
  report_type text NOT NULL,  -- 'standard' | 'dossier' | 'threat_assessment' | 'influence_map' | 'debate_resolution'
  title text NOT NULL,
  executive_summary text,
  full_content text,
  -- Intelligence quality
  confidence_score float DEFAULT 0,  -- 0-100
  completeness_score float DEFAULT 0, -- 0-100 (uses convergence score)
  reasoning_quality float DEFAULT 0,  -- 0-100 (self-verification output)
  -- Evidence chain
  evidence_sources jsonb DEFAULT '[]',  -- [{type, id, relevance, excerpt}]
  citation_count integer DEFAULT 0,
  -- Key findings
  key_findings jsonb DEFAULT '[]',        -- [{finding, confidence, evidence_ids[]}]
  uncertainty_flags text[] DEFAULT '{}',
  -- Contradiction info
  contradictions_detected integer DEFAULT 0,
  contradictions_resolved integer DEFAULT 0,
  -- Embedding for report search
  embedding vector(1536),
  -- Version control
  report_version integer DEFAULT 1,
  superseded_by uuid REFERENCES intelligence_reports(id),
  -- Metadata
  phase_coverage integer[] DEFAULT '{}',  -- which AGIS phases covered
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP INDEX IF EXISTS intelligence_reports_embedding_idx;
CREATE INDEX intelligence_reports_embedding_idx
  ON intelligence_reports
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS intelligence_reports_profile_idx
  ON intelligence_reports (user_id, profile_id, created_at DESC);

ALTER TABLE intelligence_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own intelligence reports"
  ON intelligence_reports FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- 6. Proactive Intelligence Briefings
-- ============================================================

CREATE TABLE IF NOT EXISTS intelligence_briefings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  briefing_date date NOT NULL DEFAULT CURRENT_DATE,
  title text NOT NULL DEFAULT 'Daily Intelligence Brief',
  -- Content sections
  priority_contacts jsonb DEFAULT '[]',    -- [{profile_id, name, urgency, reason, recommended_action}]
  emerging_threats jsonb DEFAULT '[]',     -- [{description, contacts_involved, severity, recommended_response}]
  opportunity_windows jsonb DEFAULT '[]',  -- [{profile_id, name, window_type, timing, recommended_action}]
  behavioral_changes jsonb DEFAULT '[]',   -- [{profile_id, change_description, significance}]
  -- Metadata
  generated_by_agent_session uuid REFERENCES agent_sessions(id),
  read_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, briefing_date)
);

ALTER TABLE intelligence_briefings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own briefings"
  ON intelligence_briefings FOR ALL
  USING (auth.uid() = user_id);
