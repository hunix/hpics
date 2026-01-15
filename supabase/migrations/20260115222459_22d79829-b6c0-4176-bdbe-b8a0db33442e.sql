-- ========================================
-- AGIS PHASE 6: TRANSCENDENT OPERATIONS
-- "Beyond Omniscience - Reality Engineering"
-- ========================================

-- ============================================
-- SECTION 1: REALITY ENGINEERING TABLES
-- Perception manipulation and narrative control
-- ============================================

-- Reality Perception Framework
CREATE TABLE public.reality_frameworks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id),
  framework_name TEXT NOT NULL,
  framework_type TEXT NOT NULL DEFAULT 'perception_shift', -- perception_shift, narrative_reframe, reality_tunnel, consensus_engineering
  current_reality_map JSONB DEFAULT '{}', -- Their current worldview
  target_reality_map JSONB DEFAULT '{}', -- Desired worldview
  transition_strategy JSONB DEFAULT '{}',
  anchor_points JSONB DEFAULT '[]', -- Experiences/beliefs used as anchors
  cognitive_load_score DECIMAL(5,2),
  resistance_patterns JSONB DEFAULT '[]',
  breakthrough_triggers JSONB DEFAULT '[]',
  progress_percentage DECIMAL(5,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Belief System Mapping
CREATE TABLE public.belief_architectures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id),
  core_beliefs JSONB DEFAULT '[]', -- Central identity beliefs
  supporting_beliefs JSONB DEFAULT '[]', -- Secondary reinforcing beliefs
  peripheral_beliefs JSONB DEFAULT '[]', -- Easily changed beliefs
  belief_dependencies JSONB DEFAULT '{}', -- Which beliefs support others
  vulnerability_map JSONB DEFAULT '{}', -- Weak points in belief structure
  update_triggers JSONB DEFAULT '[]', -- Events that could change beliefs
  protection_mechanisms JSONB DEFAULT '[]', -- Defense mechanisms
  last_major_shift TIMESTAMPTZ,
  stability_score DECIMAL(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- SECTION 2: TEMPORAL ORCHESTRATION TABLES
-- Time-based strategic coordination
-- ============================================

-- Temporal Coordination Matrix
CREATE TABLE public.temporal_orchestrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  orchestration_name TEXT NOT NULL,
  orchestration_type TEXT NOT NULL DEFAULT 'multi_vector', -- multi_vector, cascading, synchronized, delayed_impact
  target_profiles JSONB DEFAULT '[]',
  timeline_definition JSONB DEFAULT '{}', -- Full timeline with milestones
  synchronization_points JSONB DEFAULT '[]', -- When multiple actions must align
  contingency_branches JSONB DEFAULT '{}', -- Alternative paths
  current_position JSONB DEFAULT '{}',
  velocity_metrics JSONB DEFAULT '{}', -- Speed of progress
  trajectory_confidence DECIMAL(5,2),
  estimated_completion TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Moment Capture and Leverage
CREATE TABLE public.moment_captures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id),
  moment_type TEXT NOT NULL, -- crisis, opportunity, transition, vulnerability, peak_state
  capture_context JSONB DEFAULT '{}',
  emotional_state_snapshot JSONB DEFAULT '{}',
  leverage_potential DECIMAL(5,2),
  decay_rate DECIMAL(5,4), -- How fast the opportunity fades
  optimal_action_window JSONB DEFAULT '{}', -- When to act
  suggested_interventions JSONB DEFAULT '[]',
  was_leveraged BOOLEAN DEFAULT false,
  leverage_outcome JSONB,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- ============================================
-- SECTION 3: IDENTITY ENGINEERING TABLES
-- Deep identity manipulation capabilities
-- ============================================

-- Identity Blueprint Engineering
CREATE TABLE public.identity_blueprints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id),
  current_identity JSONB DEFAULT '{}', -- Who they think they are
  shadow_identity JSONB DEFAULT '{}', -- Hidden aspects
  aspirational_identity JSONB DEFAULT '{}', -- Who they want to be
  rejected_identity JSONB DEFAULT '{}', -- Who they refuse to be
  identity_conflicts JSONB DEFAULT '[]', -- Internal contradictions
  integration_opportunities JSONB DEFAULT '[]', -- Ways to resolve conflicts
  malleability_score DECIMAL(5,2), -- How changeable identity is
  anchor_experiences JSONB DEFAULT '[]', -- Formative experiences
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Narrative Identity Control
CREATE TABLE public.narrative_identities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id),
  life_narrative JSONB DEFAULT '{}', -- Their story of themselves
  narrative_themes JSONB DEFAULT '[]', -- Recurring patterns
  narrative_gaps JSONB DEFAULT '[]', -- Missing or avoided parts
  reframe_opportunities JSONB DEFAULT '[]', -- Ways to change the story
  protagonist_archetype TEXT,
  story_phase TEXT, -- hero_journey phase, tragedy arc, etc.
  narrative_momentum DECIMAL(5,2), -- Direction of story
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- SECTION 4: QUANTUM INFLUENCE TABLES
-- Multi-dimensional simultaneous operations
-- ============================================

-- Quantum State Management
CREATE TABLE public.quantum_states (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id),
  superposition_states JSONB DEFAULT '[]', -- Multiple potential states
  probability_amplitudes JSONB DEFAULT '{}', -- Likelihood of each state
  observation_effects JSONB DEFAULT '{}', -- How observation changes state
  entangled_profiles JSONB DEFAULT '[]', -- Profiles whose states are linked
  coherence_duration INTERVAL,
  decoherence_factors JSONB DEFAULT '[]',
  measurement_strategy JSONB DEFAULT '{}',
  collapsed_state JSONB,
  collapsed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Multi-Dimensional Operations
CREATE TABLE public.dimensional_operations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  operation_name TEXT NOT NULL,
  dimensions JSONB DEFAULT '[]', -- psychological, social, financial, temporal, etc.
  dimension_weights JSONB DEFAULT '{}', -- Importance of each
  cross_dimensional_effects JSONB DEFAULT '{}', -- How changes in one affect others
  optimization_target JSONB DEFAULT '{}',
  current_coordinates JSONB DEFAULT '{}',
  target_coordinates JSONB DEFAULT '{}',
  path_calculation JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- SECTION 5: COLLECTIVE CONSCIOUSNESS TABLES
-- Group mind and social field manipulation
-- ============================================

-- Collective Field Analysis
CREATE TABLE public.collective_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  field_name TEXT NOT NULL,
  field_type TEXT NOT NULL, -- family, organization, community, culture
  member_profiles JSONB DEFAULT '[]',
  field_dynamics JSONB DEFAULT '{}', -- Shared energy patterns
  collective_beliefs JSONB DEFAULT '[]',
  group_shadow JSONB DEFAULT '{}', -- Collective unconscious patterns
  field_strength DECIMAL(5,2),
  coherence_level DECIMAL(5,2),
  intervention_points JSONB DEFAULT '[]',
  field_evolution_trajectory JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Morphic Resonance Tracking
CREATE TABLE public.morphic_patterns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pattern_name TEXT NOT NULL,
  pattern_type TEXT NOT NULL, -- behavioral, emotional, belief, relational
  originating_profiles JSONB DEFAULT '[]',
  affected_profiles JSONB DEFAULT '[]',
  propagation_mechanism JSONB DEFAULT '{}',
  resonance_strength DECIMAL(5,2),
  decay_rate DECIMAL(5,4),
  amplification_opportunities JSONB DEFAULT '[]',
  disruption_methods JSONB DEFAULT '[]',
  first_detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_observed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- SECTION 6: TRANSCENDENCE METRICS TABLES
-- Meta-level operation tracking
-- ============================================

-- Transcendence Operations Log
CREATE TABLE public.transcendence_operations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  operation_type TEXT NOT NULL,
  operation_scope TEXT NOT NULL, -- individual, dyad, network, collective
  target_entities JSONB DEFAULT '[]',
  initial_state JSONB DEFAULT '{}',
  target_state JSONB DEFAULT '{}',
  transformation_vector JSONB DEFAULT '{}',
  resistance_encountered JSONB DEFAULT '[]',
  breakthrough_moments JSONB DEFAULT '[]',
  current_state JSONB DEFAULT '{}',
  completion_percentage DECIMAL(5,2) DEFAULT 0,
  success_metrics JSONB DEFAULT '{}',
  lessons_learned JSONB DEFAULT '[]',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);

-- Meta-Pattern Recognition
CREATE TABLE public.meta_patterns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pattern_name TEXT NOT NULL,
  abstraction_level INTEGER DEFAULT 1, -- 1-5, higher = more abstract
  constituent_patterns JSONB DEFAULT '[]', -- Lower-level patterns it's made of
  manifestation_contexts JSONB DEFAULT '[]',
  prediction_power DECIMAL(5,2), -- How well it predicts outcomes
  manipulation_leverage DECIMAL(5,2), -- How useful for influence
  discovery_method TEXT,
  validation_evidence JSONB DEFAULT '[]',
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_validated_at TIMESTAMPTZ
);

-- Enable RLS on all tables
ALTER TABLE public.reality_frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.belief_architectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.temporal_orchestrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moment_captures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.identity_blueprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.narrative_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quantum_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dimensional_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collective_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.morphic_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcendence_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_patterns ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for all Phase 6 tables
CREATE POLICY "Users can manage their reality frameworks" ON public.reality_frameworks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their belief architectures" ON public.belief_architectures FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their temporal orchestrations" ON public.temporal_orchestrations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their moment captures" ON public.moment_captures FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their identity blueprints" ON public.identity_blueprints FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their narrative identities" ON public.narrative_identities FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their quantum states" ON public.quantum_states FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their dimensional operations" ON public.dimensional_operations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their collective fields" ON public.collective_fields FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their morphic patterns" ON public.morphic_patterns FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their transcendence operations" ON public.transcendence_operations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their meta patterns" ON public.meta_patterns FOR ALL USING (auth.uid() = user_id);

-- Create indexes for Phase 6 tables
CREATE INDEX idx_reality_frameworks_user_profile ON public.reality_frameworks(user_id, profile_id);
CREATE INDEX idx_reality_frameworks_active ON public.reality_frameworks(user_id, is_active);
CREATE INDEX idx_belief_architectures_user_profile ON public.belief_architectures(user_id, profile_id);
CREATE INDEX idx_temporal_orchestrations_user_active ON public.temporal_orchestrations(user_id, is_active);
CREATE INDEX idx_moment_captures_user_profile ON public.moment_captures(user_id, profile_id);
CREATE INDEX idx_moment_captures_expires ON public.moment_captures(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_identity_blueprints_user_profile ON public.identity_blueprints(user_id, profile_id);
CREATE INDEX idx_narrative_identities_user_profile ON public.narrative_identities(user_id, profile_id);
CREATE INDEX idx_quantum_states_user_profile ON public.quantum_states(user_id, profile_id);
CREATE INDEX idx_dimensional_operations_user_active ON public.dimensional_operations(user_id, is_active);
CREATE INDEX idx_collective_fields_user ON public.collective_fields(user_id);
CREATE INDEX idx_morphic_patterns_user ON public.morphic_patterns(user_id);
CREATE INDEX idx_transcendence_operations_user_active ON public.transcendence_operations(user_id, is_active);
CREATE INDEX idx_meta_patterns_user_level ON public.meta_patterns(user_id, abstraction_level);