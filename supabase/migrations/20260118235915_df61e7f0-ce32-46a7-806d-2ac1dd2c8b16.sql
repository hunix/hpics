-- Create temporal_predictions table for TFT forecasts
CREATE TABLE IF NOT EXISTS public.temporal_predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id),
  prediction_type TEXT NOT NULL,
  time_horizon_days INTEGER NOT NULL DEFAULT 30,
  quantile_low NUMERIC,
  quantile_mid NUMERIC,
  quantile_high NUMERIC,
  confidence_interval NUMERIC,
  trigger_conditions JSONB DEFAULT '[]'::jsonb,
  static_features JSONB DEFAULT '{}'::jsonb,
  dynamic_features JSONB DEFAULT '{}'::jsonb,
  variable_importance JSONB DEFAULT '{}'::jsonb,
  prediction_metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create digital_twins table for behavioral replicas
CREATE TABLE IF NOT EXISTS public.digital_twins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id),
  twin_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  calibration_accuracy NUMERIC DEFAULT 0,
  last_calibration_at TIMESTAMP WITH TIME ZONE,
  simulation_history JSONB DEFAULT '[]'::jsonb,
  smga_state JSONB DEFAULT '{}'::jsonb,
  divergence_alerts JSONB DEFAULT '[]'::jsonb,
  behavioral_parameters JSONB DEFAULT '{}'::jsonb,
  generative_augmentations JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create knowledge_graph_nodes for GraphRAG
CREATE TABLE IF NOT EXISTS public.knowledge_graph_nodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  node_type TEXT NOT NULL,
  node_label TEXT NOT NULL,
  properties JSONB DEFAULT '{}'::jsonb,
  embedding_vector JSONB,
  community_id INTEGER,
  centrality_score NUMERIC DEFAULT 0,
  pagerank_score NUMERIC DEFAULT 0,
  betweenness_score NUMERIC DEFAULT 0,
  source_entity_id UUID,
  source_entity_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create knowledge_graph_edges for GraphRAG relationships
CREATE TABLE IF NOT EXISTS public.knowledge_graph_edges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  source_node_id UUID REFERENCES public.knowledge_graph_nodes(id) ON DELETE CASCADE,
  target_node_id UUID REFERENCES public.knowledge_graph_nodes(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL,
  weight NUMERIC DEFAULT 1,
  properties JSONB DEFAULT '{}'::jsonb,
  semantic_similarity NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shadow_network_entities for hidden actor detection
CREATE TABLE IF NOT EXISTS public.shadow_network_entities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  entity_type TEXT NOT NULL,
  entity_label TEXT,
  visibility_score NUMERIC DEFAULT 0,
  connection_anomalies JSONB DEFAULT '[]'::jsonb,
  inference_confidence NUMERIC DEFAULT 0,
  negative_space_indicators JSONB DEFAULT '[]'::jsonb,
  homophily_violations JSONB DEFAULT '[]'::jsonb,
  intermediary_paths JSONB DEFAULT '[]'::jsonb,
  related_profile_ids UUID[] DEFAULT '{}',
  detection_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create evidence_mass_functions for Dempster-Shafer fusion
CREATE TABLE IF NOT EXISTS public.evidence_mass_functions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id),
  hypothesis_set JSONB NOT NULL,
  mass_value NUMERIC NOT NULL,
  belief NUMERIC,
  plausibility NUMERIC,
  source_reliability NUMERIC DEFAULT 0.8,
  source_type TEXT,
  combination_rule_used TEXT DEFAULT 'dempster',
  conflict_level NUMERIC DEFAULT 0,
  local_ignorance NUMERIC DEFAULT 0,
  evidence_metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create belief_network_states for Bayesian inference
CREATE TABLE IF NOT EXISTS public.belief_network_states (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id),
  network_name TEXT NOT NULL,
  node_probabilities JSONB NOT NULL DEFAULT '{}'::jsonb,
  evidence_applied JSONB DEFAULT '[]'::jsonb,
  causal_chain JSONB DEFAULT '[]'::jsonb,
  dag_structure JSONB DEFAULT '{}'::jsonb,
  inference_timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  precrime_indicators JSONB DEFAULT '[]'::jsonb,
  imminence_probability NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create counterfactual_scenarios for what-if analysis
CREATE TABLE IF NOT EXISTS public.counterfactual_scenarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id),
  scenario_name TEXT NOT NULL,
  intervention_type TEXT NOT NULL,
  modified_variables JSONB NOT NULL DEFAULT '{}'::jsonb,
  predicted_outcomes JSONB DEFAULT '{}'::jsonb,
  confidence NUMERIC DEFAULT 0,
  baseline_state JSONB DEFAULT '{}'::jsonb,
  alternative_timelines JSONB DEFAULT '[]'::jsonb,
  decision_tree JSONB DEFAULT '{}'::jsonb,
  causal_justification TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pattern_of_life for routine detection
CREATE TABLE IF NOT EXISTS public.pattern_of_life (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id),
  routine_type TEXT NOT NULL,
  time_windows JSONB DEFAULT '[]'::jsonb,
  locations JSONB DEFAULT '[]'::jsonb,
  deviation_threshold NUMERIC DEFAULT 0.2,
  circadian_rhythm JSONB DEFAULT '{}'::jsonb,
  activity_sequences JSONB DEFAULT '[]'::jsonb,
  routine_strength NUMERIC DEFAULT 0,
  last_deviation_at TIMESTAMP WITH TIME ZONE,
  deviation_history JSONB DEFAULT '[]'::jsonb,
  alerts JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create osint_intelligence for external intel
CREATE TABLE IF NOT EXISTS public.osint_intelligence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id),
  source_type TEXT NOT NULL,
  source_url TEXT,
  content_hash TEXT,
  content_summary TEXT,
  threat_relevance NUMERIC DEFAULT 0,
  verification_status TEXT DEFAULT 'unverified',
  sentiment_score NUMERIC,
  entities_extracted JSONB DEFAULT '[]'::jsonb,
  keywords JSONB DEFAULT '[]'::jsonb,
  is_dark_web BOOLEAN DEFAULT false,
  raw_content TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables (safe to run multiple times)
ALTER TABLE public.temporal_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_twins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_graph_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_graph_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shadow_network_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_mass_functions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.belief_network_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counterfactual_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pattern_of_life ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.osint_intelligence ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Users can view own temporal predictions" ON public.temporal_predictions;
DROP POLICY IF EXISTS "Users can create own temporal predictions" ON public.temporal_predictions;
DROP POLICY IF EXISTS "Users can update own temporal predictions" ON public.temporal_predictions;
DROP POLICY IF EXISTS "Users can delete own temporal predictions" ON public.temporal_predictions;

CREATE POLICY "Users can view own temporal predictions" ON public.temporal_predictions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own temporal predictions" ON public.temporal_predictions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own temporal predictions" ON public.temporal_predictions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own temporal predictions" ON public.temporal_predictions FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own digital twins" ON public.digital_twins;
DROP POLICY IF EXISTS "Users can create own digital twins" ON public.digital_twins;
DROP POLICY IF EXISTS "Users can update own digital twins" ON public.digital_twins;
DROP POLICY IF EXISTS "Users can delete own digital twins" ON public.digital_twins;

CREATE POLICY "Users can view own digital twins" ON public.digital_twins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own digital twins" ON public.digital_twins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own digital twins" ON public.digital_twins FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own digital twins" ON public.digital_twins FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own knowledge graph nodes" ON public.knowledge_graph_nodes;
DROP POLICY IF EXISTS "Users can create own knowledge graph nodes" ON public.knowledge_graph_nodes;
DROP POLICY IF EXISTS "Users can update own knowledge graph nodes" ON public.knowledge_graph_nodes;
DROP POLICY IF EXISTS "Users can delete own knowledge graph nodes" ON public.knowledge_graph_nodes;

CREATE POLICY "Users can view own knowledge graph nodes" ON public.knowledge_graph_nodes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own knowledge graph nodes" ON public.knowledge_graph_nodes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own knowledge graph nodes" ON public.knowledge_graph_nodes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own knowledge graph nodes" ON public.knowledge_graph_nodes FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own knowledge graph edges" ON public.knowledge_graph_edges;
DROP POLICY IF EXISTS "Users can create own knowledge graph edges" ON public.knowledge_graph_edges;
DROP POLICY IF EXISTS "Users can update own knowledge graph edges" ON public.knowledge_graph_edges;
DROP POLICY IF EXISTS "Users can delete own knowledge graph edges" ON public.knowledge_graph_edges;

CREATE POLICY "Users can view own knowledge graph edges" ON public.knowledge_graph_edges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own knowledge graph edges" ON public.knowledge_graph_edges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own knowledge graph edges" ON public.knowledge_graph_edges FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own knowledge graph edges" ON public.knowledge_graph_edges FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own shadow network entities" ON public.shadow_network_entities;
DROP POLICY IF EXISTS "Users can create own shadow network entities" ON public.shadow_network_entities;
DROP POLICY IF EXISTS "Users can update own shadow network entities" ON public.shadow_network_entities;
DROP POLICY IF EXISTS "Users can delete own shadow network entities" ON public.shadow_network_entities;

CREATE POLICY "Users can view own shadow network entities" ON public.shadow_network_entities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own shadow network entities" ON public.shadow_network_entities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own shadow network entities" ON public.shadow_network_entities FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own shadow network entities" ON public.shadow_network_entities FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own evidence mass functions" ON public.evidence_mass_functions;
DROP POLICY IF EXISTS "Users can create own evidence mass functions" ON public.evidence_mass_functions;
DROP POLICY IF EXISTS "Users can update own evidence mass functions" ON public.evidence_mass_functions;
DROP POLICY IF EXISTS "Users can delete own evidence mass functions" ON public.evidence_mass_functions;

CREATE POLICY "Users can view own evidence mass functions" ON public.evidence_mass_functions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own evidence mass functions" ON public.evidence_mass_functions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own evidence mass functions" ON public.evidence_mass_functions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own evidence mass functions" ON public.evidence_mass_functions FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own belief network states" ON public.belief_network_states;
DROP POLICY IF EXISTS "Users can create own belief network states" ON public.belief_network_states;
DROP POLICY IF EXISTS "Users can update own belief network states" ON public.belief_network_states;
DROP POLICY IF EXISTS "Users can delete own belief network states" ON public.belief_network_states;

CREATE POLICY "Users can view own belief network states" ON public.belief_network_states FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own belief network states" ON public.belief_network_states FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own belief network states" ON public.belief_network_states FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own belief network states" ON public.belief_network_states FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own counterfactual scenarios" ON public.counterfactual_scenarios;
DROP POLICY IF EXISTS "Users can create own counterfactual scenarios" ON public.counterfactual_scenarios;
DROP POLICY IF EXISTS "Users can update own counterfactual scenarios" ON public.counterfactual_scenarios;
DROP POLICY IF EXISTS "Users can delete own counterfactual scenarios" ON public.counterfactual_scenarios;

CREATE POLICY "Users can view own counterfactual scenarios" ON public.counterfactual_scenarios FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own counterfactual scenarios" ON public.counterfactual_scenarios FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own counterfactual scenarios" ON public.counterfactual_scenarios FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own counterfactual scenarios" ON public.counterfactual_scenarios FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own pattern of life" ON public.pattern_of_life;
DROP POLICY IF EXISTS "Users can create own pattern of life" ON public.pattern_of_life;
DROP POLICY IF EXISTS "Users can update own pattern of life" ON public.pattern_of_life;
DROP POLICY IF EXISTS "Users can delete own pattern of life" ON public.pattern_of_life;

CREATE POLICY "Users can view own pattern of life" ON public.pattern_of_life FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own pattern of life" ON public.pattern_of_life FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pattern of life" ON public.pattern_of_life FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own pattern of life" ON public.pattern_of_life FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own osint intelligence" ON public.osint_intelligence;
DROP POLICY IF EXISTS "Users can create own osint intelligence" ON public.osint_intelligence;
DROP POLICY IF EXISTS "Users can update own osint intelligence" ON public.osint_intelligence;
DROP POLICY IF EXISTS "Users can delete own osint intelligence" ON public.osint_intelligence;

CREATE POLICY "Users can view own osint intelligence" ON public.osint_intelligence FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own osint intelligence" ON public.osint_intelligence FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own osint intelligence" ON public.osint_intelligence FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own osint intelligence" ON public.osint_intelligence FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_temporal_predictions_profile ON public.temporal_predictions(profile_id);
CREATE INDEX IF NOT EXISTS idx_temporal_predictions_type ON public.temporal_predictions(prediction_type);
CREATE INDEX IF NOT EXISTS idx_digital_twins_profile ON public.digital_twins(profile_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_graph_nodes_type ON public.knowledge_graph_nodes(node_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_graph_nodes_community ON public.knowledge_graph_nodes(community_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_graph_edges_source ON public.knowledge_graph_edges(source_node_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_graph_edges_target ON public.knowledge_graph_edges(target_node_id);
CREATE INDEX IF NOT EXISTS idx_shadow_network_entities_type ON public.shadow_network_entities(entity_type);
CREATE INDEX IF NOT EXISTS idx_evidence_mass_functions_profile ON public.evidence_mass_functions(profile_id);
CREATE INDEX IF NOT EXISTS idx_belief_network_states_profile ON public.belief_network_states(profile_id);
CREATE INDEX IF NOT EXISTS idx_counterfactual_scenarios_profile ON public.counterfactual_scenarios(profile_id);
CREATE INDEX IF NOT EXISTS idx_pattern_of_life_profile ON public.pattern_of_life(profile_id);
CREATE INDEX IF NOT EXISTS idx_osint_intelligence_profile ON public.osint_intelligence(profile_id);
CREATE INDEX IF NOT EXISTS idx_osint_intelligence_source ON public.osint_intelligence(source_type);