-- Create tables for cognitive warfare, deception operations, and enhanced warfare data

-- Cognitive Warfare Operations table
CREATE TABLE IF NOT EXISTS public.cognitive_warfare_operations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  operation_name TEXT NOT NULL,
  operation_type TEXT NOT NULL DEFAULT 'standard', -- standard, covert, influence, destabilization
  status TEXT DEFAULT 'planning', -- planning, active, paused, completed, aborted
  cognitive_vulnerabilities JSONB DEFAULT '[]',
  narrative_control_points JSONB DEFAULT '[]',
  belief_system_targets JSONB DEFAULT '[]',
  reality_anchors JSONB DEFAULT '[]',
  dissonance_vectors JSONB DEFAULT '[]',
  perception_filters JSONB DEFAULT '[]',
  attack_surface_map JSONB DEFAULT '{}',
  current_phase TEXT DEFAULT 'reconnaissance',
  phase_progression JSONB DEFAULT '[]',
  effectiveness_score NUMERIC DEFAULT 0,
  resistance_encountered JSONB DEFAULT '[]',
  escalation_triggers JSONB DEFAULT '[]',
  mission_objectives JSONB DEFAULT '[]',
  success_criteria JSONB DEFAULT '{}',
  abort_conditions JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Active Defense Operations table
CREATE TABLE IF NOT EXISTS public.active_defense_operations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  defense_type TEXT NOT NULL, -- counter_intel, deception, hardening, honeypot
  threat_actor_id UUID,
  threat_profile JSONB DEFAULT '{}',
  defense_posture TEXT DEFAULT 'passive', -- passive, active, aggressive
  active_measures JSONB DEFAULT '[]',
  deception_layers JSONB DEFAULT '[]',
  counter_narratives JSONB DEFAULT '[]',
  honeypot_deployments JSONB DEFAULT '[]',
  threat_indicators JSONB DEFAULT '[]',
  response_playbook JSONB DEFAULT '{}',
  escalation_level INTEGER DEFAULT 1,
  automated_responses BOOLEAN DEFAULT false,
  alert_thresholds JSONB DEFAULT '{}',
  incident_log JSONB DEFAULT '[]',
  effectiveness_metrics JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Deception Operations table
CREATE TABLE IF NOT EXISTS public.deception_operations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  operation_name TEXT NOT NULL,
  deception_type TEXT NOT NULL, -- misdirection, false_flag, perception_management, cover_story
  target_beliefs JSONB DEFAULT '[]',
  planted_information JSONB DEFAULT '[]',
  cover_stories JSONB DEFAULT '[]',
  false_trail_data JSONB DEFAULT '[]',
  credibility_anchors JSONB DEFAULT '[]',
  verification_traps JSONB DEFAULT '[]',
  discovery_risk NUMERIC DEFAULT 0,
  plausibility_score NUMERIC DEFAULT 0,
  duration_estimate TEXT,
  maintenance_requirements JSONB DEFAULT '[]',
  contingency_plans JSONB DEFAULT '[]',
  burn_notice_protocol JSONB DEFAULT '{}',
  status TEXT DEFAULT 'planning',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Vulnerability Windows Tracking table
CREATE TABLE IF NOT EXISTS public.vulnerability_windows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  window_type TEXT NOT NULL, -- emotional, cognitive, financial, social, health
  trigger_event TEXT,
  predicted_start TIMESTAMP WITH TIME ZONE,
  predicted_end TIMESTAMP WITH TIME ZONE,
  vulnerability_score NUMERIC DEFAULT 0,
  confidence_score NUMERIC DEFAULT 0,
  exploitation_vectors JSONB DEFAULT '[]',
  optimal_approach_timing JSONB DEFAULT '{}',
  risk_factors JSONB DEFAULT '[]',
  protective_factors_weakened JSONB DEFAULT '[]',
  historical_patterns JSONB DEFAULT '[]',
  current_status TEXT DEFAULT 'predicted', -- predicted, active, expired, exploited
  outcome_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Trust Trajectory Tracking (180-day)
CREATE TABLE IF NOT EXISTS public.trust_trajectories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  trajectory_date DATE NOT NULL,
  trust_score NUMERIC DEFAULT 0,
  defection_probability NUMERIC DEFAULT 0,
  loyalty_binding_strength NUMERIC DEFAULT 0,
  gottman_horsemen_scores JSONB DEFAULT '{}',
  warning_signals_active INTEGER DEFAULT 0,
  positive_interactions INTEGER DEFAULT 0,
  negative_interactions INTEGER DEFAULT 0,
  trust_decay_events JSONB DEFAULT '[]',
  loyalty_binding_events JSONB DEFAULT '[]',
  relationship_stress_score NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, profile_id, trajectory_date)
);

-- Proportional Response Log table
CREATE TABLE IF NOT EXISTS public.proportional_response_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  incident_id UUID,
  incident_severity NUMERIC DEFAULT 0,
  incident_type TEXT,
  incident_analysis JSONB DEFAULT '{}',
  recommended_response JSONB DEFAULT '{}',
  response_tier TEXT, -- diplomatic, proportional, escalated, maximum
  calibration_factors JSONB DEFAULT '{}',
  collateral_assessment JSONB DEFAULT '{}',
  executed_response JSONB DEFAULT '{}',
  outcome_evaluation JSONB DEFAULT '{}',
  lessons_learned TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Mosaic Intelligence Fusion Results table
CREATE TABLE IF NOT EXISTS public.mosaic_intelligence_fusion (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  fusion_type TEXT NOT NULL, -- behavioral, communication, financial, social, comprehensive
  source_count INTEGER DEFAULT 0,
  sources_analyzed JSONB DEFAULT '[]',
  correlated_patterns JSONB DEFAULT '[]',
  contradictions_detected JSONB DEFAULT '[]',
  confidence_matrix JSONB DEFAULT '{}',
  high_confidence_insights JSONB DEFAULT '[]',
  low_confidence_gaps JSONB DEFAULT '[]',
  fusion_score NUMERIC DEFAULT 0,
  intelligence_grade TEXT, -- A, B, C, D, F
  actionable_conclusions JSONB DEFAULT '[]',
  recommended_collection_priorities JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.cognitive_warfare_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_defense_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deception_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vulnerability_windows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_trajectories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proportional_response_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mosaic_intelligence_fusion ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for all tables
CREATE POLICY "Users can manage their cognitive warfare operations"
ON public.cognitive_warfare_operations FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their active defense operations"
ON public.active_defense_operations FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their deception operations"
ON public.deception_operations FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their vulnerability windows"
ON public.vulnerability_windows FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their trust trajectories"
ON public.trust_trajectories FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their proportional response logs"
ON public.proportional_response_logs FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their mosaic intelligence fusion"
ON public.mosaic_intelligence_fusion FOR ALL USING (auth.uid() = user_id);

-- Service role policies for edge functions
CREATE POLICY "Service role can manage cognitive warfare operations"
ON public.cognitive_warfare_operations FOR ALL TO service_role WITH CHECK (true);

CREATE POLICY "Service role can manage active defense operations"
ON public.active_defense_operations FOR ALL TO service_role WITH CHECK (true);

CREATE POLICY "Service role can manage deception operations"
ON public.deception_operations FOR ALL TO service_role WITH CHECK (true);

CREATE POLICY "Service role can manage vulnerability windows"
ON public.vulnerability_windows FOR ALL TO service_role WITH CHECK (true);

CREATE POLICY "Service role can manage trust trajectories"
ON public.trust_trajectories FOR ALL TO service_role WITH CHECK (true);

CREATE POLICY "Service role can manage proportional response logs"
ON public.proportional_response_logs FOR ALL TO service_role WITH CHECK (true);

CREATE POLICY "Service role can manage mosaic intelligence fusion"
ON public.mosaic_intelligence_fusion FOR ALL TO service_role WITH CHECK (true);

-- Create updated_at triggers
CREATE TRIGGER update_cognitive_warfare_operations_updated_at
BEFORE UPDATE ON public.cognitive_warfare_operations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_active_defense_operations_updated_at
BEFORE UPDATE ON public.active_defense_operations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_deception_operations_updated_at
BEFORE UPDATE ON public.deception_operations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vulnerability_windows_updated_at
BEFORE UPDATE ON public.vulnerability_windows
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_proportional_response_logs_updated_at
BEFORE UPDATE ON public.proportional_response_logs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mosaic_intelligence_fusion_updated_at
BEFORE UPDATE ON public.mosaic_intelligence_fusion
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_cognitive_warfare_ops_profile ON public.cognitive_warfare_operations(profile_id);
CREATE INDEX idx_cognitive_warfare_ops_status ON public.cognitive_warfare_operations(status);
CREATE INDEX idx_active_defense_ops_profile ON public.active_defense_operations(profile_id);
CREATE INDEX idx_deception_ops_profile ON public.deception_operations(profile_id);
CREATE INDEX idx_vulnerability_windows_profile ON public.vulnerability_windows(profile_id);
CREATE INDEX idx_vulnerability_windows_status ON public.vulnerability_windows(current_status);
CREATE INDEX idx_trust_trajectories_profile ON public.trust_trajectories(profile_id);
CREATE INDEX idx_trust_trajectories_date ON public.trust_trajectories(trajectory_date);
CREATE INDEX idx_mosaic_fusion_profile ON public.mosaic_intelligence_fusion(profile_id);