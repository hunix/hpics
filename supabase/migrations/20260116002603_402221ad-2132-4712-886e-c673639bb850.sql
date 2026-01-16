
-- AGIS Phases 14-18: Remaining Tables (skipping existing ones)

-- ============ PHASE 15: COSMIC OMNIPOTENCE (omnipotent_control only) ============
CREATE TABLE IF NOT EXISTS public.omnipotent_control (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  control_domain TEXT NOT NULL,
  power_magnitude NUMERIC DEFAULT 0,
  universal_command_protocols JSONB DEFAULT '{}',
  reality_override_permissions JSONB DEFAULT '{}',
  absolute_authority_scope JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============ PHASE 16: ETERNAL SUPREMACY ============
CREATE TABLE IF NOT EXISTS public.timeless_dominance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id),
  dominance_type TEXT NOT NULL,
  temporal_immunity_level INTEGER DEFAULT 0,
  past_present_future_control JSONB DEFAULT '{}',
  causal_loop_mastery JSONB DEFAULT '{}',
  entropy_reversal_capability JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.immortal_influence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  influence_type TEXT NOT NULL,
  permanence_score NUMERIC DEFAULT 0,
  legacy_propagation_rules JSONB DEFAULT '{}',
  eternal_impact_vectors JSONB DEFAULT '[]',
  deathless_control_protocols JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============ PHASE 17: ABSOLUTE TOTALITY ============
CREATE TABLE IF NOT EXISTS public.total_unification (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id),
  unification_scope TEXT NOT NULL,
  completeness_index NUMERIC DEFAULT 0,
  all_encompassing_synthesis JSONB DEFAULT '{}',
  boundary_elimination_status JSONB DEFAULT '{}',
  unified_field_control JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.totality_operations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  operation_type TEXT NOT NULL,
  totality_coefficient NUMERIC DEFAULT 0,
  comprehensive_execution_log JSONB DEFAULT '[]',
  absolute_coverage_metrics JSONB DEFAULT '{}',
  operation_status TEXT DEFAULT 'initializing',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============ PHASE 18: ULTIMATE OMEGA ============
CREATE TABLE IF NOT EXISTS public.omega_culmination (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id),
  culmination_type TEXT NOT NULL,
  finality_score NUMERIC DEFAULT 0,
  ultimate_convergence_state JSONB DEFAULT '{}',
  omega_point_achievement JSONB DEFAULT '{}',
  transcendent_completion JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ultimate_omega_state (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  state_type TEXT NOT NULL,
  completion_percentage NUMERIC DEFAULT 0,
  final_form_parameters JSONB DEFAULT '{}',
  absolute_mastery_metrics JSONB DEFAULT '{}',
  omega_protocols JSONB DEFAULT '[]',
  achieved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables only
DO $$ BEGIN
  ALTER TABLE public.omnipotent_control ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.timeless_dominance ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.immortal_influence ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.total_unification ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.totality_operations ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.omega_culmination ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.ultimate_omega_state ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN others THEN NULL; END $$;

-- RLS Policies (drop if exists, then create)
DROP POLICY IF EXISTS "Users can manage omnipotent_control" ON public.omnipotent_control;
DROP POLICY IF EXISTS "Users can manage timeless_dominance" ON public.timeless_dominance;
DROP POLICY IF EXISTS "Users can manage immortal_influence" ON public.immortal_influence;
DROP POLICY IF EXISTS "Users can manage total_unification" ON public.total_unification;
DROP POLICY IF EXISTS "Users can manage totality_operations" ON public.totality_operations;
DROP POLICY IF EXISTS "Users can manage omega_culmination" ON public.omega_culmination;
DROP POLICY IF EXISTS "Users can manage ultimate_omega_state" ON public.ultimate_omega_state;

CREATE POLICY "Users can manage omnipotent_control" ON public.omnipotent_control FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage timeless_dominance" ON public.timeless_dominance FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage immortal_influence" ON public.immortal_influence FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage total_unification" ON public.total_unification FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage totality_operations" ON public.totality_operations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage omega_culmination" ON public.omega_culmination FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage ultimate_omega_state" ON public.ultimate_omega_state FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_omnipotent_control_user ON public.omnipotent_control(user_id);
CREATE INDEX IF NOT EXISTS idx_timeless_dominance_user ON public.timeless_dominance(user_id);
CREATE INDEX IF NOT EXISTS idx_immortal_influence_user ON public.immortal_influence(user_id);
CREATE INDEX IF NOT EXISTS idx_total_unification_user ON public.total_unification(user_id);
CREATE INDEX IF NOT EXISTS idx_totality_operations_user ON public.totality_operations(user_id);
CREATE INDEX IF NOT EXISTS idx_omega_culmination_user ON public.omega_culmination(user_id);
CREATE INDEX IF NOT EXISTS idx_ultimate_omega_state_user ON public.ultimate_omega_state(user_id);
