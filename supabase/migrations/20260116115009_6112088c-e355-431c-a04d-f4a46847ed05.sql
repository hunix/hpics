-- AGIS Phase 19: Unified Supremacy - Global State & Cascade Tables

-- Global AGIS state tracking across all phases
CREATE TABLE IF NOT EXISTS public.agis_global_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  phase_health_scores JSONB DEFAULT '{}',
  cross_phase_correlations JSONB DEFAULT '{}',
  active_objectives JSONB DEFAULT '[]',
  system_readiness_score NUMERIC DEFAULT 0,
  total_operations_count INTEGER DEFAULT 0,
  success_rate NUMERIC DEFAULT 0,
  last_synthesis_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Cross-phase cascade events
CREATE TABLE IF NOT EXISTS public.agis_cascade_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  trigger_phase INTEGER NOT NULL,
  trigger_event_type TEXT NOT NULL,
  trigger_source_id UUID,
  cascade_path JSONB DEFAULT '[]',
  affected_phases INTEGER[] DEFAULT '{}',
  outcome_status TEXT DEFAULT 'pending',
  execution_log JSONB DEFAULT '[]',
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Phase synergy tracking
CREATE TABLE IF NOT EXISTS public.agis_phase_synergies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  phase_a INTEGER NOT NULL,
  phase_b INTEGER NOT NULL,
  synergy_score NUMERIC DEFAULT 0,
  synergy_type TEXT DEFAULT 'complementary',
  interaction_count INTEGER DEFAULT 0,
  successful_cascades INTEGER DEFAULT 0,
  last_interaction_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, phase_a, phase_b)
);

-- Cascade automation rules
CREATE TABLE IF NOT EXISTS public.agis_cascade_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rule_name TEXT NOT NULL,
  source_phase INTEGER NOT NULL,
  source_table TEXT NOT NULL,
  trigger_condition JSONB NOT NULL,
  target_phase INTEGER NOT NULL,
  target_action TEXT NOT NULL,
  action_params JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 50,
  cooldown_minutes INTEGER DEFAULT 5,
  last_triggered_at TIMESTAMPTZ,
  trigger_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- AGIS analytics metrics
CREATE TABLE IF NOT EXISTS public.agis_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  phase INTEGER NOT NULL,
  metric_type TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_metadata JSONB DEFAULT '{}',
  recorded_at TIMESTAMPTZ DEFAULT now()
);

-- Objective tracking across phases
CREATE TABLE IF NOT EXISTS public.agis_objective_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  objective_name TEXT NOT NULL,
  objective_type TEXT DEFAULT 'strategic',
  starting_phase INTEGER NOT NULL,
  current_phase INTEGER NOT NULL,
  phase_progression JSONB DEFAULT '[]',
  completion_percentage NUMERIC DEFAULT 0,
  target_outcome JSONB DEFAULT '{}',
  achieved_outcomes JSONB DEFAULT '[]',
  blockers JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.agis_global_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agis_cascade_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agis_phase_synergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agis_cascade_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agis_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agis_objective_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own agis_global_state" ON public.agis_global_state FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own agis_cascade_events" ON public.agis_cascade_events FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own agis_phase_synergies" ON public.agis_phase_synergies FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own agis_cascade_rules" ON public.agis_cascade_rules FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own agis_analytics" ON public.agis_analytics FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own agis_objective_tracking" ON public.agis_objective_tracking FOR ALL USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_agis_global_state_user ON public.agis_global_state(user_id);
CREATE INDEX IF NOT EXISTS idx_agis_cascade_events_user_phase ON public.agis_cascade_events(user_id, trigger_phase);
CREATE INDEX IF NOT EXISTS idx_agis_cascade_events_status ON public.agis_cascade_events(outcome_status);
CREATE INDEX IF NOT EXISTS idx_agis_phase_synergies_user ON public.agis_phase_synergies(user_id);
CREATE INDEX IF NOT EXISTS idx_agis_cascade_rules_user_active ON public.agis_cascade_rules(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_agis_analytics_user_phase ON public.agis_analytics(user_id, phase, recorded_at);
CREATE INDEX IF NOT EXISTS idx_agis_objective_tracking_user_active ON public.agis_objective_tracking(user_id, is_active);

-- Enable realtime for cascade events
ALTER PUBLICATION supabase_realtime ADD TABLE public.agis_cascade_events;