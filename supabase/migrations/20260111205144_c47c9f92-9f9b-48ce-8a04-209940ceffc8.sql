-- Fix function search paths for security
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
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;

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
  FOR v_event IN 
    SELECT * FROM public.analysis_events 
    WHERE user_id = p_user_id 
      AND profile_id = p_profile_id
      AND analysis_type = p_aggregate_type
      AND is_deleted = false
    ORDER BY sequence_number ASC
  LOOP
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
  
  INSERT INTO public.analysis_aggregates (
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
    version = public.analysis_aggregates.version + 1,
    last_event_sequence = v_last_sequence,
    last_event_id = v_last_event_id,
    total_events = v_event_count,
    active_events = v_active_count,
    first_analysis_at = COALESCE(v_first_at, public.analysis_aggregates.first_analysis_at),
    last_analysis_at = v_last_at,
    average_confidence = CASE WHEN v_active_count > 0 THEN v_confidence_sum / v_active_count ELSE NULL END,
    rebuild_count = public.analysis_aggregates.rebuild_count + 1,
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
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION get_previous_event_for_chain(p_user_id UUID, p_profile_id UUID)
RETURNS TABLE(event_id UUID, event_hash TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT ae.id, ae.event_hash
  FROM public.analysis_events ae
  WHERE ae.user_id = p_user_id
    AND (ae.profile_id = p_profile_id OR (ae.profile_id IS NULL AND p_profile_id IS NULL))
  ORDER BY ae.sequence_number DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION trigger_compute_event_hash()
RETURNS TRIGGER AS $$
DECLARE
  v_prev_id UUID;
  v_prev_hash TEXT;
BEGIN
  SELECT event_id, event_hash INTO v_prev_id, v_prev_hash
  FROM public.get_previous_event_for_chain(NEW.user_id, NEW.profile_id);
  
  NEW.previous_event_id := v_prev_id;
  NEW.previous_hash := v_prev_hash;
  NEW.event_hash := public.compute_event_hash(
    NEW.id,
    v_prev_hash,
    NEW.event_type,
    NEW.analysis_type,
    NEW.raw_result,
    NEW.created_at
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION trigger_mark_aggregate_rebuild()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.analysis_aggregates
  SET needs_rebuild = true, updated_at = now()
  WHERE user_id = NEW.user_id
    AND profile_id = NEW.profile_id
    AND aggregate_type = NEW.analysis_type;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;