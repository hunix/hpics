-- AGIS Phase 7: Unified Singularity Schema
-- Meta-learning, cross-phase orchestration, and emergent intelligence

-- 1. Meta-Learning System - Self-evolving strategy patterns
CREATE TABLE public.meta_learning_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  model_name TEXT NOT NULL,
  model_type TEXT NOT NULL DEFAULT 'strategy_optimizer',
  learning_domain TEXT NOT NULL,
  training_data_sources JSONB DEFAULT '[]',
  model_parameters JSONB DEFAULT '{}',
  performance_metrics JSONB DEFAULT '{}',
  accuracy_score NUMERIC(5,4),
  last_trained_at TIMESTAMPTZ,
  training_iterations INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Cross-Phase Operations - Unified command across all AGIS phases
CREATE TABLE public.cross_phase_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  operation_name TEXT NOT NULL,
  operation_type TEXT NOT NULL,
  phases_involved TEXT[] DEFAULT '{}',
  phase_objectives JSONB DEFAULT '{}',
  synchronization_rules JSONB DEFAULT '{}',
  execution_timeline JSONB DEFAULT '{}',
  status TEXT DEFAULT 'planning',
  success_probability NUMERIC(5,4),
  resource_allocation JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  outcome_analysis JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Emergence Patterns - Detecting new patterns from system convergence
CREATE TABLE public.emergence_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pattern_name TEXT NOT NULL,
  pattern_type TEXT NOT NULL,
  source_domains TEXT[] DEFAULT '{}',
  pattern_signature JSONB NOT NULL,
  detection_confidence NUMERIC(5,4),
  novelty_score NUMERIC(5,4),
  strategic_value NUMERIC(5,4),
  exploitation_strategies JSONB DEFAULT '[]',
  first_detected_at TIMESTAMPTZ DEFAULT now(),
  occurrence_count INTEGER DEFAULT 1,
  last_observed_at TIMESTAMPTZ DEFAULT now(),
  is_validated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Singularity Objectives - High-level strategic goals
CREATE TABLE public.singularity_objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  objective_name TEXT NOT NULL,
  objective_type TEXT NOT NULL DEFAULT 'strategic',
  priority_level INTEGER DEFAULT 5,
  target_profiles UUID[] DEFAULT '{}',
  success_criteria JSONB NOT NULL,
  constraint_parameters JSONB DEFAULT '{}',
  sub_objectives JSONB DEFAULT '[]',
  progress_percentage NUMERIC(5,2) DEFAULT 0,
  estimated_completion TIMESTAMPTZ,
  resource_requirements JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Unified Intelligence Feed - Real-time aggregated intelligence
CREATE TABLE public.unified_intelligence_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  intelligence_type TEXT NOT NULL,
  source_phase TEXT NOT NULL,
  source_module TEXT NOT NULL,
  priority_score NUMERIC(5,4) DEFAULT 0.5,
  content JSONB NOT NULL,
  actionable_insights TEXT[] DEFAULT '{}',
  related_objectives UUID[] DEFAULT '{}',
  expires_at TIMESTAMPTZ,
  is_processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Strategic Synthesis - Combined strategic recommendations
CREATE TABLE public.strategic_synthesis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  synthesis_type TEXT NOT NULL,
  input_sources JSONB NOT NULL,
  synthesized_strategy JSONB NOT NULL,
  confidence_score NUMERIC(5,4),
  risk_assessment JSONB DEFAULT '{}',
  resource_efficiency NUMERIC(5,4),
  timeline_projection JSONB DEFAULT '{}',
  alternative_strategies JSONB DEFAULT '[]',
  recommendation_rank INTEGER,
  status TEXT DEFAULT 'proposed',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. System Evolution Log - Tracking self-improvement
CREATE TABLE public.system_evolution_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  evolution_type TEXT NOT NULL,
  affected_components TEXT[] DEFAULT '{}',
  before_state JSONB,
  after_state JSONB,
  improvement_metrics JSONB DEFAULT '{}',
  trigger_reason TEXT,
  autonomous BOOLEAN DEFAULT false,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  applied_at TIMESTAMPTZ,
  rollback_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Convergence Events - When multiple phases align
CREATE TABLE public.convergence_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  converging_phases TEXT[] NOT NULL,
  convergence_type TEXT NOT NULL,
  trigger_conditions JSONB NOT NULL,
  synergy_multiplier NUMERIC(5,2) DEFAULT 1.0,
  opportunity_window JSONB,
  recommended_actions JSONB DEFAULT '[]',
  detected_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active',
  outcome JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.meta_learning_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cross_phase_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergence_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.singularity_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unified_intelligence_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategic_synthesis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_evolution_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.convergence_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their meta_learning_models" ON public.meta_learning_models FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their cross_phase_operations" ON public.cross_phase_operations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their emergence_patterns" ON public.emergence_patterns FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their singularity_objectives" ON public.singularity_objectives FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their unified_intelligence_feed" ON public.unified_intelligence_feed FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their strategic_synthesis" ON public.strategic_synthesis FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their system_evolution_log" ON public.system_evolution_log FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their convergence_events" ON public.convergence_events FOR ALL USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_meta_learning_models_user ON public.meta_learning_models(user_id);
CREATE INDEX idx_cross_phase_operations_user ON public.cross_phase_operations(user_id);
CREATE INDEX idx_cross_phase_operations_status ON public.cross_phase_operations(status);
CREATE INDEX idx_emergence_patterns_user ON public.emergence_patterns(user_id);
CREATE INDEX idx_singularity_objectives_user ON public.singularity_objectives(user_id);
CREATE INDEX idx_singularity_objectives_status ON public.singularity_objectives(status);
CREATE INDEX idx_unified_intelligence_feed_user ON public.unified_intelligence_feed(user_id);
CREATE INDEX idx_unified_intelligence_feed_priority ON public.unified_intelligence_feed(priority_score DESC);
CREATE INDEX idx_strategic_synthesis_user ON public.strategic_synthesis(user_id);
CREATE INDEX idx_system_evolution_log_user ON public.system_evolution_log(user_id);
CREATE INDEX idx_convergence_events_user ON public.convergence_events(user_id);
CREATE INDEX idx_convergence_events_status ON public.convergence_events(status);