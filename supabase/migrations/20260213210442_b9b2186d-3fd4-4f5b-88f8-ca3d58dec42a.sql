
-- Phase 4.2: Performance Indexes + Phase 5.1-5.2: Migration & Views

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_unified_analysis_user_domain ON unified_analysis_store(user_id, analysis_domain);
CREATE INDEX IF NOT EXISTS idx_unified_analysis_profile_type ON unified_analysis_store(profile_id, analysis_type);
CREATE INDEX IF NOT EXISTS idx_unified_analysis_created ON unified_analysis_store(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_unified_prediction_user_domain ON unified_prediction_store(user_id, prediction_domain);
CREATE INDEX IF NOT EXISTS idx_unified_prediction_expires ON unified_prediction_store(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_unified_event_user_type ON unified_event_log(user_id, event_type);
CREATE INDEX IF NOT EXISTS idx_unified_event_created ON unified_event_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_unified_analysis_risk ON unified_analysis_store(risk_level) WHERE risk_level IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_unified_prediction_probability ON unified_prediction_store(probability DESC) WHERE probability IS NOT NULL;

-- Phase 5.1: Migration function
CREATE OR REPLACE FUNCTION public.migrate_legacy_analysis(
  p_source_table TEXT, p_domain TEXT, p_analysis_type TEXT, p_batch_size INT DEFAULT 500
) RETURNS INT
LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  v_migrated INT := 0;
  v_row RECORD;
BEGIN
  FOR v_row IN EXECUTE format(
    'SELECT id, user_id, profile_id, created_at, updated_at FROM %I LIMIT $1', p_source_table
  ) USING p_batch_size
  LOOP
    INSERT INTO unified_analysis_store (
      user_id, profile_id, analysis_domain, analysis_type, result, created_at, updated_at
    ) VALUES (
      v_row.user_id, v_row.profile_id, p_domain, p_analysis_type, '{}'::jsonb,
      COALESCE(v_row.created_at, now()), COALESCE(v_row.updated_at, now())
    ) ON CONFLICT DO NOTHING;
    v_migrated := v_migrated + 1;
  END LOOP;
  RETURN v_migrated;
END;
$$;

-- Master migration orchestrator
CREATE OR REPLACE FUNCTION public.run_analysis_migration()
RETURNS TABLE(source_table TEXT, domain TEXT, analysis_type TEXT, rows_migrated INT)
LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v_mapping RECORD; v_count INT;
BEGIN
  FOR v_mapping IN
    SELECT * FROM (VALUES
      ('mice_assessments','intelligence','mice_assessment'),
      ('dark_tetrad_profiles','intelligence','dark_tetrad'),
      ('behavioral_predictions','prediction','behavioral_prediction'),
      ('cognitive_warfare_campaigns','warfare','cognitive_warfare'),
      ('influence_campaigns','warfare','influence_campaign'),
      ('biometric_templates','biometric','biometric_template'),
      ('face_embeddings','biometric','face_embedding'),
      ('voice_signatures','biometric','voice_signature'),
      ('fusion_results','fusion','fusion_result')
    ) AS t(src, dom, atype)
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=v_mapping.src) THEN
      v_count := migrate_legacy_analysis(v_mapping.src, v_mapping.dom, v_mapping.atype);
      source_table := v_mapping.src; domain := v_mapping.dom;
      analysis_type := v_mapping.atype; rows_migrated := v_count;
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$;

-- Phase 5.2: Compatibility Views
CREATE OR REPLACE VIEW public.v_mice_assessments AS
SELECT id, user_id, profile_id,
  result->>'recruitment_potential' AS recruitment_potential,
  result->>'motivation_score' AS motivation_score,
  confidence_score, risk_level, created_at, updated_at
FROM unified_analysis_store WHERE analysis_type = 'mice_assessment';

CREATE OR REPLACE VIEW public.v_behavioral_predictions AS
SELECT id, user_id, profile_id,
  prediction->>'prediction_type' AS prediction_type,
  prediction->>'predicted_behavior' AS predicted_behavior,
  probability, created_at, updated_at
FROM unified_prediction_store WHERE prediction_domain = 'behavioral';

CREATE OR REPLACE VIEW public.v_network_analyses AS
SELECT id, user_id, profile_id,
  result->>'centrality_score' AS centrality_score,
  result->>'influence_rank' AS influence_rank,
  confidence_score, risk_level, created_at, updated_at
FROM unified_analysis_store WHERE analysis_domain = 'network';

CREATE OR REPLACE VIEW public.v_biometric_templates AS
SELECT id, user_id, profile_id, analysis_type AS biometric_type,
  result->>'template_quality' AS template_quality,
  confidence_score, created_at, updated_at
FROM unified_analysis_store WHERE analysis_domain = 'biometric';

CREATE OR REPLACE VIEW public.v_audit_trail AS
SELECT id, user_id, event_type, source_function, source_component,
  event_data->>'action' AS action,
  event_data->>'target_id' AS target_id,
  severity, created_at
FROM unified_event_log WHERE event_type IN ('audit', 'user_action', 'system_action');
