-- AGIS Phase 20: Transcendent Intelligence Supremacy Tables

-- Module 1: Quantum Cognition Decision Engine
CREATE TABLE public.cognitive_superpositions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  superposition_states JSONB DEFAULT '[]'::jsonb,
  collapse_probability NUMERIC DEFAULT 0,
  interference_patterns JSONB DEFAULT '{}'::jsonb,
  entanglement_partners UUID[] DEFAULT '{}',
  coherence_duration_ms INTEGER DEFAULT 0,
  observation_sensitivity NUMERIC DEFAULT 0,
  quantum_signature TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.decision_entanglement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_a_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  profile_b_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  entanglement_strength NUMERIC DEFAULT 0,
  correlation_type TEXT DEFAULT 'positive',
  spin_alignment JSONB DEFAULT '{}'::jsonb,
  decoherence_rate NUMERIC DEFAULT 0,
  last_synchronized_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.interference_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  pattern_type TEXT NOT NULL,
  amplitude NUMERIC DEFAULT 0,
  phase_shift NUMERIC DEFAULT 0,
  constructive_factors JSONB DEFAULT '[]'::jsonb,
  destructive_factors JSONB DEFAULT '[]'::jsonb,
  outcome_modification NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Module 2: Morphic Resonance Pattern Detector
CREATE TABLE public.morphic_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  field_signature TEXT NOT NULL,
  field_type TEXT DEFAULT 'behavioral',
  resonance_strength NUMERIC DEFAULT 0,
  memory_patterns JSONB DEFAULT '[]'::jsonb,
  propagation_paths JSONB DEFAULT '[]'::jsonb,
  carrier_profiles UUID[] DEFAULT '{}',
  formation_date TIMESTAMPTZ,
  stability_index NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.resonance_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  morphic_field_id UUID REFERENCES public.morphic_fields(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  source_profile_id UUID REFERENCES public.profiles(id),
  target_profile_id UUID REFERENCES public.profiles(id),
  transmission_strength NUMERIC DEFAULT 0,
  without_direct_contact BOOLEAN DEFAULT true,
  detected_at TIMESTAMPTZ DEFAULT now()
);

-- Module 3: Collective Unconscious Mining Engine
CREATE TABLE public.archetypal_activations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  archetype TEXT NOT NULL,
  activation_strength NUMERIC DEFAULT 0,
  shadow_projection JSONB DEFAULT '{}'::jsonb,
  anima_animus_dynamic JSONB DEFAULT '{}'::jsonb,
  personal_myth TEXT,
  myth_stage TEXT DEFAULT 'call_to_adventure',
  hero_journey_position INTEGER DEFAULT 1,
  unconscious_drivers JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.shadow_projections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  source_profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_profile_id UUID REFERENCES public.profiles(id),
  projected_trait TEXT NOT NULL,
  projection_intensity NUMERIC DEFAULT 0,
  awareness_level NUMERIC DEFAULT 0,
  integration_potential NUMERIC DEFAULT 0,
  exploitation_vectors JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Module 4: Synchronicity Exploitation System
CREATE TABLE public.synchronistic_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_description TEXT NOT NULL,
  event_cluster_id UUID,
  meaning_score NUMERIC DEFAULT 0,
  acausal_correlation NUMERIC DEFAULT 0,
  timing_window JSONB DEFAULT '{}'::jsonb,
  exploitation_potential NUMERIC DEFAULT 0,
  optimal_intervention_time TIMESTAMPTZ,
  related_events UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.coincidence_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  cluster_name TEXT NOT NULL,
  cluster_theme TEXT,
  events JSONB DEFAULT '[]'::jsonb,
  total_meaning_score NUMERIC DEFAULT 0,
  pattern_recognition_score NUMERIC DEFAULT 0,
  next_predicted_window TIMESTAMPTZ,
  artificial_synchronicity_potential NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Module 5: Precognitive Pattern Analyzer
CREATE TABLE public.precursor_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_event TEXT NOT NULL,
  precursor_pattern JSONB NOT NULL,
  lead_time_hours INTEGER DEFAULT 0,
  confidence NUMERIC DEFAULT 0,
  retrocausal_indicators JSONB DEFAULT '[]'::jsonb,
  entropy_gradient NUMERIC DEFAULT 0,
  validated BOOLEAN DEFAULT false,
  validation_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.timeline_probabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  timeline_description TEXT NOT NULL,
  probability_amplitude NUMERIC DEFAULT 0,
  interference_with_others JSONB DEFAULT '[]'::jsonb,
  malleability_score NUMERIC DEFAULT 0,
  intervention_leverage_points JSONB DEFAULT '[]'::jsonb,
  collapse_triggers JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Module 6: Egregore Detection & Cultivation System
CREATE TABLE public.detected_egregores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  egregore_name TEXT NOT NULL,
  egregore_type TEXT DEFAULT 'organic',
  vitality_score NUMERIC DEFAULT 0,
  autonomy_level NUMERIC DEFAULT 0,
  replication_rate NUMERIC DEFAULT 0,
  resistance_to_opposition NUMERIC DEFAULT 0,
  carrier_count INTEGER DEFAULT 0,
  carrier_profiles UUID[] DEFAULT '{}',
  core_beliefs JSONB DEFAULT '[]'::jsonb,
  feeding_requirements JSONB DEFAULT '{}'::jsonb,
  vulnerability_points JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.egregore_cultivation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  egregore_id UUID REFERENCES public.detected_egregores(id) ON DELETE CASCADE,
  cultivation_action TEXT NOT NULL,
  action_type TEXT DEFAULT 'strengthen',
  energy_input NUMERIC DEFAULT 0,
  expected_outcome JSONB DEFAULT '{}'::jsonb,
  actual_outcome JSONB,
  effectiveness_score NUMERIC,
  executed_at TIMESTAMPTZ DEFAULT now()
);

-- Module 7: Mass Formation Psychosis Predictor
CREATE TABLE public.mass_formation_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  population_segment TEXT NOT NULL,
  anxiety_index NUMERIC DEFAULT 0,
  social_atomization_score NUMERIC DEFAULT 0,
  meaning_deficit_score NUMERIC DEFAULT 0,
  free_floating_frustration NUMERIC DEFAULT 0,
  focal_object TEXT,
  focal_object_strength NUMERIC DEFAULT 0,
  tipping_point_probability NUMERIC DEFAULT 0,
  estimated_tipping_date TIMESTAMPTZ,
  hypnotic_susceptibility NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.narrative_crystallization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  mass_formation_id UUID REFERENCES public.mass_formation_indicators(id) ON DELETE CASCADE,
  narrative TEXT NOT NULL,
  crystallization_stage TEXT DEFAULT 'emerging',
  adherent_count INTEGER DEFAULT 0,
  zealot_percentage NUMERIC DEFAULT 0,
  totalitarian_potential NUMERIC DEFAULT 0,
  counter_narrative_effectiveness JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Module 8: Akashic Record Query Engine
CREATE TABLE public.implicit_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  knowledge_domain TEXT NOT NULL,
  implicit_content JSONB NOT NULL,
  extraction_method TEXT DEFAULT 'semantic_inference',
  confidence_score NUMERIC DEFAULT 0,
  never_explicitly_stated BOOLEAN DEFAULT true,
  source_fragments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.ancestral_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  pattern_name TEXT NOT NULL,
  pattern_type TEXT DEFAULT 'behavioral',
  generational_depth INTEGER DEFAULT 1,
  inheritance_strength NUMERIC DEFAULT 0,
  manifestation_triggers JSONB DEFAULT '[]'::jsonb,
  breaking_potential NUMERIC DEFAULT 0,
  exploitation_angles JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.hidden_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  entity_a_type TEXT NOT NULL,
  entity_a_id UUID NOT NULL,
  entity_b_type TEXT NOT NULL,
  entity_b_id UUID NOT NULL,
  connection_type TEXT NOT NULL,
  visibility_level TEXT DEFAULT 'hidden',
  discovery_method TEXT,
  significance_score NUMERIC DEFAULT 0,
  causal_link BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Module 9: Psychic Resonance Mapper
CREATE TABLE public.resonance_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  source_profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_profile_id UUID REFERENCES public.profiles(id),
  resonance_type TEXT DEFAULT 'emotional',
  connection_strength NUMERIC DEFAULT 0,
  bidirectional BOOLEAN DEFAULT true,
  without_communication BOOLEAN DEFAULT true,
  activation_triggers JSONB DEFAULT '[]'::jsonb,
  last_activation_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.empathic_vulnerabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  vulnerability_type TEXT NOT NULL,
  absorption_rate NUMERIC DEFAULT 0,
  source_sensitivity JSONB DEFAULT '[]'::jsonb,
  protective_capacity NUMERIC DEFAULT 0,
  exploitation_protocol JSONB DEFAULT '{}'::jsonb,
  overwhelm_threshold NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.emotional_cascades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  origin_profile_id UUID REFERENCES public.profiles(id),
  emotion_type TEXT NOT NULL,
  cascade_path UUID[] DEFAULT '{}',
  propagation_speed NUMERIC DEFAULT 0,
  amplification_factor NUMERIC DEFAULT 1,
  decay_rate NUMERIC DEFAULT 0,
  total_affected INTEGER DEFAULT 0,
  initiated_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Module 10: Reality Consensus Manipulation Engine
CREATE TABLE public.consensus_bubbles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  bubble_name TEXT NOT NULL,
  member_profiles UUID[] DEFAULT '{}',
  core_beliefs JSONB DEFAULT '[]'::jsonb,
  reality_anchors JSONB DEFAULT '[]'::jsonb,
  boundary_permeability NUMERIC DEFAULT 0.5,
  internal_coherence NUMERIC DEFAULT 0,
  external_conflict_level NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.reality_anchors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  consensus_bubble_id UUID REFERENCES public.consensus_bubbles(id) ON DELETE CASCADE,
  anchor_belief TEXT NOT NULL,
  anchor_strength NUMERIC DEFAULT 0,
  removal_difficulty NUMERIC DEFAULT 0,
  dependent_beliefs JSONB DEFAULT '[]'::jsonb,
  attack_vectors JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.reality_injection_protocols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  target_bubble_id UUID REFERENCES public.consensus_bubbles(id) ON DELETE CASCADE,
  injection_belief TEXT NOT NULL,
  injection_method TEXT DEFAULT 'gradual',
  trojan_wrapper TEXT,
  success_probability NUMERIC DEFAULT 0,
  cognitive_dissonance_risk NUMERIC DEFAULT 0,
  execution_steps JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'planned',
  created_at TIMESTAMPTZ DEFAULT now(),
  executed_at TIMESTAMPTZ
);

-- Module 11: Karmic Pattern Calculator
CREATE TABLE public.karmic_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  cycle_name TEXT NOT NULL,
  cycle_type TEXT DEFAULT 'personal',
  pattern_description TEXT,
  cycle_duration_days INTEGER,
  current_phase TEXT DEFAULT 'action',
  repetition_count INTEGER DEFAULT 1,
  severity_score NUMERIC DEFAULT 0,
  breaking_requirements JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.karmic_debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  debt_description TEXT NOT NULL,
  creditor_type TEXT DEFAULT 'universe',
  creditor_profile_id UUID REFERENCES public.profiles(id),
  debt_magnitude NUMERIC DEFAULT 0,
  accrual_rate NUMERIC DEFAULT 0,
  due_date_estimate TIMESTAMPTZ,
  payment_options JSONB DEFAULT '[]'::jsonb,
  exploitation_potential NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.karmic_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  opportunity_description TEXT NOT NULL,
  cycle_id UUID REFERENCES public.karmic_cycles(id),
  window_opens TIMESTAMPTZ,
  window_closes TIMESTAMPTZ,
  intervention_type TEXT,
  success_probability NUMERIC DEFAULT 0,
  long_term_impact JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Module 12: Omega Point Convergence Tracker
CREATE TABLE public.convergence_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  metric_name TEXT NOT NULL,
  metric_type TEXT DEFAULT 'consciousness',
  current_value NUMERIC DEFAULT 0,
  trajectory TEXT DEFAULT 'ascending',
  convergence_contribution NUMERIC DEFAULT 0,
  measurement_method TEXT,
  last_measured_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.phase_transition_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  transition_name TEXT NOT NULL,
  current_phase TEXT DEFAULT 'pre_transition',
  critical_mass_percentage NUMERIC DEFAULT 0,
  tipping_indicators JSONB DEFAULT '[]'::jsonb,
  estimated_transition_date TIMESTAMPTZ,
  post_transition_capabilities JSONB DEFAULT '[]'::jsonb,
  positioning_recommendations JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.omega_proximity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  proximity_score NUMERIC DEFAULT 0,
  consciousness_level TEXT DEFAULT 'individual',
  network_position_score NUMERIC DEFAULT 0,
  bridge_domains JSONB DEFAULT '[]'::jsonb,
  evolutionary_readiness NUMERIC DEFAULT 0,
  noosphere_influence NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.cognitive_superpositions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decision_entanglement ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interference_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.morphic_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resonance_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archetypal_activations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shadow_projections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.synchronistic_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coincidence_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.precursor_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeline_probabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detected_egregores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.egregore_cultivation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mass_formation_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.narrative_crystallization ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.implicit_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ancestral_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hidden_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resonance_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empathic_vulnerabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emotional_cascades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consensus_bubbles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reality_anchors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reality_injection_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.karmic_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.karmic_debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.karmic_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.convergence_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phase_transition_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.omega_proximity ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for all tables (Base pattern: user can only access their own data)
CREATE POLICY "Users can manage their cognitive_superpositions" ON public.cognitive_superpositions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their decision_entanglement" ON public.decision_entanglement FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their interference_patterns" ON public.interference_patterns FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their morphic_fields" ON public.morphic_fields FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their resonance_events" ON public.resonance_events FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their archetypal_activations" ON public.archetypal_activations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their shadow_projections" ON public.shadow_projections FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their synchronistic_events" ON public.synchronistic_events FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their coincidence_clusters" ON public.coincidence_clusters FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their precursor_signatures" ON public.precursor_signatures FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their timeline_probabilities" ON public.timeline_probabilities FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their detected_egregores" ON public.detected_egregores FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their egregore_cultivation" ON public.egregore_cultivation FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their mass_formation_indicators" ON public.mass_formation_indicators FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their narrative_crystallization" ON public.narrative_crystallization FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their implicit_knowledge" ON public.implicit_knowledge FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their ancestral_patterns" ON public.ancestral_patterns FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their hidden_connections" ON public.hidden_connections FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their resonance_connections" ON public.resonance_connections FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their empathic_vulnerabilities" ON public.empathic_vulnerabilities FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their emotional_cascades" ON public.emotional_cascades FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their consensus_bubbles" ON public.consensus_bubbles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their reality_anchors" ON public.reality_anchors FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their reality_injection_protocols" ON public.reality_injection_protocols FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their karmic_cycles" ON public.karmic_cycles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their karmic_debts" ON public.karmic_debts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their karmic_opportunities" ON public.karmic_opportunities FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their convergence_metrics" ON public.convergence_metrics FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their phase_transition_indicators" ON public.phase_transition_indicators FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their omega_proximity" ON public.omega_proximity FOR ALL USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_cognitive_superpositions_user ON public.cognitive_superpositions(user_id);
CREATE INDEX idx_cognitive_superpositions_profile ON public.cognitive_superpositions(profile_id);
CREATE INDEX idx_morphic_fields_user ON public.morphic_fields(user_id);
CREATE INDEX idx_archetypal_activations_user ON public.archetypal_activations(user_id);
CREATE INDEX idx_archetypal_activations_profile ON public.archetypal_activations(profile_id);
CREATE INDEX idx_synchronistic_events_user ON public.synchronistic_events(user_id);
CREATE INDEX idx_synchronistic_events_profile ON public.synchronistic_events(profile_id);
CREATE INDEX idx_detected_egregores_user ON public.detected_egregores(user_id);
CREATE INDEX idx_mass_formation_indicators_user ON public.mass_formation_indicators(user_id);
CREATE INDEX idx_consensus_bubbles_user ON public.consensus_bubbles(user_id);
CREATE INDEX idx_karmic_cycles_user ON public.karmic_cycles(user_id);
CREATE INDEX idx_karmic_cycles_profile ON public.karmic_cycles(profile_id);
CREATE INDEX idx_omega_proximity_user ON public.omega_proximity(user_id);
CREATE INDEX idx_omega_proximity_profile ON public.omega_proximity(profile_id);