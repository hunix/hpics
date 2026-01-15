-- AGIS Ultimate Dominance Enhancement Suite - Database Schema
-- Phase 1: Create 8 new tables for dark psychology and data fusion

-- 1. Trauma Exploitation Windows - Tactical vulnerability timing
CREATE TABLE public.trauma_exploitation_windows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  trauma_type TEXT NOT NULL,
  trigger_description TEXT,
  anniversary_date DATE,
  vulnerability_score NUMERIC(3,2) DEFAULT 0,
  optimal_exploitation_time JSONB DEFAULT '{}',
  emotional_state_indicators JSONB DEFAULT '[]',
  recommended_tactics TEXT[],
  counter_resistance_notes TEXT,
  last_triggered_at TIMESTAMPTZ,
  success_rate NUMERIC(3,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Addiction Protocols - Reinforcement schedule tracking
CREATE TABLE public.addiction_protocols (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  protocol_name TEXT NOT NULL,
  addiction_type TEXT NOT NULL,
  reinforcement_schedule JSONB NOT NULL DEFAULT '{}',
  current_phase TEXT DEFAULT 'initiation',
  dopamine_cycle_mapping JSONB DEFAULT '{}',
  compliance_metrics JSONB DEFAULT '{}',
  variable_ratio_config JSONB DEFAULT '{}',
  intermittent_reinforcement_score NUMERIC(3,2) DEFAULT 0,
  dependency_progression JSONB DEFAULT '[]',
  withdrawal_timing JSONB DEFAULT '{}',
  last_reinforcement_at TIMESTAMPTZ,
  next_scheduled_at TIMESTAMPTZ,
  effectiveness_score NUMERIC(3,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Phobia Mappings - Fear exploitation data
CREATE TABLE public.phobia_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  phobia_type TEXT NOT NULL,
  trigger_stimuli JSONB DEFAULT '[]',
  intensity_level NUMERIC(3,2) DEFAULT 0,
  fear_response_pattern JSONB DEFAULT '{}',
  exploitation_scripts JSONB DEFAULT '[]',
  optimal_activation_timing JSONB DEFAULT '{}',
  neuroticism_correlation NUMERIC(3,2) DEFAULT 0,
  avoidance_behaviors TEXT[],
  counter_phobia_indicators JSONB DEFAULT '{}',
  last_activation_at TIMESTAMPTZ,
  activation_success_rate NUMERIC(3,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Coercive Control Metrics - Control tactic scores
CREATE TABLE public.coercive_control_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  isolation_score NUMERIC(3,2) DEFAULT 0,
  financial_control_score NUMERIC(3,2) DEFAULT 0,
  information_control_score NUMERIC(3,2) DEFAULT 0,
  time_monopolization_score NUMERIC(3,2) DEFAULT 0,
  emotional_control_score NUMERIC(3,2) DEFAULT 0,
  physical_control_indicators JSONB DEFAULT '{}',
  surveillance_intensity NUMERIC(3,2) DEFAULT 0,
  punishment_reward_ratio JSONB DEFAULT '{}',
  resistance_level NUMERIC(3,2) DEFAULT 0,
  compliance_trend JSONB DEFAULT '[]',
  escalation_pathway JSONB DEFAULT '[]',
  current_control_phase TEXT DEFAULT 'assessment',
  total_control_score NUMERIC(3,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Breaking Point Predictions - Psychological limit forecasts
CREATE TABLE public.breaking_point_predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  current_resilience_score NUMERIC(3,2) DEFAULT 0,
  predicted_breaking_point TIMESTAMPTZ,
  confidence_level NUMERIC(3,2) DEFAULT 0,
  contributing_factors JSONB DEFAULT '[]',
  vulnerability_aggregation JSONB DEFAULT '{}',
  stress_accumulation_rate NUMERIC(5,4) DEFAULT 0,
  resistance_degradation_trend JSONB DEFAULT '[]',
  optimal_pressure_timing JSONB DEFAULT '{}',
  pressure_vectors JSONB DEFAULT '[]',
  warning_indicators TEXT[],
  post_break_vulnerability_window JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Dependency Scores - Multi-factor dependency tracking
CREATE TABLE public.dependency_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  emotional_dependency NUMERIC(3,2) DEFAULT 0,
  financial_dependency NUMERIC(3,2) DEFAULT 0,
  social_dependency NUMERIC(3,2) DEFAULT 0,
  informational_dependency NUMERIC(3,2) DEFAULT 0,
  narcissistic_supply_dependency NUMERIC(3,2) DEFAULT 0,
  attachment_dependency NUMERIC(3,2) DEFAULT 0,
  isolation_factor NUMERIC(3,2) DEFAULT 0,
  withdrawal_severity_prediction JSONB DEFAULT '{}',
  exit_prevention_protocols JSONB DEFAULT '[]',
  dependency_creation_tactics JSONB DEFAULT '[]',
  total_dependency_score NUMERIC(3,2) DEFAULT 0,
  dependency_trend JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. False Memory Tracking - Memory modification success rates
CREATE TABLE public.false_memory_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_memory_description TEXT NOT NULL,
  implanted_narrative TEXT NOT NULL,
  implantation_technique TEXT,
  confidence_before NUMERIC(3,2) DEFAULT 0,
  confidence_after NUMERIC(3,2) DEFAULT 0,
  verification_attempts JSONB DEFAULT '[]',
  contradiction_detections JSONB DEFAULT '[]',
  reinforcement_schedule JSONB DEFAULT '{}',
  memory_stability_score NUMERIC(3,2) DEFAULT 0,
  success_status TEXT DEFAULT 'in_progress',
  reality_testing_bypass_score NUMERIC(3,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Cult Tactic Deployments - BITE model implementation tracking
CREATE TABLE public.cult_tactic_deployments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  behavior_control_score NUMERIC(3,2) DEFAULT 0,
  information_control_score NUMERIC(3,2) DEFAULT 0,
  thought_control_score NUMERIC(3,2) DEFAULT 0,
  emotional_control_score NUMERIC(3,2) DEFAULT 0,
  thought_stopping_techniques JSONB DEFAULT '[]',
  us_vs_them_narrative_strength NUMERIC(3,2) DEFAULT 0,
  confession_culture_metrics JSONB DEFAULT '{}',
  surveillance_acceptance NUMERIC(3,2) DEFAULT 0,
  group_identity_strength NUMERIC(3,2) DEFAULT 0,
  exit_cost_perception NUMERIC(3,2) DEFAULT 0,
  loaded_language_adoption TEXT[],
  total_bite_score NUMERIC(3,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Cross-Domain Correlations - Data interconnection tracking
CREATE TABLE public.cross_domain_correlations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  correlation_type TEXT NOT NULL,
  source_domains TEXT[] NOT NULL,
  correlation_strength NUMERIC(3,2) DEFAULT 0,
  pattern_description TEXT,
  tactical_implications JSONB DEFAULT '[]',
  auto_recommendations JSONB DEFAULT '[]',
  temporal_alignment JSONB DEFAULT '{}',
  confidence_score NUMERIC(3,2) DEFAULT 0,
  last_computed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Learned Helplessness Tracking
CREATE TABLE public.learned_helplessness_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  helplessness_score NUMERIC(3,2) DEFAULT 0,
  no_win_situations_deployed JSONB DEFAULT '[]',
  initiative_blocking_events JSONB DEFAULT '[]',
  escape_attempt_detections JSONB DEFAULT '[]',
  hopelessness_indicators JSONB DEFAULT '{}',
  passivity_trend JSONB DEFAULT '[]',
  attribution_style JSONB DEFAULT '{}',
  response_patterns JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. Stockholm Syndrome Tracking
CREATE TABLE public.stockholm_syndrome_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  bonding_score NUMERIC(3,2) DEFAULT 0,
  gratitude_for_kindness_events JSONB DEFAULT '[]',
  defender_behavior_instances JSONB DEFAULT '[]',
  captor_identification_level NUMERIC(3,2) DEFAULT 0,
  kindness_cruelty_ratio JSONB DEFAULT '{}',
  optimal_ratio_calculation JSONB DEFAULT '{}',
  perceived_threat_level NUMERIC(3,2) DEFAULT 0,
  isolation_from_others NUMERIC(3,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.trauma_exploitation_windows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addiction_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phobia_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coercive_control_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breaking_point_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dependency_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.false_memory_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cult_tactic_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cross_domain_correlations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learned_helplessness_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stockholm_syndrome_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for all tables (user can only access their own data)
CREATE POLICY "Users can manage their own trauma exploitation windows" ON public.trauma_exploitation_windows FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own addiction protocols" ON public.addiction_protocols FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own phobia mappings" ON public.phobia_mappings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own coercive control metrics" ON public.coercive_control_metrics FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own breaking point predictions" ON public.breaking_point_predictions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own dependency scores" ON public.dependency_scores FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own false memory tracking" ON public.false_memory_tracking FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own cult tactic deployments" ON public.cult_tactic_deployments FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own cross domain correlations" ON public.cross_domain_correlations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own learned helplessness tracking" ON public.learned_helplessness_tracking FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own stockholm syndrome tracking" ON public.stockholm_syndrome_tracking FOR ALL USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_trauma_exploitation_profile ON public.trauma_exploitation_windows(profile_id);
CREATE INDEX idx_trauma_exploitation_user ON public.trauma_exploitation_windows(user_id);
CREATE INDEX idx_addiction_protocols_profile ON public.addiction_protocols(profile_id);
CREATE INDEX idx_phobia_mappings_profile ON public.phobia_mappings(profile_id);
CREATE INDEX idx_coercive_control_profile ON public.coercive_control_metrics(profile_id);
CREATE INDEX idx_breaking_point_profile ON public.breaking_point_predictions(profile_id);
CREATE INDEX idx_dependency_scores_profile ON public.dependency_scores(profile_id);
CREATE INDEX idx_false_memory_profile ON public.false_memory_tracking(profile_id);
CREATE INDEX idx_cult_tactics_profile ON public.cult_tactic_deployments(profile_id);
CREATE INDEX idx_cross_domain_profile ON public.cross_domain_correlations(profile_id);
CREATE INDEX idx_learned_helplessness_profile ON public.learned_helplessness_tracking(profile_id);
CREATE INDEX idx_stockholm_profile ON public.stockholm_syndrome_tracking(profile_id);

-- Update trigger for all tables
CREATE TRIGGER update_trauma_exploitation_updated_at BEFORE UPDATE ON public.trauma_exploitation_windows FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_addiction_protocols_updated_at BEFORE UPDATE ON public.addiction_protocols FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_phobia_mappings_updated_at BEFORE UPDATE ON public.phobia_mappings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_coercive_control_updated_at BEFORE UPDATE ON public.coercive_control_metrics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_breaking_point_updated_at BEFORE UPDATE ON public.breaking_point_predictions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_dependency_scores_updated_at BEFORE UPDATE ON public.dependency_scores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_false_memory_updated_at BEFORE UPDATE ON public.false_memory_tracking FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cult_tactics_updated_at BEFORE UPDATE ON public.cult_tactic_deployments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cross_domain_updated_at BEFORE UPDATE ON public.cross_domain_correlations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_learned_helplessness_updated_at BEFORE UPDATE ON public.learned_helplessness_tracking FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_stockholm_updated_at BEFORE UPDATE ON public.stockholm_syndrome_tracking FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();