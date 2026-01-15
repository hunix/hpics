
-- AGIS Phase 2: Absolute Superiority Schema

-- Attachment vulnerability profiles for emotional exploitation
CREATE TABLE public.attachment_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  attachment_style TEXT CHECK (attachment_style IN ('anxious', 'avoidant', 'disorganized', 'secure')),
  abandonment_sensitivity DECIMAL(3,2) DEFAULT 0.5,
  rejection_sensitivity DECIMAL(3,2) DEFAULT 0.5,
  ego_threat_sensitivity DECIMAL(3,2) DEFAULT 0.5,
  narcissistic_supply_need DECIMAL(3,2) DEFAULT 0.5,
  intermittent_reinforcement_susceptibility DECIMAL(3,2) DEFAULT 0.5,
  exploitation_playbook JSONB DEFAULT '{}',
  vulnerability_windows JSONB DEFAULT '[]',
  trigger_phrases TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Power base tracking (French-Raven)
CREATE TABLE public.power_base_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  coercive_power DECIMAL(3,2) DEFAULT 0,
  reward_power DECIMAL(3,2) DEFAULT 0,
  legitimate_power DECIMAL(3,2) DEFAULT 0,
  expert_power DECIMAL(3,2) DEFAULT 0,
  referent_power DECIMAL(3,2) DEFAULT 0,
  informational_power DECIMAL(3,2) DEFAULT 0,
  total_power_score DECIMAL(3,2) GENERATED ALWAYS AS (
    (coercive_power + reward_power + legitimate_power + expert_power + referent_power + informational_power) / 6
  ) STORED,
  leverage_points JSONB DEFAULT '[]',
  power_dynamics_history JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Chronotype profiles for timing intelligence
CREATE TABLE public.chronotype_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  chronotype TEXT CHECK (chronotype IN ('morning_lark', 'evening_owl', 'intermediate')),
  morningness_eveningness_score INTEGER,
  cognitive_peak_hours INTEGER[] DEFAULT ARRAY[9, 10, 11],
  cognitive_low_hours INTEGER[] DEFAULT ARRAY[14, 15],
  compliance_windows JSONB DEFAULT '{}',
  weekly_routine JSONB DEFAULT '{}',
  optimal_persuasion_times JSONB DEFAULT '{}',
  decision_fatigue_patterns JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Memory reconsolidation tracking
CREATE TABLE public.memory_interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_memory TEXT NOT NULL,
  memory_category TEXT,
  intervention_type TEXT CHECK (intervention_type IN ('reconsolidation', 'implantation', 'modification', 'erasure')),
  lability_window_start TIMESTAMPTZ,
  lability_window_end TIMESTAMPTZ,
  prediction_error_applied BOOLEAN DEFAULT false,
  prediction_error_content TEXT,
  success_score DECIMAL(3,2),
  follow_up_required BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tactical negotiation sessions
CREATE TABLE public.negotiation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_type TEXT,
  objectives JSONB DEFAULT '[]',
  fbi_tactics_used JSONB DEFAULT '[]',
  mirroring_instances JSONB DEFAULT '[]',
  labels_applied JSONB DEFAULT '[]',
  calibrated_questions JSONB DEFAULT '[]',
  accusation_audit JSONB DEFAULT '[]',
  evidence_strategy JSONB DEFAULT '{}',
  outcome TEXT,
  success_score DECIMAL(3,2),
  lessons_learned JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Network brokerage positions
CREATE TABLE public.network_brokerage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  brokerage_score DECIMAL(5,4) DEFAULT 0,
  constraint_score DECIMAL(5,4) DEFAULT 0,
  betweenness_centrality DECIMAL(5,4) DEFAULT 0,
  structural_holes_bridged INTEGER DEFAULT 0,
  disconnected_clusters JSONB DEFAULT '[]',
  bridge_opportunities JSONB DEFAULT '[]',
  tertius_gaudens_positions JSONB DEFAULT '[]',
  network_control_coefficient DECIMAL(3,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Choice architecture campaigns
CREATE TABLE public.nudge_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  campaign_name TEXT NOT NULL,
  nudge_type TEXT CHECK (nudge_type IN ('default', 'decoy', 'scarcity', 'social_proof', 'anchoring', 'framing', 'sludge')),
  target_behavior TEXT,
  nudge_config JSONB DEFAULT '{}',
  dark_patterns JSONB DEFAULT '[]',
  success_metrics JSONB DEFAULT '{}',
  conversion_rate DECIMAL(5,4),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Life trajectory predictions
CREATE TABLE public.life_trajectory_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  prediction_type TEXT,
  life_events_sequence JSONB DEFAULT '[]',
  predicted_outcomes JSONB DEFAULT '{}',
  career_trajectory JSONB DEFAULT '{}',
  relationship_trajectory JSONB DEFAULT '{}',
  financial_trajectory JSONB DEFAULT '{}',
  health_trajectory JSONB DEFAULT '{}',
  vulnerability_windows JSONB DEFAULT '[]',
  crisis_early_warnings JSONB DEFAULT '[]',
  confidence_score DECIMAL(3,2),
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Family systems analysis
CREATE TABLE public.family_system_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  family_structure JSONB DEFAULT '{}',
  triangulation_patterns JSONB DEFAULT '[]',
  enmeshment_score DECIMAL(3,2) DEFAULT 0.5,
  disengagement_score DECIMAL(3,2) DEFAULT 0.5,
  scapegoat_indicators JSONB DEFAULT '{}',
  golden_child_indicators JSONB DEFAULT '{}',
  parentification_score DECIMAL(3,2) DEFAULT 0,
  loyalty_conflicts JSONB DEFAULT '[]',
  boundary_violations JSONB DEFAULT '[]',
  intergenerational_patterns JSONB DEFAULT '[]',
  exploitation_opportunities JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Behavioral biometrics
CREATE TABLE public.behavioral_biometrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  keystroke_profile JSONB DEFAULT '{}',
  mouse_dynamics JSONB DEFAULT '{}',
  touch_pressure_patterns JSONB DEFAULT '{}',
  gait_signature JSONB DEFAULT '{}',
  cognitive_load_indicators JSONB DEFAULT '{}',
  stress_indicators JSONB DEFAULT '{}',
  fatigue_patterns JSONB DEFAULT '{}',
  emotional_state_markers JSONB DEFAULT '{}',
  exploitation_windows JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Financial psychology profiles
CREATE TABLE public.financial_psychology_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  loss_aversion_score DECIMAL(3,2) DEFAULT 0.5,
  endowment_effect_susceptibility DECIMAL(3,2) DEFAULT 0.5,
  sunk_cost_fallacy_susceptibility DECIMAL(3,2) DEFAULT 0.5,
  hyperbolic_discounting_rate DECIMAL(3,2) DEFAULT 0.5,
  mental_accounting_patterns JSONB DEFAULT '{}',
  anchoring_susceptibility DECIMAL(3,2) DEFAULT 0.5,
  optimal_anchor_range JSONB DEFAULT '{}',
  payment_pain_sensitivity DECIMAL(3,2) DEFAULT 0.5,
  negotiation_patterns JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.attachment_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.power_base_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chronotype_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.negotiation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_brokerage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nudge_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.life_trajectory_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_system_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.behavioral_biometrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_psychology_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for all tables
CREATE POLICY "Users can manage their own attachment_profiles" ON public.attachment_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own power_base_scores" ON public.power_base_scores FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own chronotype_profiles" ON public.chronotype_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own memory_interventions" ON public.memory_interventions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own negotiation_sessions" ON public.negotiation_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own network_brokerage" ON public.network_brokerage FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own nudge_campaigns" ON public.nudge_campaigns FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own life_trajectory_predictions" ON public.life_trajectory_predictions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own family_system_analyses" ON public.family_system_analyses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own behavioral_biometrics" ON public.behavioral_biometrics FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own financial_psychology_profiles" ON public.financial_psychology_profiles FOR ALL USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_attachment_profiles_profile ON public.attachment_profiles(profile_id);
CREATE INDEX idx_power_base_scores_profile ON public.power_base_scores(profile_id);
CREATE INDEX idx_chronotype_profiles_profile ON public.chronotype_profiles(profile_id);
CREATE INDEX idx_memory_interventions_profile ON public.memory_interventions(profile_id);
CREATE INDEX idx_negotiation_sessions_profile ON public.negotiation_sessions(profile_id);
CREATE INDEX idx_network_brokerage_profile ON public.network_brokerage(profile_id);
CREATE INDEX idx_nudge_campaigns_profile ON public.nudge_campaigns(profile_id);
CREATE INDEX idx_life_trajectory_profile ON public.life_trajectory_predictions(profile_id);
CREATE INDEX idx_family_system_profile ON public.family_system_analyses(profile_id);
CREATE INDEX idx_behavioral_biometrics_profile ON public.behavioral_biometrics(profile_id);
CREATE INDEX idx_financial_psychology_profile ON public.financial_psychology_profiles(profile_id);
