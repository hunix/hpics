-- =====================================================
-- ULTIMATE INTELLIGENCE SUPERIORITY SCHEMA (Tables that don't exist yet)
-- =====================================================

-- ===================
-- PHASE 2: Personality DNA Profiles (Big Five/OCEAN)
-- ===================
CREATE TABLE IF NOT EXISTS public.personality_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Big Five OCEAN Scores (0-100 scale)
  openness JSONB DEFAULT '{"score": null, "confidence": 0, "evidence": []}'::jsonb,
  conscientiousness JSONB DEFAULT '{"score": null, "confidence": 0, "evidence": []}'::jsonb,
  extraversion JSONB DEFAULT '{"score": null, "confidence": 0, "evidence": []}'::jsonb,
  agreeableness JSONB DEFAULT '{"score": null, "confidence": 0, "evidence": []}'::jsonb,
  neuroticism JSONB DEFAULT '{"score": null, "confidence": 0, "evidence": []}'::jsonb,
  
  -- 30 Subfacets (6 per dimension)
  facet_scores JSONB DEFAULT '{}'::jsonb,
  
  -- Stability and reliability
  stability_coefficient NUMERIC(4,3) DEFAULT 0,
  sample_size INTEGER DEFAULT 0,
  extraction_sources TEXT[] DEFAULT '{}',
  
  -- Exploitation angles derived from personality
  exploitation_angles JSONB DEFAULT '[]'::jsonb,
  influence_vulnerabilities JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  last_analyzed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_personality_profile UNIQUE (profile_id, user_id)
);

-- ===================
-- PHASE 3: Financial Intelligence
-- ===================
CREATE TABLE IF NOT EXISTS public.financial_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Wealth Tier (1-5)
  wealth_tier INTEGER CHECK (wealth_tier BETWEEN 1 AND 5),
  wealth_tier_confidence NUMERIC(4,3) DEFAULT 0,
  
  -- Net Worth Estimation
  estimated_net_worth_min NUMERIC,
  estimated_net_worth_max NUMERIC,
  net_worth_currency TEXT DEFAULT 'USD',
  
  -- Income Analysis
  income_trajectory JSONB DEFAULT '{"trend": null, "projected_5yr": null}'::jsonb,
  career_earnings_potential JSONB DEFAULT '{}'::jsonb,
  
  -- Asset Indicators
  asset_indicators JSONB DEFAULT '{"property": [], "vehicles": [], "luxury": [], "investments": []}'::jsonb,
  lifestyle_tier TEXT,
  
  -- Financial Vulnerability
  financial_stress_score INTEGER CHECK (financial_stress_score BETWEEN 0 AND 100),
  debt_indicators JSONB DEFAULT '[]'::jsonb,
  vulnerability_windows JSONB DEFAULT '[]'::jsonb,
  
  -- Opportunity Windows
  opportunity_windows JSONB DEFAULT '[]'::jsonb,
  optimal_ask_timing JSONB DEFAULT '{}'::jsonb,
  
  -- Evidence and confidence
  evidence_sources JSONB DEFAULT '[]'::jsonb,
  overall_confidence NUMERIC(4,3) DEFAULT 0,
  
  -- Metadata
  last_analyzed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_financial_intelligence UNIQUE (profile_id, user_id)
);

-- ===================
-- PHASE 5: Influence Campaigns
-- ===================
CREATE TABLE IF NOT EXISTS public.influence_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Campaign Identity
  name TEXT NOT NULL,
  description TEXT,
  objective TEXT NOT NULL,
  
  -- Cialdini Principles Applied
  principles_applied TEXT[] DEFAULT '{}',
  primary_principle TEXT,
  
  -- Campaign Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'planned', 'active', 'paused', 'completed', 'failed', 'abandoned')),
  priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  
  -- Touch Planning
  planned_touches JSONB DEFAULT '[]'::jsonb,
  executed_touches JSONB DEFAULT '[]'::jsonb,
  next_touch_at TIMESTAMPTZ,
  
  -- Timing Optimization
  optimal_windows JSONB DEFAULT '[]'::jsonb,
  urgency_level TEXT DEFAULT 'normal' CHECK (urgency_level IN ('low', 'normal', 'high', 'critical')),
  
  -- Resistance and Adaptation
  resistance_patterns JSONB DEFAULT '[]'::jsonb,
  adaptation_history JSONB DEFAULT '[]'::jsonb,
  
  -- Outcomes
  compliance_achieved BOOLEAN,
  outcome_value JSONB DEFAULT '{}'::jsonb,
  lessons_learned TEXT[] DEFAULT '{}',
  
  -- A/B Testing
  variant_id TEXT,
  control_group BOOLEAN DEFAULT false,
  
  -- Metadata
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===================
-- PHASE 6: Behavioral Predictions
-- ===================
CREATE TABLE IF NOT EXISTS public.behavioral_scenario_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Scenario Definition
  scenario_type TEXT NOT NULL,
  scenario_category TEXT,
  stimulus TEXT NOT NULL,
  context JSONB DEFAULT '{}'::jsonb,
  
  -- Prediction
  predicted_response JSONB NOT NULL,
  response_probability NUMERIC(4,3),
  alternative_responses JSONB DEFAULT '[]'::jsonb,
  
  -- Confidence and Evidence
  confidence_score NUMERIC(4,3) NOT NULL,
  evidence_basis JSONB DEFAULT '[]'::jsonb,
  model_version TEXT,
  
  -- Validation (for calibration)
  actual_response JSONB,
  prediction_accuracy NUMERIC(4,3),
  validated_at TIMESTAMPTZ,
  
  -- Metadata
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===================
-- PHASE 7: Deep Correlations
-- ===================
CREATE TABLE IF NOT EXISTS public.deep_correlations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Correlation Definition
  correlation_type TEXT NOT NULL CHECK (correlation_type IN (
    'behavioral_sync', 'information_flow', 'hidden_connection', 
    'coalition', 'shared_secret', 'temporal_pattern', 'financial_link'
  )),
  
  -- Involved Parties
  involved_profiles UUID[] NOT NULL,
  primary_profile_id UUID REFERENCES public.profiles(id),
  
  -- Correlation Strength and Evidence
  strength NUMERIC(4,3) NOT NULL CHECK (strength BETWEEN 0 AND 1),
  evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
  evidence_count INTEGER DEFAULT 0,
  
  -- Analysis Results
  implications TEXT[] DEFAULT '{}',
  actionable_insights TEXT[] DEFAULT '{}',
  risk_assessment JSONB DEFAULT '{}'::jsonb,
  
  -- Confidence
  confidence NUMERIC(4,3) NOT NULL,
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  
  -- Metadata
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_validated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);

-- ===================
-- PHASE 1: Deception Detection Results
-- ===================
CREATE TABLE IF NOT EXISTS public.deception_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Source Reference
  source_type TEXT NOT NULL CHECK (source_type IN ('recording', 'message', 'media', 'call', 'meeting')),
  source_id UUID,
  
  -- Overall Deception Score
  deception_score NUMERIC(4,3) CHECK (deception_score BETWEEN 0 AND 1),
  deception_likelihood TEXT CHECK (deception_likelihood IN ('very_low', 'low', 'moderate', 'high', 'very_high')),
  
  -- Multimodal Analysis
  facial_indicators JSONB DEFAULT '{}'::jsonb,
  vocal_indicators JSONB DEFAULT '{}'::jsonb,
  linguistic_indicators JSONB DEFAULT '{}'::jsonb,
  behavioral_indicators JSONB DEFAULT '{}'::jsonb,
  
  -- Cross-Modal Contradictions
  cross_modal_conflicts JSONB DEFAULT '[]'::jsonb,
  conflict_severity NUMERIC(4,3),
  
  -- Micro-Expression Analysis
  micro_expressions JSONB DEFAULT '[]'::jsonb,
  expression_authenticity_score NUMERIC(4,3),
  
  -- Voice Stress Analysis
  voice_stress_markers JSONB DEFAULT '[]'::jsonb,
  vocal_authenticity_score NUMERIC(4,3),
  
  -- Linguistic Analysis
  linguistic_deception_markers JSONB DEFAULT '[]'::jsonb,
  linguistic_authenticity_score NUMERIC(4,3),
  
  -- Timeline
  deception_timeline JSONB DEFAULT '[]'::jsonb,
  peak_deception_moments JSONB DEFAULT '[]'::jsonb,
  
  -- Confidence and Model Info
  overall_confidence NUMERIC(4,3) NOT NULL,
  models_used TEXT[] DEFAULT '{}',
  analysis_version TEXT,
  
  -- Metadata
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===================
-- PHASE 4: Power Network Analysis
-- ===================
CREATE TABLE IF NOT EXISTS public.power_network_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Analysis Scope
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('full_network', 'ego_network', 'subgraph', 'comparison')),
  scope_description TEXT,
  
  -- Network Metrics
  total_nodes INTEGER,
  total_edges INTEGER,
  network_density NUMERIC(6,5),
  average_clustering NUMERIC(6,5),
  
  -- Centrality Rankings
  pagerank_rankings JSONB DEFAULT '[]'::jsonb,
  betweenness_rankings JSONB DEFAULT '[]'::jsonb,
  closeness_rankings JSONB DEFAULT '[]'::jsonb,
  eigenvector_rankings JSONB DEFAULT '[]'::jsonb,
  katz_rankings JSONB DEFAULT '[]'::jsonb,
  
  -- Power Analysis
  power_scores JSONB DEFAULT '{}'::jsonb,
  gatekeepers JSONB DEFAULT '[]'::jsonb,
  brokers JSONB DEFAULT '[]'::jsonb,
  influencers JSONB DEFAULT '[]'::jsonb,
  
  -- Vulnerability Analysis
  structural_holes JSONB DEFAULT '[]'::jsonb,
  weak_ties JSONB DEFAULT '[]'::jsonb,
  critical_nodes JSONB DEFAULT '[]'::jsonb,
  vulnerability_map JSONB DEFAULT '{}'::jsonb,
  
  -- Community Detection
  communities JSONB DEFAULT '[]'::jsonb,
  community_bridges JSONB DEFAULT '[]'::jsonb,
  
  -- Coalition Analysis
  detected_coalitions JSONB DEFAULT '[]'::jsonb,
  coalition_strength JSONB DEFAULT '{}'::jsonb,
  
  -- Influence Paths
  influence_paths JSONB DEFAULT '{}'::jsonb,
  optimal_targets JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===================
-- PHASE 9: Action Recommendations
-- ===================
CREATE TABLE IF NOT EXISTS public.action_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Recommendation Details
  recommendation_type TEXT NOT NULL,
  category TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Priority and Urgency
  priority_score NUMERIC(4,3) NOT NULL,
  urgency TEXT CHECK (urgency IN ('immediate', 'today', 'this_week', 'this_month', 'when_convenient')),
  expires_at TIMESTAMPTZ,
  
  -- Action Details
  suggested_action TEXT NOT NULL,
  action_script TEXT,
  talking_points TEXT[],
  
  -- Context
  trigger_reason TEXT,
  supporting_evidence JSONB DEFAULT '[]'::jsonb,
  opportunity_window JSONB DEFAULT '{}'::jsonb,
  
  -- Expected Outcomes
  expected_outcome TEXT,
  success_probability NUMERIC(4,3),
  risk_assessment JSONB DEFAULT '{}'::jsonb,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'viewed', 'accepted', 'declined', 'completed', 'expired')),
  outcome_recorded JSONB,
  
  -- Metadata
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  viewed_at TIMESTAMPTZ,
  actioned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===================
-- INDEXES (only create if table exists and index doesn't)
-- ===================
CREATE INDEX IF NOT EXISTS idx_personality_profiles_profile ON public.personality_profiles(profile_id);
CREATE INDEX IF NOT EXISTS idx_personality_profiles_user ON public.personality_profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_financial_intelligence_profile ON public.financial_intelligence(profile_id);
CREATE INDEX IF NOT EXISTS idx_financial_intelligence_user ON public.financial_intelligence(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_intelligence_wealth_tier ON public.financial_intelligence(wealth_tier);

CREATE INDEX IF NOT EXISTS idx_influence_campaigns_profile ON public.influence_campaigns(profile_id);
CREATE INDEX IF NOT EXISTS idx_influence_campaigns_user ON public.influence_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_influence_campaigns_status ON public.influence_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_influence_campaigns_next_touch ON public.influence_campaigns(next_touch_at);

CREATE INDEX IF NOT EXISTS idx_behavioral_predictions_profile ON public.behavioral_scenario_predictions(profile_id);
CREATE INDEX IF NOT EXISTS idx_behavioral_predictions_user ON public.behavioral_scenario_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_behavioral_predictions_scenario ON public.behavioral_scenario_predictions(scenario_type);

CREATE INDEX IF NOT EXISTS idx_deep_correlations_user ON public.deep_correlations(user_id);
CREATE INDEX IF NOT EXISTS idx_deep_correlations_type ON public.deep_correlations(correlation_type);
CREATE INDEX IF NOT EXISTS idx_deep_correlations_profiles ON public.deep_correlations USING GIN(involved_profiles);

CREATE INDEX IF NOT EXISTS idx_deception_analyses_profile ON public.deception_analyses(profile_id);
CREATE INDEX IF NOT EXISTS idx_deception_analyses_user ON public.deception_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_deception_analyses_source ON public.deception_analyses(source_type, source_id);

CREATE INDEX IF NOT EXISTS idx_power_network_user ON public.power_network_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_power_network_type ON public.power_network_analyses(analysis_type);

CREATE INDEX IF NOT EXISTS idx_action_recommendations_user ON public.action_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_action_recommendations_profile ON public.action_recommendations(profile_id);
CREATE INDEX IF NOT EXISTS idx_action_recommendations_status ON public.action_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_action_recommendations_priority ON public.action_recommendations(priority_score DESC);

-- ===================
-- RLS POLICIES
-- ===================
ALTER TABLE public.personality_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influence_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.behavioral_scenario_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deep_correlations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deception_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.power_network_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_recommendations ENABLE ROW LEVEL SECURITY;

-- Personality Profiles
CREATE POLICY "Users can view own personality profiles" ON public.personality_profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own personality profiles" ON public.personality_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own personality profiles" ON public.personality_profiles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own personality profiles" ON public.personality_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- Financial Intelligence
CREATE POLICY "Users can view own financial intelligence" ON public.financial_intelligence
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own financial intelligence" ON public.financial_intelligence
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own financial intelligence" ON public.financial_intelligence
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own financial intelligence" ON public.financial_intelligence
  FOR DELETE USING (auth.uid() = user_id);

-- Influence Campaigns
CREATE POLICY "Users can view own influence campaigns" ON public.influence_campaigns
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own influence campaigns" ON public.influence_campaigns
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own influence campaigns" ON public.influence_campaigns
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own influence campaigns" ON public.influence_campaigns
  FOR DELETE USING (auth.uid() = user_id);

-- Behavioral Predictions
CREATE POLICY "Users can view own behavioral predictions" ON public.behavioral_scenario_predictions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own behavioral predictions" ON public.behavioral_scenario_predictions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own behavioral predictions" ON public.behavioral_scenario_predictions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own behavioral predictions" ON public.behavioral_scenario_predictions
  FOR DELETE USING (auth.uid() = user_id);

-- Deep Correlations
CREATE POLICY "Users can view own deep correlations" ON public.deep_correlations
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own deep correlations" ON public.deep_correlations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own deep correlations" ON public.deep_correlations
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own deep correlations" ON public.deep_correlations
  FOR DELETE USING (auth.uid() = user_id);

-- Deception Analyses
CREATE POLICY "Users can view own deception analyses" ON public.deception_analyses
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own deception analyses" ON public.deception_analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own deception analyses" ON public.deception_analyses
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own deception analyses" ON public.deception_analyses
  FOR DELETE USING (auth.uid() = user_id);

-- Power Network Analyses
CREATE POLICY "Users can view own power network analyses" ON public.power_network_analyses
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own power network analyses" ON public.power_network_analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own power network analyses" ON public.power_network_analyses
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own power network analyses" ON public.power_network_analyses
  FOR DELETE USING (auth.uid() = user_id);

-- Action Recommendations
CREATE POLICY "Users can view own action recommendations" ON public.action_recommendations
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own action recommendations" ON public.action_recommendations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own action recommendations" ON public.action_recommendations
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own action recommendations" ON public.action_recommendations
  FOR DELETE USING (auth.uid() = user_id);

-- ===================
-- TRIGGERS
-- ===================
CREATE OR REPLACE TRIGGER update_personality_profiles_updated_at
  BEFORE UPDATE ON public.personality_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_financial_intelligence_updated_at
  BEFORE UPDATE ON public.financial_intelligence
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_influence_campaigns_updated_at
  BEFORE UPDATE ON public.influence_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();