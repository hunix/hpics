-- v8.0 Masterpiece Intelligence Suite - Foundation Schema (15 Tables)
-- Phase 1: Counter-Intelligence, Psychological Warfare, Biometric, Network, Predictive tables

-- ============================================================================
-- DOMAIN 1: COUNTER-INTELLIGENCE TABLES (4)
-- ============================================================================

-- 1. Sentient Intent Analyses (Provenance Graph-based threat detection)
CREATE TABLE public.sentient_intent_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  provenance_graph JSONB DEFAULT '{}',
  normal_scenarios JSONB DEFAULT '[]',
  deviation_score NUMERIC(5,4) DEFAULT 0,
  intent_classification TEXT,
  threat_indicators JSONB DEFAULT '[]',
  confidence_level NUMERIC(5,4) DEFAULT 0,
  behavioral_audit_log JSONB DEFAULT '[]',
  graph_dependencies JSONB DEFAULT '{}',
  anomaly_detections JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Insider Threat Assessments (ForScie Matrix integration)
CREATE TABLE public.insider_threat_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  threat_score NUMERIC(5,4) DEFAULT 0,
  lifecycle_phase TEXT DEFAULT 'unknown',
  motive_indicators JSONB DEFAULT '{}',
  means_assessment JSONB DEFAULT '{}',
  preparation_signals JSONB DEFAULT '[]',
  infringement_patterns JSONB DEFAULT '[]',
  anti_forensics_indicators JSONB DEFAULT '[]',
  hr_sentiment_score NUMERIC(5,4),
  financial_pressure_score NUMERIC(5,4),
  ideological_radicalization_score NUMERIC(5,4),
  risk_classification TEXT,
  intervention_recommendations JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Bayesian Intention Models (DAG-based intention recognition)
CREATE TABLE public.bayesian_intention_models (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  intention_dag JSONB DEFAULT '{}',
  prior_beliefs JSONB DEFAULT '{}',
  posterior_beliefs JSONB DEFAULT '{}',
  observed_actions JSONB DEFAULT '[]',
  intention_probabilities JSONB DEFAULT '{}',
  generative_process JSONB DEFAULT '{}',
  temporal_filtering JSONB DEFAULT '{}',
  multi_target_tracking JSONB DEFAULT '[]',
  prediction_horizon_hours INTEGER DEFAULT 24,
  model_confidence NUMERIC(5,4) DEFAULT 0,
  last_calibrated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Covert Channel Detections (Steganography & timing analysis)
CREATE TABLE public.covert_channel_detections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  channel_type TEXT NOT NULL,
  detection_method TEXT,
  confidence_score NUMERIC(5,4) DEFAULT 0,
  metadata_anomalies JSONB DEFAULT '[]',
  timing_patterns JSONB DEFAULT '{}',
  steganographic_indicators JSONB DEFAULT '[]',
  exfiltration_risk_score NUMERIC(5,4),
  carrier_media_analysis JSONB DEFAULT '{}',
  bandwidth_estimate_bps NUMERIC,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- DOMAIN 2: PSYCHOLOGICAL WARFARE TABLES (4)
-- ============================================================================

-- 5. PsychoAgent Cascade Predictions (PPDTS chain-of-thought)
CREATE TABLE public.psychoagent_cascade_predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  disaster_perception JSONB DEFAULT '{}',
  risk_cognition JSONB DEFAULT '{}',
  emotion_arousal JSONB DEFAULT '{}',
  predicted_response JSONB DEFAULT '{}',
  ppdts_chain JSONB DEFAULT '[]',
  cascade_probability NUMERIC(5,4) DEFAULT 0,
  panic_threshold NUMERIC(5,4),
  sentiment_trajectory JSONB DEFAULT '[]',
  intervention_points JSONB DEFAULT '[]',
  super_spreader_risk NUMERIC(5,4),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Synthetic Memory Implants (AI-edited memory reframing)
CREATE TABLE public.synthetic_memory_implants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_memory_context TEXT,
  implant_type TEXT NOT NULL,
  media_artifacts JSONB DEFAULT '[]',
  implantation_technique TEXT,
  success_probability NUMERIC(5,4),
  memory_consolidation_stage TEXT,
  reinforcement_schedule JSONB DEFAULT '{}',
  ethical_clearance_status TEXT DEFAULT 'pending',
  audit_log JSONB DEFAULT '[]',
  effectiveness_tracking JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Belief Modification Logs (PREMem episodic reasoning)
CREATE TABLE public.belief_modification_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  original_belief JSONB NOT NULL,
  target_belief JSONB NOT NULL,
  modification_strategy TEXT,
  information_evolution_type TEXT,
  extension_operations JSONB DEFAULT '[]',
  transformation_operations JSONB DEFAULT '[]',
  implication_chains JSONB DEFAULT '[]',
  pre_storage_reasoning JSONB DEFAULT '{}',
  modification_success BOOLEAN,
  resistance_encountered JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Regret Predictions (Behavioral economics decision modeling)
CREATE TABLE public.regret_predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  decision_context JSONB NOT NULL,
  anticipated_regret_score NUMERIC(5,4) DEFAULT 0,
  regret_type TEXT,
  counterfactual_alternatives JSONB DEFAULT '[]',
  emotional_investment_level NUMERIC(5,4),
  reversibility_assessment JSONB DEFAULT '{}',
  exploitation_vectors JSONB DEFAULT '[]',
  optimal_timing_window JSONB DEFAULT '{}',
  post_decision_tracking JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- DOMAIN 3: BIOMETRIC INTELLIGENCE TABLES (3)
-- ============================================================================

-- 9. Pupillometry Analyses (Eye-tracking cognitive load)
CREATE TABLE public.pupillometry_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id UUID,
  pupil_dilation_mm NUMERIC(6,4),
  cognitive_load_score NUMERIC(5,4) DEFAULT 0,
  saccadic_patterns JSONB DEFAULT '[]',
  fixation_analysis JSONB DEFAULT '{}',
  recognition_indicators JSONB DEFAULT '[]',
  deception_probability NUMERIC(5,4),
  gaze_trajectory JSONB DEFAULT '[]',
  blink_rate_analysis JSONB DEFAULT '{}',
  stimulus_response_mapping JSONB DEFAULT '{}',
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Thermal Stress Signatures (Infrared stress detection)
CREATE TABLE public.thermal_stress_signatures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id UUID,
  periorbital_temperature_delta NUMERIC(6,4),
  nasal_temperature_change NUMERIC(6,4),
  adrenaline_spike_detected BOOLEAN DEFAULT false,
  stress_classification TEXT,
  thermal_map_data JSONB DEFAULT '{}',
  blood_vessel_dilation JSONB DEFAULT '{}',
  baseline_comparison JSONB DEFAULT '{}',
  environmental_compensation JSONB DEFAULT '{}',
  deception_correlation NUMERIC(5,4),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. Network Resilience Scores (Graph warfare analysis)
CREATE TABLE public.network_resilience_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  network_snapshot_id UUID,
  overall_resilience_score NUMERIC(5,4) DEFAULT 0,
  critical_nodes JSONB DEFAULT '[]',
  fragmentation_threshold INTEGER,
  attack_vectors JSONB DEFAULT '[]',
  defense_strategies JSONB DEFAULT '[]',
  robustness_metrics JSONB DEFAULT '{}',
  redundancy_analysis JSONB DEFAULT '{}',
  cascade_failure_risk NUMERIC(5,4),
  recovery_time_estimate_hours NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- DOMAIN 4: NETWORK WARFARE TABLES (2)
-- ============================================================================

-- 12. Sheaf Influence Maps (DeepSN neural diffusion)
CREATE TABLE public.sheaf_influence_maps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  sheaf_structure JSONB DEFAULT '{}',
  influence_diffusion_patterns JSONB DEFAULT '[]',
  seed_set_optimization JSONB DEFAULT '{}',
  relational_structures JSONB DEFAULT '{}',
  overlapping_influence_zones JSONB DEFAULT '[]',
  influence_maximization_score NUMERIC(5,4),
  neural_diffusion_parameters JSONB DEFAULT '{}',
  propagation_predictions JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. Cascade Virality Predictions (Information spread modeling)
CREATE TABLE public.cascade_virality_predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  narrative_content JSONB NOT NULL,
  virality_score NUMERIC(5,4) DEFAULT 0,
  predicted_reach INTEGER,
  optimal_injection_points JSONB DEFAULT '[]',
  decay_rate_parameters JSONB DEFAULT '{}',
  resurgence_probability NUMERIC(5,4),
  amplifier_nodes JSONB DEFAULT '[]',
  counter_narrative_vulnerability JSONB DEFAULT '{}',
  time_to_peak_hours NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- DOMAIN 5: COGNITIVE WARFARE TABLES (1)
-- ============================================================================

-- 14. Cognitive Load Attacks (Decision degradation operations)
CREATE TABLE public.cognitive_load_attacks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  campaign_id UUID,
  attack_type TEXT NOT NULL,
  complexity_injection_level NUMERIC(5,4),
  working_memory_target JSONB DEFAULT '{}',
  information_overload_vectors JSONB DEFAULT '[]',
  decision_degradation_metrics JSONB DEFAULT '{}',
  response_quality_tracking JSONB DEFAULT '[]',
  cognitive_fatigue_indicators JSONB DEFAULT '{}',
  effectiveness_score NUMERIC(5,4),
  duration_minutes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- DOMAIN 6: PREDICTIVE INTELLIGENCE TABLES (1)
-- ============================================================================

-- 15. Crisis Inflection Points (Critical transition detection)
CREATE TABLE public.crisis_inflection_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  system_state JSONB NOT NULL,
  inflection_type TEXT,
  criticality_score NUMERIC(5,4) DEFAULT 0,
  intervention_leverage NUMERIC(5,4),
  time_sensitivity_hours NUMERIC,
  recommended_interventions JSONB DEFAULT '[]',
  state_trajectory JSONB DEFAULT '[]',
  transition_probability NUMERIC(5,4),
  cascade_risk_assessment JSONB DEFAULT '{}',
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================================================

ALTER TABLE public.sentient_intent_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insider_threat_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bayesian_intention_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.covert_channel_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.psychoagent_cascade_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.synthetic_memory_implants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.belief_modification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regret_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pupillometry_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thermal_stress_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_resilience_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sheaf_influence_maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cascade_virality_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cognitive_load_attacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crisis_inflection_points ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE RLS POLICIES (User-scoped access)
-- ============================================================================

-- Sentient Intent Analyses
CREATE POLICY "Users can view own sentient intent analyses" ON public.sentient_intent_analyses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sentient intent analyses" ON public.sentient_intent_analyses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sentient intent analyses" ON public.sentient_intent_analyses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sentient intent analyses" ON public.sentient_intent_analyses FOR DELETE USING (auth.uid() = user_id);

-- Insider Threat Assessments
CREATE POLICY "Users can view own insider threat assessments" ON public.insider_threat_assessments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own insider threat assessments" ON public.insider_threat_assessments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own insider threat assessments" ON public.insider_threat_assessments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own insider threat assessments" ON public.insider_threat_assessments FOR DELETE USING (auth.uid() = user_id);

-- Bayesian Intention Models
CREATE POLICY "Users can view own bayesian intention models" ON public.bayesian_intention_models FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own bayesian intention models" ON public.bayesian_intention_models FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bayesian intention models" ON public.bayesian_intention_models FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own bayesian intention models" ON public.bayesian_intention_models FOR DELETE USING (auth.uid() = user_id);

-- Covert Channel Detections
CREATE POLICY "Users can view own covert channel detections" ON public.covert_channel_detections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own covert channel detections" ON public.covert_channel_detections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own covert channel detections" ON public.covert_channel_detections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own covert channel detections" ON public.covert_channel_detections FOR DELETE USING (auth.uid() = user_id);

-- PsychoAgent Cascade Predictions
CREATE POLICY "Users can view own psychoagent cascade predictions" ON public.psychoagent_cascade_predictions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own psychoagent cascade predictions" ON public.psychoagent_cascade_predictions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own psychoagent cascade predictions" ON public.psychoagent_cascade_predictions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own psychoagent cascade predictions" ON public.psychoagent_cascade_predictions FOR DELETE USING (auth.uid() = user_id);

-- Synthetic Memory Implants
CREATE POLICY "Users can view own synthetic memory implants" ON public.synthetic_memory_implants FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own synthetic memory implants" ON public.synthetic_memory_implants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own synthetic memory implants" ON public.synthetic_memory_implants FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own synthetic memory implants" ON public.synthetic_memory_implants FOR DELETE USING (auth.uid() = user_id);

-- Belief Modification Logs
CREATE POLICY "Users can view own belief modification logs" ON public.belief_modification_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own belief modification logs" ON public.belief_modification_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own belief modification logs" ON public.belief_modification_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own belief modification logs" ON public.belief_modification_logs FOR DELETE USING (auth.uid() = user_id);

-- Regret Predictions
CREATE POLICY "Users can view own regret predictions" ON public.regret_predictions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own regret predictions" ON public.regret_predictions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own regret predictions" ON public.regret_predictions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own regret predictions" ON public.regret_predictions FOR DELETE USING (auth.uid() = user_id);

-- Pupillometry Analyses
CREATE POLICY "Users can view own pupillometry analyses" ON public.pupillometry_analyses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pupillometry analyses" ON public.pupillometry_analyses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pupillometry analyses" ON public.pupillometry_analyses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own pupillometry analyses" ON public.pupillometry_analyses FOR DELETE USING (auth.uid() = user_id);

-- Thermal Stress Signatures
CREATE POLICY "Users can view own thermal stress signatures" ON public.thermal_stress_signatures FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own thermal stress signatures" ON public.thermal_stress_signatures FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own thermal stress signatures" ON public.thermal_stress_signatures FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own thermal stress signatures" ON public.thermal_stress_signatures FOR DELETE USING (auth.uid() = user_id);

-- Network Resilience Scores
CREATE POLICY "Users can view own network resilience scores" ON public.network_resilience_scores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own network resilience scores" ON public.network_resilience_scores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own network resilience scores" ON public.network_resilience_scores FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own network resilience scores" ON public.network_resilience_scores FOR DELETE USING (auth.uid() = user_id);

-- Sheaf Influence Maps
CREATE POLICY "Users can view own sheaf influence maps" ON public.sheaf_influence_maps FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sheaf influence maps" ON public.sheaf_influence_maps FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sheaf influence maps" ON public.sheaf_influence_maps FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sheaf influence maps" ON public.sheaf_influence_maps FOR DELETE USING (auth.uid() = user_id);

-- Cascade Virality Predictions
CREATE POLICY "Users can view own cascade virality predictions" ON public.cascade_virality_predictions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cascade virality predictions" ON public.cascade_virality_predictions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cascade virality predictions" ON public.cascade_virality_predictions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own cascade virality predictions" ON public.cascade_virality_predictions FOR DELETE USING (auth.uid() = user_id);

-- Cognitive Load Attacks
CREATE POLICY "Users can view own cognitive load attacks" ON public.cognitive_load_attacks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cognitive load attacks" ON public.cognitive_load_attacks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cognitive load attacks" ON public.cognitive_load_attacks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own cognitive load attacks" ON public.cognitive_load_attacks FOR DELETE USING (auth.uid() = user_id);

-- Crisis Inflection Points
CREATE POLICY "Users can view own crisis inflection points" ON public.crisis_inflection_points FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own crisis inflection points" ON public.crisis_inflection_points FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own crisis inflection points" ON public.crisis_inflection_points FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own crisis inflection points" ON public.crisis_inflection_points FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_sentient_intent_profile ON public.sentient_intent_analyses(profile_id);
CREATE INDEX idx_sentient_intent_user ON public.sentient_intent_analyses(user_id);
CREATE INDEX idx_insider_threat_profile ON public.insider_threat_assessments(profile_id);
CREATE INDEX idx_insider_threat_user ON public.insider_threat_assessments(user_id);
CREATE INDEX idx_bayesian_intention_profile ON public.bayesian_intention_models(profile_id);
CREATE INDEX idx_bayesian_intention_user ON public.bayesian_intention_models(user_id);
CREATE INDEX idx_covert_channel_profile ON public.covert_channel_detections(profile_id);
CREATE INDEX idx_covert_channel_user ON public.covert_channel_detections(user_id);
CREATE INDEX idx_psychoagent_cascade_profile ON public.psychoagent_cascade_predictions(profile_id);
CREATE INDEX idx_psychoagent_cascade_user ON public.psychoagent_cascade_predictions(user_id);
CREATE INDEX idx_synthetic_memory_profile ON public.synthetic_memory_implants(profile_id);
CREATE INDEX idx_synthetic_memory_user ON public.synthetic_memory_implants(user_id);
CREATE INDEX idx_belief_modification_profile ON public.belief_modification_logs(profile_id);
CREATE INDEX idx_belief_modification_user ON public.belief_modification_logs(user_id);
CREATE INDEX idx_regret_predictions_profile ON public.regret_predictions(profile_id);
CREATE INDEX idx_regret_predictions_user ON public.regret_predictions(user_id);
CREATE INDEX idx_pupillometry_profile ON public.pupillometry_analyses(profile_id);
CREATE INDEX idx_pupillometry_user ON public.pupillometry_analyses(user_id);
CREATE INDEX idx_thermal_stress_profile ON public.thermal_stress_signatures(profile_id);
CREATE INDEX idx_thermal_stress_user ON public.thermal_stress_signatures(user_id);
CREATE INDEX idx_network_resilience_profile ON public.network_resilience_scores(profile_id);
CREATE INDEX idx_network_resilience_user ON public.network_resilience_scores(user_id);
CREATE INDEX idx_sheaf_influence_profile ON public.sheaf_influence_maps(profile_id);
CREATE INDEX idx_sheaf_influence_user ON public.sheaf_influence_maps(user_id);
CREATE INDEX idx_cascade_virality_profile ON public.cascade_virality_predictions(profile_id);
CREATE INDEX idx_cascade_virality_user ON public.cascade_virality_predictions(user_id);
CREATE INDEX idx_cognitive_load_profile ON public.cognitive_load_attacks(profile_id);
CREATE INDEX idx_cognitive_load_user ON public.cognitive_load_attacks(user_id);
CREATE INDEX idx_crisis_inflection_profile ON public.crisis_inflection_points(profile_id);
CREATE INDEX idx_crisis_inflection_user ON public.crisis_inflection_points(user_id);