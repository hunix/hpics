-- v7.0 Extreme Intelligence Enhancement Suite - Database Migration

-- 1. Reflexive Control Detection
CREATE TABLE public.reflexive_control_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  detected_at TIMESTAMPTZ DEFAULT now(),
  rc_technique TEXT NOT NULL, -- 'motive_transmission', 'false_narrative', 'perception_management', 'disinformation', 'influence_operation'
  confidence_score NUMERIC(3,2) DEFAULT 0.5,
  source_communications UUID[] DEFAULT '{}',
  counter_strategy TEXT,
  detection_context JSONB DEFAULT '{}',
  indicators_found JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. IIO (Information Influence Operations) Attribution Scoring
CREATE TABLE public.iio_attributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  technical_evidence JSONB DEFAULT '{}',  -- IP, infrastructure, TTPs
  behavioral_evidence JSONB DEFAULT '{}', -- Campaign patterns, timing
  contextual_evidence JSONB DEFAULT '{}', -- Narrative alignment
  confidence_level TEXT DEFAULT 'amber', -- 'red', 'amber', 'green'
  overall_confidence NUMERIC(3,2) DEFAULT 0.5,
  attribution_chain JSONB DEFAULT '[]',
  campaign_indicators JSONB DEFAULT '{}',
  doppelganger_detection JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Stylometric Fingerprints (Authorship Attribution)
CREATE TABLE public.stylometric_fingerprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  sample_text TEXT,
  sample_source TEXT, -- 'email', 'message', 'document', 'social_post'
  burrows_delta NUMERIC(5,4),
  hapax_rate NUMERIC(5,4),
  burstiness_score NUMERIC(5,4),
  mattr_score NUMERIC(5,4),
  avg_sentence_length NUMERIC(6,2),
  lexical_density NUMERIC(5,4),
  vocabulary_richness NUMERIC(5,4),
  punctuation_patterns JSONB DEFAULT '{}',
  is_ai_generated BOOLEAN DEFAULT false,
  ai_model_predicted TEXT,
  ai_detection_confidence NUMERIC(3,2),
  authorship_match_id UUID,
  authorship_match_score NUMERIC(3,2),
  feature_vector JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Cognitive Effect Operations
CREATE TABLE public.cognitive_effect_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  effect_type TEXT NOT NULL, -- 'distrust', 'morale_decrease', 'decision_paralysis', 'perception_shift', 'behavioral_modification'
  biological_level NUMERIC(3,2) DEFAULT 0,    -- Nervous system effects
  psychological_level NUMERIC(3,2) DEFAULT 0, -- Interpretation/framing effects
  social_level NUMERIC(3,2) DEFAULT 0,        -- Cohesion/legitimacy effects
  ambiguity_window_start TIMESTAMPTZ,
  ambiguity_window_end TIMESTAMPTZ,
  narrative_synchronization_targets TEXT[] DEFAULT '{}',
  doctrine_applied TEXT, -- 'cognitive_effect', 'perception_management', 'information_dominance'
  effectiveness_metrics JSONB DEFAULT '{}',
  status TEXT DEFAULT 'planned', -- 'planned', 'active', 'paused', 'completed', 'aborted'
  execution_log JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Audio Burst Mental State Analysis
CREATE TABLE public.audio_burst_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voice_insight_id UUID REFERENCES public.voice_insights(id) ON DELETE SET NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  audio_file_url TEXT,
  hilbert_transform_data JSONB DEFAULT '{}',
  rhythmic_score NUMERIC(3,2) DEFAULT 0,  -- Higher = depressive patterns
  irregular_score NUMERIC(3,2) DEFAULT 0, -- Higher = anxiety patterns
  auc_integral NUMERIC(10,4),
  prosodic_features JSONB DEFAULT '{}',
  spectral_features JSONB DEFAULT '{}',
  mental_state_prediction TEXT,
  confidence NUMERIC(3,2) DEFAULT 0.5,
  analysis_version TEXT DEFAULT '1.0.0',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Adversary Mental Model (Kallisti-style Theory of Mind)
CREATE TABLE public.adversary_mental_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  model_version TEXT DEFAULT '1.0.0',
  basis_vectors JSONB DEFAULT '[]',
  situational_awareness_estimate JSONB DEFAULT '{}',
  belief_state JSONB DEFAULT '{}',
  strategy_distribution JSONB DEFAULT '{}',
  deception_susceptibility NUMERIC(3,2) DEFAULT 0.5,
  non_stationary_indicators JSONB DEFAULT '[]',
  prediction_accuracy_history JSONB DEFAULT '[]',
  last_calibrated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Collective Behavior Predictions (MAGICS-style)
CREATE TABLE public.collective_behavior_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  group_profile_ids UUID[] DEFAULT '{}',
  prediction_type TEXT NOT NULL, -- 'group_decision', 'collective_action', 'social_cascade', 'reflexive_response'
  reflexivity_index NUMERIC(3,2) DEFAULT 0.5, -- How much behavior changes when observed
  recursion_depth INTEGER DEFAULT 1,
  predicted_outcome JSONB DEFAULT '{}',
  confidence_interval JSONB DEFAULT '{}',
  causal_factors JSONB DEFAULT '[]',
  intervention_points JSONB DEFAULT '[]',
  temporal_window_start TIMESTAMPTZ,
  temporal_window_end TIMESTAMPTZ,
  outcome_realized BOOLEAN,
  outcome_accuracy NUMERIC(3,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.reflexive_control_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iio_attributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stylometric_fingerprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cognitive_effect_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audio_burst_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adversary_mental_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collective_behavior_predictions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reflexive_control_indicators
CREATE POLICY "Users can view their own reflexive control indicators" 
ON public.reflexive_control_indicators FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reflexive control indicators" 
ON public.reflexive_control_indicators FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reflexive control indicators" 
ON public.reflexive_control_indicators FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reflexive control indicators" 
ON public.reflexive_control_indicators FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for iio_attributions
CREATE POLICY "Users can view their own IIO attributions" 
ON public.iio_attributions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own IIO attributions" 
ON public.iio_attributions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own IIO attributions" 
ON public.iio_attributions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own IIO attributions" 
ON public.iio_attributions FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for stylometric_fingerprints
CREATE POLICY "Users can view their own stylometric fingerprints" 
ON public.stylometric_fingerprints FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own stylometric fingerprints" 
ON public.stylometric_fingerprints FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stylometric fingerprints" 
ON public.stylometric_fingerprints FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stylometric fingerprints" 
ON public.stylometric_fingerprints FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for cognitive_effect_operations
CREATE POLICY "Users can view their own cognitive effect operations" 
ON public.cognitive_effect_operations FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cognitive effect operations" 
ON public.cognitive_effect_operations FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cognitive effect operations" 
ON public.cognitive_effect_operations FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cognitive effect operations" 
ON public.cognitive_effect_operations FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for audio_burst_analyses
CREATE POLICY "Users can view their own audio burst analyses" 
ON public.audio_burst_analyses FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own audio burst analyses" 
ON public.audio_burst_analyses FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own audio burst analyses" 
ON public.audio_burst_analyses FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own audio burst analyses" 
ON public.audio_burst_analyses FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for adversary_mental_models
CREATE POLICY "Users can view their own adversary mental models" 
ON public.adversary_mental_models FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own adversary mental models" 
ON public.adversary_mental_models FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own adversary mental models" 
ON public.adversary_mental_models FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own adversary mental models" 
ON public.adversary_mental_models FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for collective_behavior_predictions
CREATE POLICY "Users can view their own collective behavior predictions" 
ON public.collective_behavior_predictions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own collective behavior predictions" 
ON public.collective_behavior_predictions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collective behavior predictions" 
ON public.collective_behavior_predictions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collective behavior predictions" 
ON public.collective_behavior_predictions FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_reflexive_control_profile ON public.reflexive_control_indicators(profile_id);
CREATE INDEX idx_reflexive_control_user ON public.reflexive_control_indicators(user_id);
CREATE INDEX idx_reflexive_control_technique ON public.reflexive_control_indicators(rc_technique);

CREATE INDEX idx_iio_attributions_profile ON public.iio_attributions(profile_id);
CREATE INDEX idx_iio_attributions_user ON public.iio_attributions(user_id);
CREATE INDEX idx_iio_attributions_confidence ON public.iio_attributions(confidence_level);

CREATE INDEX idx_stylometric_profile ON public.stylometric_fingerprints(profile_id);
CREATE INDEX idx_stylometric_user ON public.stylometric_fingerprints(user_id);
CREATE INDEX idx_stylometric_ai_generated ON public.stylometric_fingerprints(is_ai_generated);

CREATE INDEX idx_cognitive_effect_profile ON public.cognitive_effect_operations(profile_id);
CREATE INDEX idx_cognitive_effect_user ON public.cognitive_effect_operations(user_id);
CREATE INDEX idx_cognitive_effect_status ON public.cognitive_effect_operations(status);

CREATE INDEX idx_audio_burst_profile ON public.audio_burst_analyses(profile_id);
CREATE INDEX idx_audio_burst_user ON public.audio_burst_analyses(user_id);
CREATE INDEX idx_audio_burst_voice_insight ON public.audio_burst_analyses(voice_insight_id);

CREATE INDEX idx_adversary_mental_profile ON public.adversary_mental_models(profile_id);
CREATE INDEX idx_adversary_mental_user ON public.adversary_mental_models(user_id);

CREATE INDEX idx_collective_behavior_user ON public.collective_behavior_predictions(user_id);
CREATE INDEX idx_collective_behavior_type ON public.collective_behavior_predictions(prediction_type);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_reflexive_control_updated_at
BEFORE UPDATE ON public.reflexive_control_indicators
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_iio_attributions_updated_at
BEFORE UPDATE ON public.iio_attributions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cognitive_effect_updated_at
BEFORE UPDATE ON public.cognitive_effect_operations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_adversary_mental_updated_at
BEFORE UPDATE ON public.adversary_mental_models
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_collective_behavior_updated_at
BEFORE UPDATE ON public.collective_behavior_predictions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();