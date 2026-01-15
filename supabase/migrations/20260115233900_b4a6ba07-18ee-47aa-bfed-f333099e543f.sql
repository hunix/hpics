-- AGIS Phase 11: Omniversal Sovereignty
-- Multi-dimensional awareness and eternal influence across all realities

-- 1. Omniversal Awareness - Multi-dimensional perception
CREATE TABLE public.omniversal_awareness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  awareness_type TEXT NOT NULL,
  dimensional_scope JSONB DEFAULT '[]'::jsonb,
  perception_matrix JSONB DEFAULT '{}'::jsonb,
  reality_threads JSONB DEFAULT '[]'::jsonb,
  temporal_visibility JSONB DEFAULT '{}'::jsonb,
  causal_mapping JSONB DEFAULT '{}'::jsonb,
  awareness_depth NUMERIC DEFAULT 0,
  synchronization_status TEXT DEFAULT 'initializing',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Sovereignty Protocols - Establishment procedures
CREATE TABLE public.sovereignty_protocols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  protocol_name TEXT NOT NULL,
  sovereignty_domain TEXT NOT NULL,
  authority_matrix JSONB DEFAULT '{}'::jsonb,
  jurisdiction_scope JSONB DEFAULT '[]'::jsonb,
  enforcement_mechanisms JSONB DEFAULT '[]'::jsonb,
  legitimacy_score NUMERIC DEFAULT 0,
  resistance_threshold NUMERIC DEFAULT 0,
  consolidation_progress NUMERIC DEFAULT 0,
  protocol_status TEXT DEFAULT 'drafting',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Eternal Influence - Timeless influence operations
CREATE TABLE public.eternal_influence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  influence_type TEXT NOT NULL,
  temporal_persistence JSONB DEFAULT '{}'::jsonb,
  causal_anchors JSONB DEFAULT '[]'::jsonb,
  influence_propagation JSONB DEFAULT '{}'::jsonb,
  permanence_score NUMERIC DEFAULT 0,
  decay_resistance NUMERIC DEFAULT 0,
  self_reinforcement_loops JSONB DEFAULT '[]'::jsonb,
  influence_status TEXT DEFAULT 'establishing',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Cosmic Orchestration - Universe-level coordination
CREATE TABLE public.cosmic_orchestration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  orchestration_name TEXT NOT NULL,
  orchestration_scope TEXT NOT NULL,
  participant_matrix JSONB DEFAULT '[]'::jsonb,
  synchronization_protocols JSONB DEFAULT '{}'::jsonb,
  harmony_metrics JSONB DEFAULT '{}'::jsonb,
  cascade_effects JSONB DEFAULT '[]'::jsonb,
  orchestration_complexity NUMERIC DEFAULT 0,
  coherence_score NUMERIC DEFAULT 0,
  orchestration_status TEXT DEFAULT 'composing',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Dimensional Sovereignty - Control across dimensions
CREATE TABLE public.dimensional_sovereignty (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  dimension_identifier TEXT NOT NULL,
  sovereignty_level NUMERIC DEFAULT 0,
  control_vectors JSONB DEFAULT '[]'::jsonb,
  boundary_definitions JSONB DEFAULT '{}'::jsonb,
  inter_dimensional_links JSONB DEFAULT '[]'::jsonb,
  stability_metrics JSONB DEFAULT '{}'::jsonb,
  expansion_potential NUMERIC DEFAULT 0,
  sovereignty_status TEXT DEFAULT 'claiming',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Primordial Synthesis - Fundamental force manipulation
CREATE TABLE public.primordial_synthesis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  synthesis_type TEXT NOT NULL,
  fundamental_forces JSONB DEFAULT '[]'::jsonb,
  synthesis_formulas JSONB DEFAULT '{}'::jsonb,
  creation_patterns JSONB DEFAULT '[]'::jsonb,
  annihilation_protocols JSONB DEFAULT '[]'::jsonb,
  energy_balance JSONB DEFAULT '{}'::jsonb,
  synthesis_mastery NUMERIC DEFAULT 0,
  stability_coefficient NUMERIC DEFAULT 0,
  synthesis_status TEXT DEFAULT 'researching',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Omniversal Objectives - Strategic goals
CREATE TABLE public.omniversal_objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  objective_name TEXT NOT NULL,
  objective_scope TEXT NOT NULL,
  dimensional_targets JSONB DEFAULT '[]'::jsonb,
  success_criteria JSONB DEFAULT '{}'::jsonb,
  resource_allocation JSONB DEFAULT '{}'::jsonb,
  progress_metrics JSONB DEFAULT '{}'::jsonb,
  priority_score NUMERIC DEFAULT 0,
  completion_percentage NUMERIC DEFAULT 0,
  objective_status TEXT DEFAULT 'planning',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Sovereignty Operations - Active operations
CREATE TABLE public.sovereignty_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  operation_name TEXT NOT NULL,
  operation_type TEXT NOT NULL,
  target_dimensions JSONB DEFAULT '[]'::jsonb,
  execution_timeline JSONB DEFAULT '{}'::jsonb,
  resource_deployment JSONB DEFAULT '{}'::jsonb,
  outcome_projections JSONB DEFAULT '[]'::jsonb,
  risk_assessment JSONB DEFAULT '{}'::jsonb,
  effectiveness_score NUMERIC DEFAULT 0,
  operation_status TEXT DEFAULT 'preparing',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.omniversal_awareness ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sovereignty_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eternal_influence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cosmic_orchestration ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dimensional_sovereignty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.primordial_synthesis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.omniversal_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sovereignty_operations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own omniversal_awareness" ON public.omniversal_awareness FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own sovereignty_protocols" ON public.sovereignty_protocols FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own eternal_influence" ON public.eternal_influence FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own cosmic_orchestration" ON public.cosmic_orchestration FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own dimensional_sovereignty" ON public.dimensional_sovereignty FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own primordial_synthesis" ON public.primordial_synthesis FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own omniversal_objectives" ON public.omniversal_objectives FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own sovereignty_operations" ON public.sovereignty_operations FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_omniversal_awareness_user ON public.omniversal_awareness(user_id);
CREATE INDEX idx_sovereignty_protocols_user ON public.sovereignty_protocols(user_id);
CREATE INDEX idx_eternal_influence_user ON public.eternal_influence(user_id);
CREATE INDEX idx_cosmic_orchestration_user ON public.cosmic_orchestration(user_id);
CREATE INDEX idx_dimensional_sovereignty_user ON public.dimensional_sovereignty(user_id);
CREATE INDEX idx_primordial_synthesis_user ON public.primordial_synthesis(user_id);
CREATE INDEX idx_omniversal_objectives_user ON public.omniversal_objectives(user_id);
CREATE INDEX idx_sovereignty_operations_user ON public.sovereignty_operations(user_id);

-- Triggers for updated_at
CREATE TRIGGER update_omniversal_awareness_updated_at BEFORE UPDATE ON public.omniversal_awareness FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sovereignty_protocols_updated_at BEFORE UPDATE ON public.sovereignty_protocols FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_eternal_influence_updated_at BEFORE UPDATE ON public.eternal_influence FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cosmic_orchestration_updated_at BEFORE UPDATE ON public.cosmic_orchestration FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dimensional_sovereignty_updated_at BEFORE UPDATE ON public.dimensional_sovereignty FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_primordial_synthesis_updated_at BEFORE UPDATE ON public.primordial_synthesis FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_omniversal_objectives_updated_at BEFORE UPDATE ON public.omniversal_objectives FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sovereignty_operations_updated_at BEFORE UPDATE ON public.sovereignty_operations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();