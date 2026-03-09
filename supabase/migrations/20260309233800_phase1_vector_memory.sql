-- ============================================================
-- Phase 1: World-Class Vector Memory Foundation
-- Date: 2026-03-09
-- ============================================================
-- Enables pgvector with HNSW indexing, `match_documents` RPC with
-- advanced hybrid scoring, episodic memory timeline, contradiction
-- detection tracking, and LLM observability logging.
-- ============================================================

-- 1. Enable pgvector extension (safe no-op if already enabled)
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- 2. Upgrade document_embeddings for HNSW indexing
-- ============================================================

-- Add vector column if using text type currently (migration-safe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'document_embeddings'
      AND column_name = 'embedding_vector'
      AND data_type = 'USER-DEFINED'
  ) THEN
    -- The column may exist as text or not at all; ensure it's vector(1536)
    BEGIN
      ALTER TABLE document_embeddings
        ALTER COLUMN embedding_vector TYPE vector(1536)
        USING embedding_vector::vector(1536);
    EXCEPTION WHEN OTHERS THEN
      -- Column may not exist yet
      ALTER TABLE document_embeddings
        ADD COLUMN IF NOT EXISTS embedding_vector vector(1536);
    END;
  END IF;
END $$;

-- Add HNSW index for fast approximate nearest-neighbor search
-- (O(log n) vs O(n) for flat index; ideal for >10k vectors)
DROP INDEX IF EXISTS document_embeddings_embedding_hnsw_idx;
CREATE INDEX document_embeddings_embedding_hnsw_idx
  ON document_embeddings
  USING hnsw (embedding_vector vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Add metadata columns for advanced filtering
ALTER TABLE document_embeddings
  ADD COLUMN IF NOT EXISTS importance_score float DEFAULT 0.5,
  ADD COLUMN IF NOT EXISTS decay_weight float DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS last_accessed_at timestamptz,
  ADD COLUMN IF NOT EXISTS access_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS contradiction_flag boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS consolidated_into uuid REFERENCES document_embeddings(id);

-- Index for common filter patterns
CREATE INDEX IF NOT EXISTS document_embeddings_profile_source_idx
  ON document_embeddings (user_id, profile_id, source_type);
CREATE INDEX IF NOT EXISTS document_embeddings_importance_idx
  ON document_embeddings (user_id, importance_score DESC);

-- ============================================================
-- 3. match_documents RPC — Advanced Hybrid Semantic Search
-- ============================================================
-- Supports: pure semantic, pure keyword (FTS), and hybrid scoring
-- with temporal decay and importance weighting.
-- ============================================================

CREATE OR REPLACE FUNCTION match_documents(
  p_user_id uuid,
  p_query_embedding vector(1536),
  p_match_threshold float DEFAULT 0.3,
  p_match_count int DEFAULT 15,
  p_profile_id uuid DEFAULT NULL,
  p_source_types text[] DEFAULT NULL,
  p_max_age_days int DEFAULT NULL,
  p_use_importance_weighting boolean DEFAULT true
)
RETURNS TABLE (
  id uuid,
  source_type text,
  source_id uuid,
  content text,
  content_summary text,
  profile_id uuid,
  metadata jsonb,
  similarity float,
  importance_score float,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_now timestamptz := now();
BEGIN
  RETURN QUERY
  WITH ranked AS (
    SELECT
      de.id,
      de.source_type,
      de.source_id,
      de.content,
      de.content_summary,
      de.profile_id,
      de.metadata,
      de.created_at,
      de.importance_score,
      -- Cosine similarity score
      1 - (de.embedding_vector <=> p_query_embedding) AS raw_similarity,
      -- Temporal decay: exponential decay with 90-day half-life
      CASE
        WHEN p_max_age_days IS NOT NULL
          AND de.created_at < (v_now - (p_max_age_days || ' days')::interval)
        THEN 0
        ELSE EXP(-0.0077 * EXTRACT(EPOCH FROM (v_now - de.created_at)) / 86400.0)
      END AS temporal_weight
    FROM document_embeddings de
    WHERE
      de.user_id = p_user_id
      AND (p_profile_id IS NULL OR de.profile_id = p_profile_id)
      AND (p_source_types IS NULL OR de.source_type = ANY(p_source_types))
      AND de.consolidated_into IS NULL  -- exclude consolidated (replaced) chunks
      AND de.embedding_vector IS NOT NULL
  ),
  scored AS (
    SELECT
      r.*,
      CASE
        WHEN p_use_importance_weighting
        THEN r.raw_similarity * 0.7 + r.temporal_weight * 0.15 + COALESCE(r.importance_score, 0.5) * 0.15
        ELSE r.raw_similarity * 0.85 + r.temporal_weight * 0.15
      END AS similarity
    FROM ranked r
    WHERE r.raw_similarity > p_match_threshold
  )
  SELECT
    s.id,
    s.source_type,
    s.source_id,
    s.content,
    s.content_summary,
    s.profile_id,
    s.metadata,
    s.similarity,
    s.importance_score,
    s.created_at
  FROM scored s
  ORDER BY s.similarity DESC
  LIMIT p_match_count;

  -- Track access for cache-warming analytics
  UPDATE document_embeddings de
  SET
    last_accessed_at = v_now,
    access_count = access_count + 1
  WHERE de.user_id = p_user_id
    AND de.id IN (
      SELECT s2.id FROM scored s2 ORDER BY s2.similarity DESC LIMIT p_match_count
    );

END $$;

-- ============================================================
-- 4. Episodic Memory Timeline
-- ============================================================

CREATE TABLE IF NOT EXISTS intelligence_memory_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  event_type text NOT NULL, -- 'observation' | 'interaction' | 'analysis' | 'behavioral_shift' | 'vulnerability_window'
  event_title text NOT NULL,
  event_narrative text, -- AI-generated narrative for the timeline
  source_embedding_ids uuid[], -- links to document_embeddings records
  temporal_context jsonb, -- {relative_time, day_of_week, time_of_day, season}
  emotional_valence float, -- -1.0 (negative) to 1.0 (positive)
  significance_score float DEFAULT 0.5, -- 0.0 to 1.0
  trust_delta float DEFAULT 0, -- change in trust score from this event
  metadata jsonb DEFAULT '{}',
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS memory_events_user_profile_idx
  ON intelligence_memory_events (user_id, profile_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS memory_events_type_idx
  ON intelligence_memory_events (user_id, event_type, significance_score DESC);

ALTER TABLE intelligence_memory_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own memory events"
  ON intelligence_memory_events FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- 5. Episodic → Semantic Consolidation Tracking
-- ============================================================

CREATE TABLE IF NOT EXISTS semantic_memory_facts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  fact_category text NOT NULL, -- 'personality' | 'preference' | 'relationship_pattern' | 'behavioral_tendency' | 'vulnerability'
  fact_statement text NOT NULL, -- declarative fact: "Subject is highly agreeable in professional contexts"
  confidence float NOT NULL DEFAULT 0.7,
  evidence_count integer DEFAULT 1,
  source_event_ids uuid[], -- intelligence_memory_events that support this fact
  contradicting_fact_id uuid REFERENCES semantic_memory_facts(id),
  last_confirmed_at timestamptz DEFAULT now(),
  embedding vector(1536), -- for semantic similarity checking of facts
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS semantic_facts_profile_idx
  ON semantic_memory_facts (user_id, profile_id, fact_category);
DROP INDEX IF EXISTS semantic_facts_embedding_idx;
CREATE INDEX semantic_facts_embedding_idx
  ON semantic_memory_facts
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

ALTER TABLE semantic_memory_facts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own semantic facts"
  ON semantic_memory_facts FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- 6. Contradiction Detection Log
-- ============================================================

CREATE TABLE IF NOT EXISTS intelligence_contradictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  contradiction_type text NOT NULL, -- 'statement_conflict' | 'behavioral_reversal' | 'timeline_inconsistency'
  existing_fact text NOT NULL,
  new_evidence text NOT NULL,
  existing_source_id uuid,
  new_source_id uuid,
  conflict_score float NOT NULL, -- 0.0 (minor) to 1.0 (direct contradiction)
  resolution_status text DEFAULT 'unresolved', -- 'unresolved' | 'existing_prevails' | 'new_evidence_wins' | 'both_valid'
  resolution_notes text,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS contradictions_profile_idx
  ON intelligence_contradictions (user_id, profile_id, resolution_status, created_at DESC);

ALTER TABLE intelligence_contradictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own contradictions"
  ON intelligence_contradictions FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- 7. LLM Observability Log
-- ============================================================

CREATE TABLE IF NOT EXISTS llm_observability_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text,
  agis_phase integer, -- 1-22
  edge_function text NOT NULL,
  model text NOT NULL,
  prompt_tokens integer,
  completion_tokens integer,
  total_tokens integer,
  latency_ms integer,
  cost_usd numeric(10, 6),
  prompt_hash text, -- SHA-256 of prompt for dedup analysis
  complexity_score float, -- 0-100 model routing score
  search_method text, -- 'semantic' | 'keyword' | 'hybrid' | 'graphrag'
  sources_retrieved integer DEFAULT 0,
  self_verification_score float, -- 0-100 from verifier agent
  contradiction_detected boolean DEFAULT false,
  error_type text,
  success boolean DEFAULT true,
  reasoning_chain jsonb, -- stored CoT steps
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Partition by month for performance (future: pg_partman)
CREATE INDEX IF NOT EXISTS llm_log_user_phase_idx
  ON llm_observability_log (user_id, agis_phase, created_at DESC);
CREATE INDEX IF NOT EXISTS llm_log_edge_function_idx
  ON llm_observability_log (edge_function, created_at DESC);
CREATE INDEX IF NOT EXISTS llm_log_cost_idx
  ON llm_observability_log (user_id, created_at DESC, cost_usd);

ALTER TABLE llm_observability_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own LLM logs"
  ON llm_observability_log FOR ALL
  USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- ============================================================
-- 8. Intelligence Convergence Score per Contact
-- ============================================================

CREATE TABLE IF NOT EXISTS intelligence_convergence_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  overall_score float DEFAULT 0, -- 0-100
  dimension_scores jsonb DEFAULT '{}', -- {identity, behavioral, psychological, financial, network, temporal, biometric}
  gap_categories text[] DEFAULT '{}', -- categories with < 50% coverage
  last_computed_at timestamptz DEFAULT now(),
  UNIQUE (user_id, profile_id)
);

ALTER TABLE intelligence_convergence_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own convergence scores"
  ON intelligence_convergence_scores FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- 9. Behavioral State Machine per Contact
-- ============================================================

CREATE TABLE IF NOT EXISTS contact_behavioral_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  -- Psychological dimensions (0-100)
  trust_score float DEFAULT 50,
  stress_level float DEFAULT 30,
  deception_risk float DEFAULT 10,
  openness_index float DEFAULT 60,
  agreeableness float DEFAULT 60,
  -- Dark Triad scores (0-100)
  machiavellianism float DEFAULT 20,
  narcissism float DEFAULT 25,
  psychopathy float DEFAULT 15,
  -- Temporal metadata
  baseline_computed_at timestamptz,
  last_updated_at timestamptz DEFAULT now(),
  -- Drift tracking
  drift_from_baseline jsonb DEFAULT '{}',
  anomaly_score float DEFAULT 0,
  vulnerability_window_active boolean DEFAULT false,
  vulnerability_window_expires_at timestamptz,
  UNIQUE (user_id, profile_id)
);

CREATE INDEX IF NOT EXISTS behavioral_states_profile_idx
  ON contact_behavioral_states (user_id, profile_id);
CREATE INDEX IF NOT EXISTS behavioral_states_anomaly_idx
  ON contact_behavioral_states (user_id, anomaly_score DESC);

ALTER TABLE contact_behavioral_states ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own behavioral states"
  ON contact_behavioral_states FOR ALL
  USING (auth.uid() = user_id);

-- Initialize behavioral states for existing contacts
INSERT INTO contact_behavioral_states (user_id, profile_id)
SELECT DISTINCT user_id, id FROM profiles
ON CONFLICT (user_id, profile_id) DO NOTHING;

-- ============================================================
-- 10. Behavioral State History (time series)
-- ============================================================

CREATE TABLE IF NOT EXISTS contact_behavioral_state_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  state_snapshot jsonb NOT NULL, -- full snapshot of contact_behavioral_states
  trigger_event text, -- what caused this state change
  trigger_source_id uuid, -- source record that triggered the update
  recorded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS behavioral_history_profile_time_idx
  ON contact_behavioral_state_history (user_id, profile_id, recorded_at DESC);
