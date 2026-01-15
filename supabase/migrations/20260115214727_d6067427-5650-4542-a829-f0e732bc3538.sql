-- AGIS Phase 5: Omniscient Command Database Schema

-- ============================================
-- AUTONOMOUS OPERATIONS TABLES
-- ============================================

-- Autonomous campaign configurations
CREATE TABLE IF NOT EXISTS public.autonomous_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id),
  campaign_name TEXT NOT NULL,
  campaign_type TEXT NOT NULL, -- 'influence', 'extraction', 'destabilization', 'conditioning'
  objective TEXT NOT NULL,
  trigger_conditions JSONB DEFAULT '{}',
  execution_rules JSONB DEFAULT '{}',
  escalation_config JSONB DEFAULT '{}',
  success_criteria JSONB DEFAULT '{}',
  current_phase TEXT DEFAULT 'dormant',
  phase_progress NUMERIC(5,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT false,
  auto_execute BOOLEAN DEFAULT false,
  max_daily_actions INTEGER DEFAULT 5,
  actions_today INTEGER DEFAULT 0,
  total_actions INTEGER DEFAULT 0,
  success_rate NUMERIC(5,4) DEFAULT 0,
  last_action_at TIMESTAMPTZ,
  next_action_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Agent execution logs
CREATE TABLE IF NOT EXISTS public.agent_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  campaign_id UUID REFERENCES public.autonomous_campaigns(id),
  agent_type TEXT NOT NULL, -- 'influence', 'extraction', 'monitor', 'intervene'
  action_taken TEXT NOT NULL,
  action_params JSONB DEFAULT '{}',
  trigger_reason TEXT,
  context_snapshot JSONB DEFAULT '{}',
  outcome TEXT, -- 'success', 'partial', 'failed', 'pending'
  outcome_details JSONB DEFAULT '{}',
  effectiveness_score NUMERIC(5,4),
  cost_cents INTEGER DEFAULT 0,
  execution_time_ms INTEGER,
  error_message TEXT,
  executed_at TIMESTAMPTZ DEFAULT now()
);

-- Outcome learning for self-optimization
CREATE TABLE IF NOT EXISTS public.outcome_learning_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  execution_id UUID REFERENCES public.agent_executions(id),
  campaign_id UUID REFERENCES public.autonomous_campaigns(id),
  action_type TEXT NOT NULL,
  context_features JSONB DEFAULT '{}',
  predicted_outcome NUMERIC(5,4),
  actual_outcome NUMERIC(5,4),
  prediction_error NUMERIC(5,4),
  learned_adjustments JSONB DEFAULT '{}',
  model_version TEXT,
  applied_to_future BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Escalation rules
CREATE TABLE IF NOT EXISTS public.escalation_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  campaign_id UUID REFERENCES public.autonomous_campaigns(id),
  rule_name TEXT NOT NULL,
  trigger_metric TEXT NOT NULL,
  threshold_value NUMERIC(10,4),
  comparison_operator TEXT DEFAULT '>=',
  escalation_action TEXT NOT NULL,
  escalation_params JSONB DEFAULT '{}',
  cooldown_hours INTEGER DEFAULT 24,
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  trigger_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- NETWORK WARFARE TABLES
-- ============================================

-- Influence cascades
CREATE TABLE IF NOT EXISTS public.influence_cascades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  cascade_name TEXT NOT NULL,
  origin_profile_id UUID REFERENCES public.profiles(id),
  cascade_type TEXT NOT NULL, -- 'narrative', 'behavioral', 'emotional', 'opinion'
  target_profiles UUID[] DEFAULT '{}',
  current_reach INTEGER DEFAULT 0,
  max_reach INTEGER,
  propagation_model TEXT DEFAULT 'sir', -- SIR, Bass, Threshold
  propagation_params JSONB DEFAULT '{}',
  current_phase TEXT DEFAULT 'seeding',
  infection_rate NUMERIC(5,4) DEFAULT 0,
  recovery_rate NUMERIC(5,4) DEFAULT 0,
  cascade_velocity NUMERIC(10,4) DEFAULT 0,
  predicted_peak_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Network operations
CREATE TABLE IF NOT EXISTS public.network_operations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  operation_name TEXT NOT NULL,
  operation_type TEXT NOT NULL, -- 'isolation', 'bridging', 'centralization', 'fragmentation'
  target_network JSONB DEFAULT '{}', -- network topology snapshot
  target_nodes UUID[] DEFAULT '{}',
  objective TEXT NOT NULL,
  current_phase TEXT DEFAULT 'planning',
  phase_details JSONB DEFAULT '{}',
  progress_metrics JSONB DEFAULT '{}',
  network_before JSONB DEFAULT '{}',
  network_after JSONB DEFAULT '{}',
  effectiveness_score NUMERIC(5,4),
  is_active BOOLEAN DEFAULT true,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Multi-target campaigns
CREATE TABLE IF NOT EXISTS public.multi_target_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  campaign_name TEXT NOT NULL,
  campaign_objective TEXT NOT NULL,
  target_profiles UUID[] DEFAULT '{}',
  coordination_strategy TEXT DEFAULT 'synchronized', -- 'synchronized', 'sequential', 'adaptive'
  timing_config JSONB DEFAULT '{}',
  per_target_tactics JSONB DEFAULT '{}',
  cross_target_effects JSONB DEFAULT '{}',
  current_phase TEXT DEFAULT 'initialization',
  overall_progress NUMERIC(5,2) DEFAULT 0,
  target_statuses JSONB DEFAULT '{}',
  synergy_score NUMERIC(5,4) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Cascade predictions
CREATE TABLE IF NOT EXISTS public.cascade_predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  cascade_id UUID REFERENCES public.influence_cascades(id),
  prediction_type TEXT NOT NULL, -- 'reach', 'timing', 'resistance', 'velocity'
  predicted_value JSONB NOT NULL,
  confidence_score NUMERIC(5,4),
  model_version TEXT,
  features_used JSONB DEFAULT '{}',
  actual_value JSONB,
  accuracy_score NUMERIC(5,4),
  validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- COUNTER-INTELLIGENCE TABLES
-- ============================================

-- Threat actors
CREATE TABLE IF NOT EXISTS public.threat_actors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  actor_name TEXT NOT NULL,
  actor_type TEXT NOT NULL, -- 'individual', 'organization', 'state', 'unknown'
  profile_id UUID REFERENCES public.profiles(id),
  threat_level TEXT DEFAULT 'unknown', -- 'low', 'medium', 'high', 'critical'
  capabilities JSONB DEFAULT '{}',
  known_tactics TEXT[] DEFAULT '{}',
  attributed_actions JSONB DEFAULT '{}',
  indicators_of_compromise JSONB DEFAULT '{}',
  network_affiliations UUID[] DEFAULT '{}',
  activity_pattern JSONB DEFAULT '{}',
  last_activity_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active', -- 'active', 'dormant', 'neutralized'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Manipulation detections
CREATE TABLE IF NOT EXISTS public.manipulation_detections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  detected_in_profile_id UUID REFERENCES public.profiles(id),
  source_actor_id UUID REFERENCES public.threat_actors(id),
  manipulation_type TEXT NOT NULL, -- 'gaslighting', 'love_bombing', 'isolation', 'devaluation', etc.
  detection_confidence NUMERIC(5,4),
  evidence JSONB DEFAULT '{}',
  affected_domains TEXT[] DEFAULT '{}',
  severity TEXT DEFAULT 'medium',
  timeline JSONB DEFAULT '{}',
  counter_measures JSONB DEFAULT '{}',
  is_ongoing BOOLEAN DEFAULT true,
  detected_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Defensive postures
CREATE TABLE IF NOT EXISTS public.defensive_postures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id),
  posture_type TEXT NOT NULL, -- 'information_control', 'social_shielding', 'counter_narrative'
  threat_model JSONB DEFAULT '{}',
  active_defenses JSONB DEFAULT '{}',
  monitoring_config JSONB DEFAULT '{}',
  alert_thresholds JSONB DEFAULT '{}',
  current_threat_level TEXT DEFAULT 'low',
  last_threat_assessment_at TIMESTAMPTZ,
  posture_effectiveness NUMERIC(5,4),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Counter operations
CREATE TABLE IF NOT EXISTS public.counter_operations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  operation_name TEXT NOT NULL,
  target_threat_id UUID REFERENCES public.threat_actors(id),
  operation_type TEXT NOT NULL, -- 'neutralize', 'deceive', 'redirect', 'expose'
  objective TEXT NOT NULL,
  tactics JSONB DEFAULT '{}',
  resources_allocated JSONB DEFAULT '{}',
  current_phase TEXT DEFAULT 'planning',
  phase_progress NUMERIC(5,2) DEFAULT 0,
  success_metrics JSONB DEFAULT '{}',
  outcome TEXT,
  outcome_details JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- PREDICTIVE INTERVENTION TABLES
-- ============================================

-- Opportunity windows
CREATE TABLE IF NOT EXISTS public.opportunity_windows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id),
  opportunity_type TEXT NOT NULL, -- 'influence', 'extraction', 'recruitment', 'intervention'
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  window_quality NUMERIC(5,4) DEFAULT 0.5,
  trigger_conditions JSONB DEFAULT '{}',
  recommended_actions JSONB DEFAULT '{}',
  success_probability NUMERIC(5,4),
  risk_factors JSONB DEFAULT '{}',
  auto_action_enabled BOOLEAN DEFAULT false,
  auto_action_config JSONB DEFAULT '{}',
  was_utilized BOOLEAN DEFAULT false,
  utilization_outcome JSONB,
  detected_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Trajectory intercepts
CREATE TABLE IF NOT EXISTS public.trajectory_intercepts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id),
  trajectory_type TEXT NOT NULL, -- 'relationship', 'career', 'emotional', 'financial'
  current_trajectory JSONB NOT NULL,
  predicted_trajectory JSONB NOT NULL,
  desired_trajectory JSONB NOT NULL,
  intercept_points JSONB DEFAULT '{}',
  intervention_plan JSONB DEFAULT '{}',
  current_deviation NUMERIC(10,4),
  correction_progress NUMERIC(5,2) DEFAULT 0,
  intercept_status TEXT DEFAULT 'monitoring', -- 'monitoring', 'intervening', 'corrected', 'failed'
  next_intercept_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Proactive actions
CREATE TABLE IF NOT EXISTS public.proactive_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id),
  action_type TEXT NOT NULL,
  trigger_prediction TEXT NOT NULL,
  prediction_confidence NUMERIC(5,4),
  action_taken TEXT NOT NULL,
  action_params JSONB DEFAULT '{}',
  timing_rationale TEXT,
  expected_outcome JSONB DEFAULT '{}',
  actual_outcome JSONB,
  outcome_match_score NUMERIC(5,4),
  preemption_success BOOLEAN,
  executed_at TIMESTAMPTZ DEFAULT now(),
  outcome_recorded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Intervention triggers
CREATE TABLE IF NOT EXISTS public.intervention_triggers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id),
  trigger_name TEXT NOT NULL,
  trigger_type TEXT NOT NULL, -- 'threshold', 'pattern', 'prediction', 'schedule'
  trigger_config JSONB NOT NULL,
  intervention_action TEXT NOT NULL,
  intervention_params JSONB DEFAULT '{}',
  priority INTEGER DEFAULT 5,
  cooldown_hours INTEGER DEFAULT 24,
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  trigger_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.autonomous_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outcome_learning_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escalation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influence_cascades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multi_target_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cascade_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.threat_actors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manipulation_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.defensive_postures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counter_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_windows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trajectory_intercepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proactive_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intervention_triggers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for all tables
CREATE POLICY "Users can manage own autonomous_campaigns" ON public.autonomous_campaigns FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own agent_executions" ON public.agent_executions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own outcome_learning_logs" ON public.outcome_learning_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own escalation_rules" ON public.escalation_rules FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own influence_cascades" ON public.influence_cascades FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own network_operations" ON public.network_operations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own multi_target_campaigns" ON public.multi_target_campaigns FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own cascade_predictions" ON public.cascade_predictions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own threat_actors" ON public.threat_actors FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own manipulation_detections" ON public.manipulation_detections FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own defensive_postures" ON public.defensive_postures FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own counter_operations" ON public.counter_operations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own opportunity_windows" ON public.opportunity_windows FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own trajectory_intercepts" ON public.trajectory_intercepts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own proactive_actions" ON public.proactive_actions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own intervention_triggers" ON public.intervention_triggers FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_autonomous_campaigns_user_active ON public.autonomous_campaigns(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_agent_executions_campaign ON public.agent_executions(campaign_id, executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_influence_cascades_user_active ON public.influence_cascades(user_id, current_phase);
CREATE INDEX IF NOT EXISTS idx_threat_actors_user_level ON public.threat_actors(user_id, threat_level);
CREATE INDEX IF NOT EXISTS idx_manipulation_detections_profile ON public.manipulation_detections(detected_in_profile_id, is_ongoing);
CREATE INDEX IF NOT EXISTS idx_opportunity_windows_profile_time ON public.opportunity_windows(profile_id, window_start, window_end);
CREATE INDEX IF NOT EXISTS idx_trajectory_intercepts_profile ON public.trajectory_intercepts(profile_id, intercept_status);
CREATE INDEX IF NOT EXISTS idx_intervention_triggers_active ON public.intervention_triggers(user_id, is_active);