-- Phase 1: Future Timeline Engine Tables
CREATE TABLE IF NOT EXISTS public.future_predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id),
  prediction_type TEXT NOT NULL,
  predicted_event TEXT NOT NULL,
  probability_score NUMERIC DEFAULT 0,
  confidence_interval JSONB DEFAULT '{}',
  predicted_date_range JSONB DEFAULT '{}',
  supporting_evidence JSONB DEFAULT '[]',
  influencing_factors JSONB DEFAULT '[]',
  intervention_opportunities JSONB DEFAULT '[]',
  status TEXT DEFAULT 'active',
  outcome_recorded JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.prediction_models (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  model_name TEXT NOT NULL,
  model_type TEXT NOT NULL,
  model_config JSONB DEFAULT '{}',
  training_data_stats JSONB DEFAULT '{}',
  accuracy_metrics JSONB DEFAULT '{}',
  last_trained_at TIMESTAMP WITH TIME ZONE,
  prediction_count INTEGER DEFAULT 0,
  successful_predictions INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.decision_windows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id),
  window_type TEXT NOT NULL,
  window_name TEXT NOT NULL,
  starts_at TIMESTAMP WITH TIME ZONE,
  ends_at TIMESTAMP WITH TIME ZONE,
  urgency_score NUMERIC DEFAULT 0,
  influence_potential NUMERIC DEFAULT 0,
  recommended_actions JSONB DEFAULT '[]',
  context_factors JSONB DEFAULT '{}',
  status TEXT DEFAULT 'upcoming',
  intervention_taken JSONB,
  outcome JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.timeline_interventions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id),
  prediction_id UUID REFERENCES public.future_predictions(id),
  decision_window_id UUID REFERENCES public.decision_windows(id),
  intervention_type TEXT NOT NULL,
  action_taken TEXT NOT NULL,
  timing TEXT,
  expected_outcome JSONB DEFAULT '{}',
  actual_outcome JSONB,
  effectiveness_score NUMERIC,
  lessons_learned JSONB DEFAULT '[]',
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Phase 2: Self-Evolving Campaign Engine Tables
CREATE TABLE IF NOT EXISTS public.campaign_genomes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  genome_name TEXT NOT NULL,
  generation INTEGER DEFAULT 1,
  parent_genome_id UUID REFERENCES public.campaign_genomes(id),
  strategy_dna JSONB DEFAULT '{}',
  tactics_genes JSONB DEFAULT '[]',
  timing_patterns JSONB DEFAULT '{}',
  channel_weights JSONB DEFAULT '{}',
  fitness_score NUMERIC DEFAULT 0,
  survival_count INTEGER DEFAULT 0,
  mutation_history JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.campaign_evolution (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  evolution_run_id TEXT NOT NULL,
  generation_number INTEGER DEFAULT 1,
  population_size INTEGER DEFAULT 0,
  best_fitness NUMERIC DEFAULT 0,
  average_fitness NUMERIC DEFAULT 0,
  diversity_index NUMERIC DEFAULT 0,
  surviving_genomes JSONB DEFAULT '[]',
  mutations_applied JSONB DEFAULT '[]',
  crossovers_performed INTEGER DEFAULT 0,
  selection_pressure NUMERIC DEFAULT 0.5,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.strategy_mutations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  genome_id UUID REFERENCES public.campaign_genomes(id),
  mutation_type TEXT NOT NULL,
  original_value JSONB,
  mutated_value JSONB,
  fitness_delta NUMERIC DEFAULT 0,
  adoption_rate NUMERIC DEFAULT 0,
  success_examples JSONB DEFAULT '[]',
  discovered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Phase 3: Dark Web Intelligence Tables
CREATE TABLE IF NOT EXISTS public.dark_web_mentions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id),
  mention_source TEXT NOT NULL,
  source_type TEXT DEFAULT 'forum',
  content_snippet TEXT,
  full_content TEXT,
  threat_score NUMERIC DEFAULT 0,
  relevance_score NUMERIC DEFAULT 0,
  entities_mentioned JSONB DEFAULT '[]',
  context_analysis JSONB DEFAULT '{}',
  source_credibility NUMERIC DEFAULT 0,
  first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.credential_exposures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id),
  exposure_type TEXT NOT NULL,
  affected_service TEXT,
  exposure_severity TEXT DEFAULT 'medium',
  credential_types JSONB DEFAULT '[]',
  breach_source TEXT,
  breach_date TIMESTAMP WITH TIME ZONE,
  data_exposed JSONB DEFAULT '{}',
  remediation_status TEXT DEFAULT 'unresolved',
  remediation_actions JSONB DEFAULT '[]',
  discovered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.underground_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id),
  activity_type TEXT NOT NULL,
  platform TEXT,
  activity_details JSONB DEFAULT '{}',
  risk_assessment JSONB DEFAULT '{}',
  financial_indicators JSONB DEFAULT '{}',
  connections_detected JSONB DEFAULT '[]',
  monitoring_priority TEXT DEFAULT 'normal',
  last_activity_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.threat_intelligence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id),
  threat_type TEXT NOT NULL,
  threat_name TEXT,
  threat_level TEXT DEFAULT 'medium',
  threat_vector JSONB DEFAULT '{}',
  indicators_of_compromise JSONB DEFAULT '[]',
  attack_patterns JSONB DEFAULT '[]',
  mitigation_strategies JSONB DEFAULT '[]',
  intel_sources JSONB DEFAULT '[]',
  confidence_score NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  first_detected_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Phase 4: Micro-Expression Combat System Tables
CREATE TABLE IF NOT EXISTS public.microexpression_readings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id),
  session_id TEXT,
  timestamp_ms BIGINT,
  facs_action_units JSONB DEFAULT '{}',
  detected_emotions JSONB DEFAULT '[]',
  micro_expressions JSONB DEFAULT '[]',
  duration_ms INTEGER,
  intensity_score NUMERIC DEFAULT 0,
  context TEXT,
  frame_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.deception_signatures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id),
  signature_type TEXT NOT NULL,
  signature_pattern JSONB DEFAULT '{}',
  baseline_comparison JSONB DEFAULT '{}',
  confidence_score NUMERIC DEFAULT 0,
  occurrence_count INTEGER DEFAULT 1,
  context_triggers JSONB DEFAULT '[]',
  detection_accuracy NUMERIC DEFAULT 0,
  last_detected_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.stress_indicators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id),
  indicator_type TEXT NOT NULL,
  measurement_value NUMERIC,
  baseline_value NUMERIC,
  deviation_percent NUMERIC,
  trend_direction TEXT,
  associated_triggers JSONB DEFAULT '[]',
  health_implications JSONB DEFAULT '{}',
  recommendations JSONB DEFAULT '[]',
  measured_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.behavioral_fingerprints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id),
  fingerprint_type TEXT NOT NULL,
  fingerprint_data JSONB DEFAULT '{}',
  uniqueness_score NUMERIC DEFAULT 0,
  stability_score NUMERIC DEFAULT 0,
  components JSONB DEFAULT '[]',
  verification_samples INTEGER DEFAULT 0,
  last_verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Phase 5: Narrative Control Engine Tables
CREATE TABLE IF NOT EXISTS public.narrative_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  campaign_name TEXT NOT NULL,
  campaign_type TEXT NOT NULL,
  target_narrative TEXT,
  counter_narratives JSONB DEFAULT '[]',
  deployment_channels JSONB DEFAULT '[]',
  content_strategy JSONB DEFAULT '{}',
  amplification_config JSONB DEFAULT '{}',
  success_metrics JSONB DEFAULT '{}',
  current_reach INTEGER DEFAULT 0,
  sentiment_shift NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'planning',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.narrative_nodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  campaign_id UUID REFERENCES public.narrative_campaigns(id),
  node_type TEXT NOT NULL,
  content TEXT,
  persona_config JSONB DEFAULT '{}',
  platform TEXT,
  engagement_metrics JSONB DEFAULT '{}',
  amplification_score NUMERIC DEFAULT 0,
  authenticity_rating NUMERIC DEFAULT 0,
  connections JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.perception_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id),
  campaign_id UUID REFERENCES public.narrative_campaigns(id),
  perception_dimension TEXT NOT NULL,
  baseline_value NUMERIC,
  current_value NUMERIC,
  target_value NUMERIC,
  measurement_method TEXT,
  data_sources JSONB DEFAULT '[]',
  trend_analysis JSONB DEFAULT '{}',
  influencing_factors JSONB DEFAULT '[]',
  measured_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.synthetic_relationships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id),
  persona_name TEXT NOT NULL,
  persona_config JSONB DEFAULT '{}',
  relationship_type TEXT,
  relationship_depth TEXT DEFAULT 'acquaintance',
  interaction_history JSONB DEFAULT '[]',
  trust_level NUMERIC DEFAULT 0,
  influence_achieved JSONB DEFAULT '{}',
  objectives JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.future_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prediction_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decision_windows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeline_interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_genomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_evolution ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategy_mutations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dark_web_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credential_exposures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.underground_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.threat_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.microexpression_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deception_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stress_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.behavioral_fingerprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.narrative_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.narrative_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perception_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.synthetic_relationships ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for all tables
CREATE POLICY "Users can manage their future_predictions" ON public.future_predictions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their prediction_models" ON public.prediction_models FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their decision_windows" ON public.decision_windows FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their timeline_interventions" ON public.timeline_interventions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their campaign_genomes" ON public.campaign_genomes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their campaign_evolution" ON public.campaign_evolution FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their strategy_mutations" ON public.strategy_mutations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their dark_web_mentions" ON public.dark_web_mentions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their credential_exposures" ON public.credential_exposures FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their underground_activity" ON public.underground_activity FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their threat_intelligence" ON public.threat_intelligence FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their microexpression_readings" ON public.microexpression_readings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their deception_signatures" ON public.deception_signatures FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their stress_indicators" ON public.stress_indicators FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their behavioral_fingerprints" ON public.behavioral_fingerprints FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their narrative_campaigns" ON public.narrative_campaigns FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their narrative_nodes" ON public.narrative_nodes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their perception_tracking" ON public.perception_tracking FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their synthetic_relationships" ON public.synthetic_relationships FOR ALL USING (auth.uid() = user_id);

-- Enable realtime for critical tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.future_predictions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.decision_windows;
ALTER PUBLICATION supabase_realtime ADD TABLE public.dark_web_mentions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.credential_exposures;