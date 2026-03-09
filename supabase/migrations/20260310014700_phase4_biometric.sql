-- ============================================================
-- Phase 4: Biometric Excellence
-- Date: 2026-03-10
-- ============================================================
-- Server-side biometric gallery, multi-modal fusion, federated
-- learning, liveness detection, and privacy controls.
-- ============================================================

-- ============================================================
-- 1. Biometric Embeddings (face, voice, gait)
-- ============================================================

CREATE TABLE IF NOT EXISTS biometric_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  -- Modality
  modality text NOT NULL,             -- 'face' | 'voice' | 'gait' | 'typing'
  -- Embedding
  embedding vector(512),              -- ArcFace (face) or d-vector (voice) embedding
  embedding_model text,               -- 'arcface_r100' | 'ecapa_tdnn' | 'gait_resnet'
  -- Quality
  quality_score float NOT NULL DEFAULT 0.5,   -- 0-1 enrollment sample quality
  confidence float NOT NULL DEFAULT 0.5,      -- 0-1 template confidence
  -- Enrollment
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  update_count integer DEFAULT 1,
  -- Source metadata
  source_type text DEFAULT 'manual',   -- 'manual' | 'ambient' | 'import' | 'federated'
  source_metadata jsonb DEFAULT '{}',  -- device info, capture conditions, etc.
  -- Anti-spoofing
  liveness_verified boolean DEFAULT false,
  liveness_score float,
  -- Status
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS biometric_embeddings_profile_idx
  ON biometric_embeddings (user_id, profile_id, modality)
  WHERE is_active = true;

-- HNSW index for fast similarity search
DROP INDEX IF EXISTS biometric_embeddings_hnsw_idx;
CREATE INDEX biometric_embeddings_hnsw_idx
  ON biometric_embeddings
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

ALTER TABLE biometric_embeddings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own biometric embeddings"
  ON biometric_embeddings FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- 2. Biometric Identification Log
-- ============================================================

CREATE TABLE IF NOT EXISTS biometric_identifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  -- Input
  query_modality text NOT NULL,       -- which modality was queried
  query_embedding vector(512),        -- the probe embedding
  -- Results
  top_matches jsonb NOT NULL DEFAULT '[]',  -- [{profile_id, distance, confidence, modality}]
  best_match_profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  best_match_confidence float,
  -- Multi-modal fusion
  fusion_result jsonb,                -- {face: {score, weight}, voice: {score, weight}, behavioral: {score, weight}, composite: score}
  fusion_confidence float,
  fusion_method text DEFAULT 'weighted_score',  -- 'weighted_score' | 'bayesian' | 'dempster_shafer'
  -- Context
  source text DEFAULT 'manual',       -- 'manual' | 'ambient' | 'api'
  device_info jsonb DEFAULT '{}',
  -- Liveness
  liveness_passed boolean,
  liveness_method text,               -- 'blink_challenge' | 'depth_estimation' | 'none'
  -- Timestamps
  identified_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS biometric_identifications_user_idx
  ON biometric_identifications (user_id, identified_at DESC);

ALTER TABLE biometric_identifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own biometric identifications"
  ON biometric_identifications FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- 3. Federated Learning State
-- ============================================================

CREATE TABLE IF NOT EXISTS federated_learning_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Model info
  model_name text NOT NULL,           -- 'face_encoder' | 'voice_encoder'
  model_version integer NOT NULL DEFAULT 1,
  -- Global model
  global_model_url text,              -- Supabase Storage URL to the global model weights
  global_model_hash text,             -- SHA256 of the model file
  -- Aggregation
  gradient_contributions integer DEFAULT 0,  -- how many clients contributed
  last_aggregation_at timestamptz,
  aggregation_method text DEFAULT 'fedavg',  -- 'fedavg' | 'fedprox' | 'scaffold'
  -- Privacy
  privacy_budget_epsilon float DEFAULT 8.0,
  privacy_budget_spent float DEFAULT 0.0,
  noise_multiplier float DEFAULT 1.0,
  -- Quality
  validation_accuracy float,
  validation_loss float,
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE federated_learning_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own federated learning state"
  ON federated_learning_state FOR ALL
  USING (auth.uid() = user_id OR user_id IS NULL);

-- ============================================================
-- 4. Gradient Contributions (for FedAvg)
-- ============================================================

CREATE TABLE IF NOT EXISTS gradient_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  federated_state_id uuid REFERENCES federated_learning_state(id) ON DELETE CASCADE,
  -- Gradient data
  gradient_url text,                  -- Supabase Storage URL to encrypted gradient
  gradient_hash text,
  gradient_size_bytes integer,
  -- Privacy
  noise_added boolean DEFAULT true,
  epsilon_spent float DEFAULT 0,
  -- Device info
  device_type text,                   -- 'browser' | 'desktop' | 'mobile'
  local_samples_count integer,        -- how many training samples on device
  local_epochs integer DEFAULT 1,
  local_loss float,
  -- Status
  status text DEFAULT 'pending',      -- 'pending' | 'aggregated' | 'rejected'
  rejection_reason text,
  -- Timestamps
  submitted_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE gradient_contributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own gradient contributions"
  ON gradient_contributions FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- 5. Biometric Privacy Controls
-- ============================================================

CREATE TABLE IF NOT EXISTS biometric_privacy_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  -- Consent
  face_enrollment_consent boolean DEFAULT false,
  voice_enrollment_consent boolean DEFAULT false,
  ambient_detection_consent boolean DEFAULT false,
  federated_learning_consent boolean DEFAULT false,
  -- Storage preferences
  store_embeddings_server boolean DEFAULT true,
  store_raw_biometrics boolean DEFAULT false,  -- never store raw by default
  embedding_retention_days integer DEFAULT 365,
  -- Ambient mode
  ambient_detection_enabled boolean DEFAULT false,
  ambient_alert_threshold float DEFAULT 0.85,  -- minimum confidence to alert
  ambient_environments text[] DEFAULT '{}',    -- 'home' | 'office' | 'public'
  -- Privacy budget
  max_privacy_epsilon float DEFAULT 8.0,
  current_privacy_spent float DEFAULT 0.0,
  -- Audit
  last_audit_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE biometric_privacy_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own biometric privacy settings"
  ON biometric_privacy_settings FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- 6. Match Documents RPC: Biometric similarity search
-- ============================================================

CREATE OR REPLACE FUNCTION match_biometric(
  query_embedding vector(512),
  query_modality text,
  match_user_id uuid,
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  profile_id uuid,
  modality text,
  similarity float,
  confidence float,
  quality_score float,
  enrolled_at timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    be.id,
    be.profile_id,
    be.modality,
    (1 - (be.embedding <=> query_embedding))::float AS similarity,
    be.confidence,
    be.quality_score,
    be.enrolled_at
  FROM biometric_embeddings be
  WHERE be.user_id = match_user_id
    AND be.is_active = true
    AND (query_modality = 'all' OR be.modality = query_modality)
    AND (1 - (be.embedding <=> query_embedding)) >= match_threshold
  ORDER BY be.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
