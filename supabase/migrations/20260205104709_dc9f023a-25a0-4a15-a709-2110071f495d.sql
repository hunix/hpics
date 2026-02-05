-- Fix security warnings: Set search_path on functions

-- Fix function 1: update_unified_analysis_timestamp
CREATE OR REPLACE FUNCTION update_unified_analysis_timestamp()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fix function 2: get_legacy_analysis_mapping
CREATE OR REPLACE FUNCTION get_legacy_analysis_mapping(legacy_table TEXT)
RETURNS TABLE(domain TEXT, analysis_type TEXT) 
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
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
$$;

-- Fix RLS: Make event log insert policy more restrictive
DROP POLICY IF EXISTS "Users can insert events" ON unified_event_log;

CREATE POLICY "Users can insert their own events"
  ON unified_event_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);