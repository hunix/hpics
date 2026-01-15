-- AGIS Phase 3: Absolute Dominion - Database Schema
-- Cognitive Warfare & Advanced Intelligence Tables

-- MICE Vulnerability Assessments (CIA-style recruitment analysis)
CREATE TABLE public.mice_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  money_vulnerability NUMERIC CHECK (money_vulnerability >= 0 AND money_vulnerability <= 1),
  money_indicators JSONB DEFAULT '[]',
  ideology_alignment JSONB DEFAULT '{}',
  ideology_conflicts TEXT[],
  compromise_material JSONB DEFAULT '[]',
  compromise_leverage_score NUMERIC CHECK (compromise_leverage_score >= 0 AND compromise_leverage_score <= 1),
  ego_needs TEXT[],
  ego_vulnerabilities JSONB DEFAULT '[]',
  recruitment_likelihood NUMERIC CHECK (recruitment_likelihood >= 0 AND recruitment_likelihood <= 1),
  optimal_approach TEXT,
  approach_scripts JSONB DEFAULT '[]',
  risk_assessment JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Sacred Values Mapping (Non-negotiable beliefs for tribal activation)
CREATE TABLE public.sacred_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  value_domain TEXT NOT NULL,
  value_name TEXT NOT NULL,
  protection_level NUMERIC CHECK (protection_level >= 0 AND protection_level <= 1),
  emotional_intensity NUMERIC CHECK (emotional_intensity >= 0 AND emotional_intensity <= 1),
  tribal_associations TEXT[],
  identity_centrality NUMERIC CHECK (identity_centrality >= 0 AND identity_centrality <= 1),
  violation_triggers TEXT[],
  exploitation_vectors JSONB DEFAULT '[]',
  defensive_reactions JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Betrayal Predictions (Trust network modeling with defection risk)
CREATE TABLE public.betrayal_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  trust_score NUMERIC CHECK (trust_score >= 0 AND trust_score <= 1),
  loyalty_indicators JSONB DEFAULT '[]',
  defection_probability NUMERIC CHECK (defection_probability >= 0 AND defection_probability <= 1),
  warning_signs TEXT[],
  gottman_horsemen JSONB DEFAULT '{}',
  predicted_triggers TEXT[],
  defection_timeline TEXT,
  relationship_stress_score NUMERIC CHECK (relationship_stress_score >= 0 AND relationship_stress_score <= 1),
  protective_factors JSONB DEFAULT '[]',
  risk_mitigation JSONB DEFAULT '[]',
  validated_at TIMESTAMPTZ,
  validation_outcome TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Memetic Campaigns (Viral idea engineering with SIR modeling)
CREATE TABLE public.memetic_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_name TEXT NOT NULL,
  target_profiles UUID[],
  target_networks TEXT[],
  meme_content JSONB NOT NULL,
  core_narrative TEXT,
  emotional_hooks TEXT[],
  propagation_model TEXT DEFAULT 'SIR',
  infection_rate NUMERIC DEFAULT 0,
  recovery_rate NUMERIC DEFAULT 0,
  current_reach INTEGER DEFAULT 0,
  peak_reach INTEGER DEFAULT 0,
  susceptible_population INTEGER DEFAULT 0,
  infected_count INTEGER DEFAULT 0,
  recovered_count INTEGER DEFAULT 0,
  virality_coefficient NUMERIC DEFAULT 0,
  amplification_nodes UUID[],
  counter_narratives JSONB DEFAULT '[]',
  status TEXT DEFAULT 'draft',
  launched_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Semantic Warfare Operations (Term warfare and definition control)
CREATE TABLE public.semantic_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  operation_name TEXT NOT NULL,
  target_term TEXT NOT NULL,
  current_definition TEXT,
  target_definition TEXT,
  framing_strategy TEXT,
  overton_position NUMERIC CHECK (overton_position >= -1 AND overton_position <= 1),
  shift_progress NUMERIC DEFAULT 0,
  linguistic_techniques JSONB DEFAULT '[]',
  anchor_phrases TEXT[],
  repetition_schedule JSONB DEFAULT '{}',
  deployment_contexts TEXT[],
  effectiveness_metrics JSONB DEFAULT '{}',
  resistance_encountered JSONB DEFAULT '[]',
  status TEXT DEFAULT 'planning',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Elicitation Sessions (FBI conversational extraction tracking)
CREATE TABLE public.elicitation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL,
  techniques_used TEXT[],
  target_information TEXT[],
  extracted_intelligence JSONB DEFAULT '[]',
  rapport_level NUMERIC CHECK (rapport_level >= 0 AND rapport_level <= 1),
  suspicion_level NUMERIC CHECK (suspicion_level >= 0 AND suspicion_level <= 1),
  success_metrics JSONB DEFAULT '{}',
  follow_up_questions TEXT[],
  conversation_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Synthetic Consensus Campaigns
CREATE TABLE public.synthetic_consensus_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_name TEXT NOT NULL,
  target_belief TEXT NOT NULL,
  consensus_narrative TEXT,
  social_proof_elements JSONB DEFAULT '[]',
  authority_endorsements JSONB DEFAULT '[]',
  manufactured_agreement_sources JSONB DEFAULT '[]',
  astroturf_networks TEXT[],
  perceived_consensus_level NUMERIC DEFAULT 0,
  actual_consensus_level NUMERIC DEFAULT 0,
  spiral_of_silence_effect NUMERIC DEFAULT 0,
  target_audience_segments JSONB DEFAULT '[]',
  effectiveness_score NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mice_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sacred_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.betrayal_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memetic_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semantic_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elicitation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.synthetic_consensus_campaigns ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mice_assessments
CREATE POLICY "Users can view own MICE assessments"
ON public.mice_assessments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own MICE assessments"
ON public.mice_assessments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own MICE assessments"
ON public.mice_assessments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own MICE assessments"
ON public.mice_assessments FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for sacred_values
CREATE POLICY "Users can view own sacred values"
ON public.sacred_values FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sacred values"
ON public.sacred_values FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sacred values"
ON public.sacred_values FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sacred values"
ON public.sacred_values FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for betrayal_predictions
CREATE POLICY "Users can view own betrayal predictions"
ON public.betrayal_predictions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own betrayal predictions"
ON public.betrayal_predictions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own betrayal predictions"
ON public.betrayal_predictions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own betrayal predictions"
ON public.betrayal_predictions FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for memetic_campaigns
CREATE POLICY "Users can view own memetic campaigns"
ON public.memetic_campaigns FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own memetic campaigns"
ON public.memetic_campaigns FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own memetic campaigns"
ON public.memetic_campaigns FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own memetic campaigns"
ON public.memetic_campaigns FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for semantic_operations
CREATE POLICY "Users can view own semantic operations"
ON public.semantic_operations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own semantic operations"
ON public.semantic_operations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own semantic operations"
ON public.semantic_operations FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own semantic operations"
ON public.semantic_operations FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for elicitation_sessions
CREATE POLICY "Users can view own elicitation sessions"
ON public.elicitation_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own elicitation sessions"
ON public.elicitation_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own elicitation sessions"
ON public.elicitation_sessions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own elicitation sessions"
ON public.elicitation_sessions FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for synthetic_consensus_campaigns
CREATE POLICY "Users can view own synthetic consensus campaigns"
ON public.synthetic_consensus_campaigns FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own synthetic consensus campaigns"
ON public.synthetic_consensus_campaigns FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own synthetic consensus campaigns"
ON public.synthetic_consensus_campaigns FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own synthetic consensus campaigns"
ON public.synthetic_consensus_campaigns FOR DELETE
USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_mice_assessments_user ON public.mice_assessments(user_id);
CREATE INDEX idx_mice_assessments_profile ON public.mice_assessments(profile_id);
CREATE INDEX idx_sacred_values_user ON public.sacred_values(user_id);
CREATE INDEX idx_sacred_values_profile ON public.sacred_values(profile_id);
CREATE INDEX idx_betrayal_predictions_user ON public.betrayal_predictions(user_id);
CREATE INDEX idx_betrayal_predictions_profile ON public.betrayal_predictions(profile_id);
CREATE INDEX idx_memetic_campaigns_user ON public.memetic_campaigns(user_id);
CREATE INDEX idx_memetic_campaigns_status ON public.memetic_campaigns(status);
CREATE INDEX idx_semantic_operations_user ON public.semantic_operations(user_id);
CREATE INDEX idx_semantic_operations_status ON public.semantic_operations(status);
CREATE INDEX idx_elicitation_sessions_user ON public.elicitation_sessions(user_id);
CREATE INDEX idx_elicitation_sessions_profile ON public.elicitation_sessions(profile_id);
CREATE INDEX idx_synthetic_consensus_user ON public.synthetic_consensus_campaigns(user_id);

-- Updated_at triggers
CREATE TRIGGER update_mice_assessments_updated_at
  BEFORE UPDATE ON public.mice_assessments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sacred_values_updated_at
  BEFORE UPDATE ON public.sacred_values
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_betrayal_predictions_updated_at
  BEFORE UPDATE ON public.betrayal_predictions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_memetic_campaigns_updated_at
  BEFORE UPDATE ON public.memetic_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_semantic_operations_updated_at
  BEFORE UPDATE ON public.semantic_operations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_elicitation_sessions_updated_at
  BEFORE UPDATE ON public.elicitation_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_synthetic_consensus_updated_at
  BEFORE UPDATE ON public.synthetic_consensus_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();