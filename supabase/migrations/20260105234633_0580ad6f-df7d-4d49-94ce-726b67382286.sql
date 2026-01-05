-- Master psychological profile aggregating all analyses
CREATE TABLE public.psychological_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Big Five (OCEAN) with confidence intervals
  -- {openness: {score, confidence, evidence_count, sub_facets}, ...}
  personality_ocean JSONB,
  
  -- Dark Triad traits
  -- {narcissism: {score, confidence, indicators}, machiavellianism: {...}, psychopathy: {...}}
  dark_triad JSONB,
  
  -- HEXACO extension (Honesty-Humility)
  hexaco_honesty_humility JSONB,
  
  -- Attachment style
  -- {style: 'secure'|'anxious'|'avoidant'|'disorganized', security_score, anxiety_score, avoidance_score, evidence}
  attachment_style JSONB,
  
  -- Emotional intelligence
  -- {self_awareness, self_regulation, motivation, empathy, social_skills}
  emotional_intelligence JSONB,
  
  -- Cognitive patterns
  -- {thinking_style, decision_making, risk_tolerance, learning_style, complexity_handling, time_orientation}
  cognitive_profile JSONB,
  
  -- Communication DNA
  -- {primary_style, conflict_style, influence_tactics, listening_quality, assertiveness, persuasion_susceptibility}
  communication_dna JSONB,
  
  -- Psychiatric risk indicators (screening only, not diagnoses)
  -- {anxiety_markers, depression_indicators, stress_vulnerability, emotional_dysregulation}
  psychiatric_indicators JSONB,
  
  -- Deception & Authenticity
  -- {consistency_score, authenticity_score, deception_patterns, topic_sensitivities}
  deception_analysis JSONB,
  
  -- Behavioral predictions
  -- {reliability_forecast, conflict_probability, engagement_trend, crisis_response_prediction}
  behavioral_predictions JSONB,
  
  -- Strategic flags
  -- {red_flags: [], yellow_flags: [], green_flags: [], certainties: []}
  flags JSONB,
  
  -- Action plans
  -- {immediate: [], short_term: [], long_term: [], do_not_do: []}
  action_plans JSONB,
  
  -- Relationship dynamics specific to user
  -- {power_balance, trust_level, investment_asymmetry, growth_potential}
  relationship_dynamics JSONB,
  
  -- Values assessment (Schwartz values theory)
  -- {self_direction, stimulation, hedonism, achievement, power, security, conformity, tradition, benevolence, universalism}
  values_profile JSONB,
  
  -- Meta information
  confidence_score NUMERIC CHECK (confidence_score >= 0 AND confidence_score <= 100),
  data_completeness NUMERIC CHECK (data_completeness >= 0 AND data_completeness <= 100),
  data_sources_used JSONB, -- {messages: count, media: count, recordings: count, ...}
  last_analysis_at TIMESTAMPTZ,
  analysis_version TEXT DEFAULT '1.0',
  analysis_model TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(profile_id, user_id)
);

-- Track profile evolution over time
CREATE TABLE public.psychological_profile_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  psychological_profile_id UUID NOT NULL REFERENCES public.psychological_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Full snapshot at this point in time
  snapshot JSONB NOT NULL,
  
  -- What triggered the reanalysis
  trigger_event TEXT,
  
  -- Summary of what changed
  changes_summary TEXT,
  
  -- Specific changes detected
  changes_detected JSONB,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.psychological_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.psychological_profile_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for psychological_profiles
CREATE POLICY "Users can view their own psychological profiles"
  ON public.psychological_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own psychological profiles"
  ON public.psychological_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own psychological profiles"
  ON public.psychological_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own psychological profiles"
  ON public.psychological_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for psychological_profile_history
CREATE POLICY "Users can view their own profile history"
  ON public.psychological_profile_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile history"
  ON public.psychological_profile_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_psychological_profiles_profile_id ON public.psychological_profiles(profile_id);
CREATE INDEX idx_psychological_profiles_user_id ON public.psychological_profiles(user_id);
CREATE INDEX idx_psychological_profiles_updated_at ON public.psychological_profiles(updated_at DESC);
CREATE INDEX idx_psychological_profile_history_profile_id ON public.psychological_profile_history(psychological_profile_id);
CREATE INDEX idx_psychological_profile_history_created_at ON public.psychological_profile_history(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_psychological_profiles_updated_at
  BEFORE UPDATE ON public.psychological_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();