-- HPICS Revolutionary Enhancement Suite v9.0
-- New tables for 50+ intelligence engines

-- Cognitive Warfare Operations
CREATE TABLE IF NOT EXISTS public.cognitive_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  operation_type TEXT NOT NULL, -- 'reflexive_control', 'perception_shaping', 'cognitive_friction', 'belief_synthesis'
  operation_name TEXT,
  target_mental_model JSONB DEFAULT '{}',
  payloads JSONB[] DEFAULT ARRAY[]::JSONB[],
  transmission_channels JSONB DEFAULT '[]',
  success_indicators JSONB DEFAULT '{}',
  feedback_loops JSONB DEFAULT '[]',
  success_probability FLOAT DEFAULT 0,
  status TEXT DEFAULT 'planning', -- 'planning', 'active', 'monitoring', 'completed', 'aborted'
  execution_log JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Digital Twins for cognitive simulation
CREATE TABLE IF NOT EXISTS public.digital_twins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  twin_type TEXT NOT NULL, -- 'cognitive', 'behavioral', 'full', 'hdtwin'
  twin_name TEXT,
  persona_data JSONB DEFAULT '{}', -- DeepPersona output (100+ attributes)
  simulation_state JSONB DEFAULT '{}',
  cognitive_model JSONB DEFAULT '{}',
  behavioral_patterns JSONB DEFAULT '{}',
  emotional_states JSONB DEFAULT '{}',
  relationship_graph JSONB DEFAULT '{}',
  last_synced TIMESTAMPTZ,
  accuracy_score FLOAT DEFAULT 0,
  validation_metrics JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Multimodal Deception Analysis Results
CREATE TABLE IF NOT EXISTS public.deception_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  source_id UUID, -- Reference to recording, document, or media
  source_type TEXT, -- 'audio', 'video', 'text', 'multimodal'
  modality TEXT NOT NULL, -- 'textual', 'acoustic', 'visual', 'physiological', 'fused'
  deception_probability FLOAT DEFAULT 0,
  confidence FLOAT DEFAULT 0,
  cognitive_load_score FLOAT DEFAULT 0,
  markers JSONB DEFAULT '{}', -- Specific indicators detected
  linguistic_markers JSONB DEFAULT '{}',
  acoustic_markers JSONB DEFAULT '{}',
  visual_markers JSONB DEFAULT '{}',
  physiological_markers JSONB DEFAULT '{}',
  fusion_weights JSONB DEFAULT '{}',
  timeline JSONB DEFAULT '[]', -- Temporal deception markers
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quantum-Like Decision States
CREATE TABLE IF NOT EXISTS public.quantum_decision_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  state_vector FLOAT[] DEFAULT ARRAY[]::FLOAT[], -- Probability amplitudes
  basis_states JSONB DEFAULT '[]',
  interference_effects JSONB DEFAULT '{}',
  order_effects JSONB DEFAULT '{}',
  qq_equality_result JSONB DEFAULT '{}',
  conjunction_fallacy_score FLOAT DEFAULT 0,
  disjunction_effect_score FLOAT DEFAULT 0,
  measurement_context TEXT,
  superposition_states JSONB DEFAULT '[]',
  entanglement_partners UUID[] DEFAULT ARRAY[]::UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Network Intelligence Analysis
CREATE TABLE IF NOT EXISTS public.network_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  network_snapshot_id UUID,
  analysis_type TEXT NOT NULL, -- 'tas_com', 'cascade', 'propaganda', 'influence_max'
  community_detection JSONB DEFAULT '{}', -- TAS-Com results
  influence_nodes UUID[] DEFAULT ARRAY[]::UUID[],
  super_spreaders JSONB DEFAULT '[]',
  cascade_predictions JSONB DEFAULT '{}',
  propaganda_indicators JSONB DEFAULT '{}',
  structural_holes JSONB DEFAULT '[]',
  betweenness_scores JSONB DEFAULT '{}',
  eigenvector_centrality JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stylometric Fingerprints
CREATE TABLE IF NOT EXISTS public.stylometric_fingerprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  source_id UUID, -- Reference to document or message
  fingerprint_type TEXT NOT NULL, -- 'authorship', 'llm_detection', 'cross_language'
  layer_signatures JSONB DEFAULT '{}', -- Transformer layer outputs
  syntactic_features JSONB DEFAULT '{}',
  stylistic_features JSONB DEFAULT '{}',
  semantic_features JSONB DEFAULT '{}',
  burrows_delta FLOAT DEFAULT 0,
  ai_probability FLOAT DEFAULT 0,
  author_cluster TEXT,
  confidence FLOAT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Memory & Suggestibility Profiles
CREATE TABLE IF NOT EXISTS public.suggestibility_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  guided_imagery_score FLOAT DEFAULT 0,
  pressure_compliance_score FLOAT DEFAULT 0,
  social_conformity_score FLOAT DEFAULT 0,
  confidence_calibration FLOAT DEFAULT 0,
  source_monitoring_accuracy FLOAT DEFAULT 0,
  reconsolidation_windows JSONB DEFAULT '[]', -- Tracked memory retrieval events
  last_memory_activation TIMESTAMPTZ,
  intervention_opportunities JSONB DEFAULT '[]',
  overall_suggestibility FLOAT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dark Psychology Profiles
CREATE TABLE IF NOT EXISTS public.dark_psychology_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  machiavellianism_score FLOAT DEFAULT 0,
  narcissism_score FLOAT DEFAULT 0,
  psychopathy_score FLOAT DEFAULT 0,
  sadism_score FLOAT DEFAULT 0,
  dark_tetrad_composite FLOAT DEFAULT 0,
  coercive_control_indicators JSONB DEFAULT '{}',
  gaslighting_markers JSONB DEFAULT '[]',
  manipulation_patterns JSONB DEFAULT '[]',
  cult_recruitment_risk FLOAT DEFAULT 0,
  evidence_sources JSONB DEFAULT '[]',
  confidence FLOAT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Collective Behavior Simulations
CREATE TABLE IF NOT EXISTS public.collective_simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  simulation_type TEXT NOT NULL, -- 'panic', 'epidemic', 'cascade', 'crowd_anomaly'
  simulation_name TEXT,
  initial_conditions JSONB DEFAULT '{}',
  model_parameters JSONB DEFAULT '{}', -- SI/SIR/SIS/IC/LT params
  simulation_results JSONB DEFAULT '{}',
  intervention_scenarios JSONB DEFAULT '[]',
  predicted_outcomes JSONB DEFAULT '{}',
  blast_radius_estimate JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hypergame Analysis States
CREATE TABLE IF NOT EXISTS public.hypergame_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  game_type TEXT NOT NULL, -- 'hypergame', 'quantum', 'bayesian_persuasion'
  players JSONB DEFAULT '[]',
  perceived_games JSONB DEFAULT '{}', -- What each player thinks the game is
  actual_game JSONB DEFAULT '{}',
  perception_gaps JSONB DEFAULT '[]',
  equilibrium_type TEXT, -- 'strong_hne', 'weak_hne', 'nash'
  equilibrium_strategies JSONB DEFAULT '{}',
  exploitation_opportunities JSONB DEFAULT '[]',
  belief_structures JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MINDSPACE Campaign Tracking
CREATE TABLE IF NOT EXISTS public.mindspace_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  campaign_name TEXT NOT NULL,
  triggers_used JSONB DEFAULT '{}', -- M, I, N, D, S, P, A, C, E scores
  messenger_config JSONB DEFAULT '{}',
  incentive_framing JSONB DEFAULT '{}',
  norm_signals JSONB DEFAULT '[]',
  default_options JSONB DEFAULT '{}',
  salience_elements JSONB DEFAULT '[]',
  priming_cues JSONB DEFAULT '[]',
  affect_associations JSONB DEFAULT '{}',
  commitment_devices JSONB DEFAULT '[]',
  ego_appeals JSONB DEFAULT '{}',
  ab_test_results JSONB DEFAULT '[]',
  effectiveness_score FLOAT DEFAULT 0,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all new tables
ALTER TABLE public.cognitive_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_twins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deception_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quantum_decision_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stylometric_fingerprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suggestibility_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dark_psychology_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collective_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hypergame_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mindspace_campaigns ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cognitive_operations
CREATE POLICY "Users can view own cognitive_operations" ON public.cognitive_operations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cognitive_operations" ON public.cognitive_operations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cognitive_operations" ON public.cognitive_operations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own cognitive_operations" ON public.cognitive_operations FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for digital_twins
CREATE POLICY "Users can view own digital_twins" ON public.digital_twins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own digital_twins" ON public.digital_twins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own digital_twins" ON public.digital_twins FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own digital_twins" ON public.digital_twins FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for deception_analyses
CREATE POLICY "Users can view own deception_analyses" ON public.deception_analyses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own deception_analyses" ON public.deception_analyses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own deception_analyses" ON public.deception_analyses FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for quantum_decision_states
CREATE POLICY "Users can view own quantum_decision_states" ON public.quantum_decision_states FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own quantum_decision_states" ON public.quantum_decision_states FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own quantum_decision_states" ON public.quantum_decision_states FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own quantum_decision_states" ON public.quantum_decision_states FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for network_intelligence
CREATE POLICY "Users can view own network_intelligence" ON public.network_intelligence FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own network_intelligence" ON public.network_intelligence FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own network_intelligence" ON public.network_intelligence FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for stylometric_fingerprints
CREATE POLICY "Users can view own stylometric_fingerprints" ON public.stylometric_fingerprints FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own stylometric_fingerprints" ON public.stylometric_fingerprints FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own stylometric_fingerprints" ON public.stylometric_fingerprints FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for suggestibility_profiles
CREATE POLICY "Users can view own suggestibility_profiles" ON public.suggestibility_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own suggestibility_profiles" ON public.suggestibility_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own suggestibility_profiles" ON public.suggestibility_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own suggestibility_profiles" ON public.suggestibility_profiles FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for dark_psychology_profiles
CREATE POLICY "Users can view own dark_psychology_profiles" ON public.dark_psychology_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own dark_psychology_profiles" ON public.dark_psychology_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own dark_psychology_profiles" ON public.dark_psychology_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own dark_psychology_profiles" ON public.dark_psychology_profiles FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for collective_simulations
CREATE POLICY "Users can view own collective_simulations" ON public.collective_simulations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own collective_simulations" ON public.collective_simulations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own collective_simulations" ON public.collective_simulations FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for hypergame_states
CREATE POLICY "Users can view own hypergame_states" ON public.hypergame_states FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own hypergame_states" ON public.hypergame_states FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own hypergame_states" ON public.hypergame_states FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own hypergame_states" ON public.hypergame_states FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for mindspace_campaigns
CREATE POLICY "Users can view own mindspace_campaigns" ON public.mindspace_campaigns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own mindspace_campaigns" ON public.mindspace_campaigns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own mindspace_campaigns" ON public.mindspace_campaigns FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own mindspace_campaigns" ON public.mindspace_campaigns FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cognitive_operations_profile ON public.cognitive_operations(profile_id);
CREATE INDEX IF NOT EXISTS idx_cognitive_operations_type ON public.cognitive_operations(operation_type);
CREATE INDEX IF NOT EXISTS idx_digital_twins_profile ON public.digital_twins(profile_id);
CREATE INDEX IF NOT EXISTS idx_deception_analyses_profile ON public.deception_analyses(profile_id);
CREATE INDEX IF NOT EXISTS idx_deception_analyses_source ON public.deception_analyses(source_id);
CREATE INDEX IF NOT EXISTS idx_quantum_decision_states_profile ON public.quantum_decision_states(profile_id);
CREATE INDEX IF NOT EXISTS idx_stylometric_fingerprints_profile ON public.stylometric_fingerprints(profile_id);
CREATE INDEX IF NOT EXISTS idx_suggestibility_profiles_profile ON public.suggestibility_profiles(profile_id);
CREATE INDEX IF NOT EXISTS idx_dark_psychology_profiles_profile ON public.dark_psychology_profiles(profile_id);
CREATE INDEX IF NOT EXISTS idx_hypergame_states_profile ON public.hypergame_states(profile_id);
CREATE INDEX IF NOT EXISTS idx_mindspace_campaigns_profile ON public.mindspace_campaigns(profile_id);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cognitive_operations_updated_at BEFORE UPDATE ON public.cognitive_operations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_digital_twins_updated_at BEFORE UPDATE ON public.digital_twins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quantum_decision_states_updated_at BEFORE UPDATE ON public.quantum_decision_states FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suggestibility_profiles_updated_at BEFORE UPDATE ON public.suggestibility_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dark_psychology_profiles_updated_at BEFORE UPDATE ON public.dark_psychology_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hypergame_states_updated_at BEFORE UPDATE ON public.hypergame_states FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mindspace_campaigns_updated_at BEFORE UPDATE ON public.mindspace_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();