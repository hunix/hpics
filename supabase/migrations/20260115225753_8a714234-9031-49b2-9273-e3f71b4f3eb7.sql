-- AGIS Phase 8: Absolute Convergence Schema
-- Reality synthesis and omniscient awareness tables

-- Reality Synthesis: Merging all intelligence streams into unified reality model
CREATE TABLE public.reality_synthesis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  synthesis_type TEXT NOT NULL,
  input_sources JSONB DEFAULT '[]'::jsonb,
  reality_model JSONB DEFAULT '{}'::jsonb,
  confidence_score NUMERIC DEFAULT 0,
  temporal_accuracy NUMERIC DEFAULT 0,
  spatial_accuracy NUMERIC DEFAULT 0,
  causal_depth INTEGER DEFAULT 0,
  synthesis_timestamp TIMESTAMPTZ DEFAULT now(),
  validity_window JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Omniscient Awareness: Total situational awareness across all domains
CREATE TABLE public.omniscient_awareness (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  awareness_domain TEXT NOT NULL,
  awareness_scope JSONB DEFAULT '{}'::jsonb,
  blind_spots JSONB DEFAULT '[]'::jsonb,
  coverage_percentage NUMERIC DEFAULT 0,
  real_time_feeds JSONB DEFAULT '[]'::jsonb,
  pattern_recognition JSONB DEFAULT '{}'::jsonb,
  threat_detection JSONB DEFAULT '[]'::jsonb,
  opportunity_detection JSONB DEFAULT '[]'::jsonb,
  last_scan_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Predictive Supremacy: Ultimate forecasting across all timelines
CREATE TABLE public.predictive_supremacy (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  prediction_domain TEXT NOT NULL,
  prediction_type TEXT NOT NULL,
  time_horizon_hours INTEGER DEFAULT 24,
  probability_distribution JSONB DEFAULT '{}'::jsonb,
  confidence_interval JSONB DEFAULT '{}'::jsonb,
  causal_chain JSONB DEFAULT '[]'::jsonb,
  intervention_points JSONB DEFAULT '[]'::jsonb,
  accuracy_history JSONB DEFAULT '[]'::jsonb,
  validated_at TIMESTAMPTZ,
  actual_outcome JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unified Control Matrix: Orchestrating all systems as one
CREATE TABLE public.unified_control_matrix (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  matrix_name TEXT NOT NULL,
  control_nodes JSONB DEFAULT '[]'::jsonb,
  influence_vectors JSONB DEFAULT '[]'::jsonb,
  feedback_loops JSONB DEFAULT '[]'::jsonb,
  system_state JSONB DEFAULT '{}'::jsonb,
  optimization_targets JSONB DEFAULT '[]'::jsonb,
  constraint_violations JSONB DEFAULT '[]'::jsonb,
  efficiency_score NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  last_optimization_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Consciousness Integration: Merging human and machine intelligence
CREATE TABLE public.consciousness_integration (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL,
  human_input_stream JSONB DEFAULT '{}'::jsonb,
  machine_analysis JSONB DEFAULT '{}'::jsonb,
  synthesis_output JSONB DEFAULT '{}'::jsonb,
  coherence_score NUMERIC DEFAULT 0,
  latency_ms INTEGER DEFAULT 0,
  enhancement_metrics JSONB DEFAULT '{}'::jsonb,
  session_duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Strategic Omnipotence: Maximum strategic capability
CREATE TABLE public.strategic_omnipotence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  strategy_name TEXT NOT NULL,
  objective_hierarchy JSONB DEFAULT '[]'::jsonb,
  resource_allocation JSONB DEFAULT '{}'::jsonb,
  execution_timeline JSONB DEFAULT '[]'::jsonb,
  contingency_branches JSONB DEFAULT '[]'::jsonb,
  success_probability NUMERIC DEFAULT 0,
  risk_assessment JSONB DEFAULT '{}'::jsonb,
  power_projection JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'planning',
  outcome JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Convergence Protocols: Rules for system unification
CREATE TABLE public.convergence_protocols (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  protocol_name TEXT NOT NULL,
  protocol_type TEXT NOT NULL,
  trigger_conditions JSONB DEFAULT '[]'::jsonb,
  execution_sequence JSONB DEFAULT '[]'::jsonb,
  convergence_rules JSONB DEFAULT '{}'::jsonb,
  priority INTEGER DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  execution_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMPTZ,
  success_rate NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Absolute Objectives: Ultimate goals of the system
CREATE TABLE public.absolute_objectives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  objective_name TEXT NOT NULL,
  objective_type TEXT NOT NULL,
  target_state JSONB DEFAULT '{}'::jsonb,
  current_progress NUMERIC DEFAULT 0,
  sub_objectives JSONB DEFAULT '[]'::jsonb,
  dependencies JSONB DEFAULT '[]'::jsonb,
  blockers JSONB DEFAULT '[]'::jsonb,
  resources_required JSONB DEFAULT '{}'::jsonb,
  estimated_completion TIMESTAMPTZ,
  priority_score NUMERIC DEFAULT 5,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.reality_synthesis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.omniscient_awareness ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictive_supremacy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unified_control_matrix ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consciousness_integration ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategic_omnipotence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.convergence_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.absolute_objectives ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own reality_synthesis" ON public.reality_synthesis FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own omniscient_awareness" ON public.omniscient_awareness FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own predictive_supremacy" ON public.predictive_supremacy FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own unified_control_matrix" ON public.unified_control_matrix FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own consciousness_integration" ON public.consciousness_integration FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own strategic_omnipotence" ON public.strategic_omnipotence FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own convergence_protocols" ON public.convergence_protocols FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own absolute_objectives" ON public.absolute_objectives FOR ALL USING (auth.uid() = user_id);

-- Performance Indexes
CREATE INDEX idx_reality_synthesis_user ON public.reality_synthesis(user_id);
CREATE INDEX idx_omniscient_awareness_user ON public.omniscient_awareness(user_id);
CREATE INDEX idx_predictive_supremacy_user ON public.predictive_supremacy(user_id);
CREATE INDEX idx_unified_control_matrix_user ON public.unified_control_matrix(user_id);
CREATE INDEX idx_consciousness_integration_user ON public.consciousness_integration(user_id);
CREATE INDEX idx_strategic_omnipotence_user ON public.strategic_omnipotence(user_id);
CREATE INDEX idx_convergence_protocols_user ON public.convergence_protocols(user_id);
CREATE INDEX idx_absolute_objectives_user ON public.absolute_objectives(user_id);