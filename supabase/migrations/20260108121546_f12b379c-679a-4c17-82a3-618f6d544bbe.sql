-- =====================================================
-- PHASE 2: PREDICTIVE BEHAVIORAL MODELING + KNOWLEDGE GRAPH
-- =====================================================

-- Table: behavioral_predictions
-- Stores ML-based predictions for optimal outreach, communication style, and relationship milestones
CREATE TABLE IF NOT EXISTS public.behavioral_predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  prediction_type TEXT NOT NULL, -- 'optimal_outreach_time', 'communication_style', 'relationship_milestone', 'engagement_probability'
  prediction_value JSONB NOT NULL, -- Structured prediction data
  confidence_score NUMERIC(4,3) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  features_used JSONB, -- Feature vector used for prediction
  model_version TEXT,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until TIMESTAMPTZ, -- When prediction expires
  actual_outcome JSONB, -- For accuracy tracking
  outcome_recorded_at TIMESTAMPTZ,
  accuracy_score NUMERIC(4,3), -- Calculated after outcome
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for behavioral_predictions
CREATE INDEX idx_behavioral_predictions_user_profile ON public.behavioral_predictions(user_id, profile_id);
CREATE INDEX idx_behavioral_predictions_type ON public.behavioral_predictions(prediction_type);
CREATE INDEX idx_behavioral_predictions_valid ON public.behavioral_predictions(valid_until) WHERE valid_until IS NOT NULL;

-- RLS for behavioral_predictions
ALTER TABLE public.behavioral_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own predictions"
  ON public.behavioral_predictions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own predictions"
  ON public.behavioral_predictions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own predictions"
  ON public.behavioral_predictions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own predictions"
  ON public.behavioral_predictions FOR DELETE
  USING (auth.uid() = user_id);

-- Table: relationship_inferences
-- Stores inferred relationships from knowledge graph analysis
CREATE TABLE IF NOT EXISTS public.relationship_inferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  source_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  inference_type TEXT NOT NULL, -- 'transitive_connection', 'shared_organization', 'event_coattendance', 'communication_pattern'
  path_profiles UUID[], -- Intermediate profiles in the connection path
  path_distance INTEGER, -- Number of hops
  relationship_strength NUMERIC(4,3) CHECK (relationship_strength >= 0 AND relationship_strength <= 1),
  confidence_score NUMERIC(4,3) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  evidence JSONB, -- Supporting evidence for inference
  opportunity_score NUMERIC(4,3), -- Networking opportunity value
  opportunity_type TEXT, -- 'introduction', 'collaboration', 'strategic_alliance'
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_inference UNIQUE (user_id, source_profile_id, target_profile_id, inference_type)
);

-- Indexes for relationship_inferences
CREATE INDEX idx_relationship_inferences_user ON public.relationship_inferences(user_id);
CREATE INDEX idx_relationship_inferences_source ON public.relationship_inferences(source_profile_id);
CREATE INDEX idx_relationship_inferences_target ON public.relationship_inferences(target_profile_id);
CREATE INDEX idx_relationship_inferences_opportunity ON public.relationship_inferences(opportunity_score DESC) WHERE opportunity_score IS NOT NULL;

-- RLS for relationship_inferences
ALTER TABLE public.relationship_inferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own inferences"
  ON public.relationship_inferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own inferences"
  ON public.relationship_inferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own inferences"
  ON public.relationship_inferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own inferences"
  ON public.relationship_inferences FOR DELETE
  USING (auth.uid() = user_id);

-- Function: Find shortest path between two profiles
CREATE OR REPLACE FUNCTION public.find_connection_path(
  p_user_id UUID,
  p_source_id UUID,
  p_target_id UUID,
  p_max_depth INTEGER DEFAULT 3
)
RETURNS TABLE (
  path UUID[],
  distance INTEGER,
  strength NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE connection_paths AS (
    -- Base case: direct connections from source
    SELECT 
      ARRAY[p_source_id, el.target_profile_id] AS path,
      1 AS depth,
      COALESCE(el.confidence_score, 0.5)::NUMERIC AS cumulative_strength
    FROM entity_links el
    WHERE el.user_id = p_user_id
      AND el.source_profile_id = p_source_id
      AND el.status = 'confirmed'
    
    UNION ALL
    
    -- Recursive case: extend paths
    SELECT 
      cp.path || el.target_profile_id,
      cp.depth + 1,
      cp.cumulative_strength * COALESCE(el.confidence_score, 0.5)::NUMERIC
    FROM connection_paths cp
    JOIN entity_links el ON el.source_profile_id = cp.path[array_length(cp.path, 1)]
    WHERE el.user_id = p_user_id
      AND el.status = 'confirmed'
      AND NOT el.target_profile_id = ANY(cp.path) -- Avoid cycles
      AND cp.depth < p_max_depth
  )
  SELECT 
    cp.path,
    cp.depth AS distance,
    cp.cumulative_strength AS strength
  FROM connection_paths cp
  WHERE cp.path[array_length(cp.path, 1)] = p_target_id
  ORDER BY cp.depth, cp.cumulative_strength DESC
  LIMIT 5;
END;
$$;

-- Function: Get shared organizations between profiles
CREATE OR REPLACE FUNCTION public.get_shared_organizations(
  p_user_id UUID,
  p_profile_ids UUID[]
)
RETURNS TABLE (
  organization_name TEXT,
  profile_ids UUID[],
  profile_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(p.company, we.company) AS org_name,
    array_agg(DISTINCT p.id) AS matching_profiles,
    count(DISTINCT p.id)::INTEGER AS match_count
  FROM profiles p
  LEFT JOIN work_experiences we ON we.profile_id = p.id AND we.user_id = p_user_id
  WHERE p.user_id = p_user_id
    AND p.id = ANY(p_profile_ids)
    AND (p.company IS NOT NULL OR we.company IS NOT NULL)
  GROUP BY COALESCE(p.company, we.company)
  HAVING count(DISTINCT p.id) > 1
  ORDER BY match_count DESC;
END;
$$;

-- Trigger for updated_at
CREATE TRIGGER update_behavioral_predictions_updated_at
  BEFORE UPDATE ON public.behavioral_predictions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_relationship_inferences_updated_at
  BEFORE UPDATE ON public.relationship_inferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();