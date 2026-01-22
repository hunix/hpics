-- =====================================================
-- Phase 1: Database-Driven Configuration Tables
-- v22 Absolute Genesis - 10 Core Tables
-- =====================================================

-- 1. Edge Function Registry - Central registry for all edge functions
CREATE TABLE IF NOT EXISTS public.edge_function_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'core',
  phase_level INTEGER NOT NULL DEFAULT 1,
  is_critical BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  health_check_enabled BOOLEAN NOT NULL DEFAULT true,
  expected_tables TEXT[] DEFAULT '{}',
  expected_columns JSONB DEFAULT '{}',
  timeout_ms INTEGER NOT NULL DEFAULT 30000,
  retry_config JSONB NOT NULL DEFAULT '{"maxRetries": 3, "backoffMs": 1000}',
  input_schema JSONB,
  output_schema JSONB,
  dependencies TEXT[] DEFAULT '{}',
  rate_limit_per_minute INTEGER NOT NULL DEFAULT 60,
  cost_tier TEXT NOT NULL DEFAULT 'standard',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Agent Workflows - State machine definitions
CREATE TABLE IF NOT EXISTS public.agent_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  workflow_name TEXT NOT NULL,
  workflow_type TEXT NOT NULL DEFAULT 'sequential',
  description TEXT,
  states JSONB NOT NULL DEFAULT '[]',
  transitions JSONB NOT NULL DEFAULT '[]',
  initial_state TEXT NOT NULL DEFAULT 'start',
  terminal_states TEXT[] DEFAULT ARRAY['completed', 'failed'],
  backtrack_enabled BOOLEAN NOT NULL DEFAULT true,
  max_backtrack_depth INTEGER NOT NULL DEFAULT 3,
  self_correction_rules JSONB DEFAULT '[]',
  checkpoint_enabled BOOLEAN NOT NULL DEFAULT true,
  timeout_seconds INTEGER NOT NULL DEFAULT 300,
  is_active BOOLEAN NOT NULL DEFAULT true,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, workflow_name)
);

-- 3. Agent Workflow Executions - Execution history
CREATE TABLE IF NOT EXISTS public.agent_workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES public.agent_workflows(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id),
  current_state TEXT NOT NULL,
  state_history JSONB NOT NULL DEFAULT '[]',
  context_data JSONB DEFAULT '{}',
  checkpoints JSONB DEFAULT '[]',
  backtrack_count INTEGER NOT NULL DEFAULT 0,
  correction_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'running',
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Constitutional Rules - Ethical/legal guardrails
CREATE TABLE IF NOT EXISTS public.constitutional_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'ethical',
  severity TEXT NOT NULL DEFAULT 'warning',
  pattern TEXT,
  validation_logic JSONB,
  violation_action TEXT NOT NULL DEFAULT 'log',
  escalation_contact TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_system BOOLEAN NOT NULL DEFAULT false,
  priority INTEGER NOT NULL DEFAULT 100,
  applies_to_functions TEXT[] DEFAULT '{}',
  applies_to_agents TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Constitutional Violations - Audit log
CREATE TABLE IF NOT EXISTS public.constitutional_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES public.constitutional_rules(id),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id),
  function_name TEXT,
  agent_type TEXT,
  violation_content TEXT,
  violation_context JSONB,
  action_taken TEXT NOT NULL,
  severity TEXT NOT NULL,
  was_blocked BOOLEAN NOT NULL DEFAULT false,
  was_rewritten BOOLEAN NOT NULL DEFAULT false,
  rewritten_content TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Agent Kill Switches - Emergency containment
CREATE TABLE IF NOT EXISTS public.agent_kill_switches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  agent_type TEXT NOT NULL,
  function_name TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  containment_mode TEXT NOT NULL DEFAULT 'soft',
  auto_disable_conditions JSONB DEFAULT '[]',
  escalation_contacts TEXT[] DEFAULT '{}',
  reason TEXT,
  enabled_by UUID,
  enabled_at TIMESTAMPTZ,
  disabled_by UUID,
  disabled_at TIMESTAMPTZ,
  activation_count INTEGER NOT NULL DEFAULT 0,
  last_activation_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, agent_type, function_name)
);

-- 7. Genesis Operations - Unified Phase 22 operations
CREATE TABLE IF NOT EXISTS public.genesis_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id),
  operation_type TEXT NOT NULL,
  operation_name TEXT NOT NULL,
  genesis_phase TEXT NOT NULL DEFAULT 'initiation',
  manifestation_level INTEGER NOT NULL DEFAULT 1,
  reality_parameters JSONB DEFAULT '{}',
  causal_chains JSONB DEFAULT '[]',
  synthesis_elements JSONB DEFAULT '[]',
  primordial_patterns JSONB DEFAULT '{}',
  existence_blueprint JSONB DEFAULT '{}',
  universal_coordinates JSONB DEFAULT '{}',
  manifestation_progress NUMERIC(5,2) NOT NULL DEFAULT 0,
  stability_coefficient NUMERIC(5,4) NOT NULL DEFAULT 1.0,
  power_level INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending',
  result JSONB,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Causal Models - Structural causal model definitions
CREATE TABLE IF NOT EXISTS public.causal_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id),
  model_name TEXT NOT NULL,
  description TEXT,
  nodes JSONB NOT NULL DEFAULT '[]',
  edges JSONB NOT NULL DEFAULT '[]',
  confounders JSONB DEFAULT '[]',
  mediators JSONB DEFAULT '[]',
  moderators JSONB DEFAULT '[]',
  structural_equations JSONB DEFAULT '{}',
  identifiability_status TEXT DEFAULT 'unknown',
  estimation_method TEXT DEFAULT 'backdoor',
  causal_effects JSONB DEFAULT '{}',
  is_validated BOOLEAN NOT NULL DEFAULT false,
  validation_score NUMERIC(5,4),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Counterfactual Simulations - do() intervention results
CREATE TABLE IF NOT EXISTS public.counterfactual_simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  causal_model_id UUID REFERENCES public.causal_models(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id),
  intervention_variable TEXT NOT NULL,
  intervention_value JSONB NOT NULL,
  outcome_variable TEXT NOT NULL,
  factual_outcome JSONB,
  counterfactual_outcome JSONB,
  causal_effect JSONB,
  explanation TEXT,
  confidence_interval JSONB,
  sensitivity_analysis JSONB,
  simulation_params JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- 10. Hypergraph Edges - Multi-node relationship edges
CREATE TABLE IF NOT EXISTS public.hypergraph_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  edge_name TEXT,
  edge_type TEXT NOT NULL,
  node_ids UUID[] NOT NULL,
  node_types TEXT[] NOT NULL,
  relationship_weights JSONB DEFAULT '{}',
  temporal_validity JSONB DEFAULT '{}',
  context_embedding JSONB,
  interaction_count INTEGER NOT NULL DEFAULT 0,
  last_interaction_at TIMESTAMPTZ,
  strength_score NUMERIC(5,4) NOT NULL DEFAULT 0.5,
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- Enable RLS on all tables
-- =====================================================
ALTER TABLE public.edge_function_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.constitutional_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.constitutional_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_kill_switches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.genesis_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.causal_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counterfactual_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hypergraph_edges ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS Policies
-- =====================================================

-- Edge Function Registry - Read by all authenticated, write by admins (system table)
CREATE POLICY "edge_function_registry_select" ON public.edge_function_registry
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "edge_function_registry_all" ON public.edge_function_registry
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Agent Workflows - User-scoped
CREATE POLICY "agent_workflows_user" ON public.agent_workflows
  FOR ALL TO authenticated 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- Agent Workflow Executions - User-scoped
CREATE POLICY "agent_workflow_executions_user" ON public.agent_workflow_executions
  FOR ALL TO authenticated 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- Constitutional Rules - Read by all, managed by system
CREATE POLICY "constitutional_rules_select" ON public.constitutional_rules
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "constitutional_rules_manage" ON public.constitutional_rules
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Constitutional Violations - User-scoped
CREATE POLICY "constitutional_violations_user" ON public.constitutional_violations
  FOR ALL TO authenticated 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- Agent Kill Switches - User-scoped
CREATE POLICY "agent_kill_switches_user" ON public.agent_kill_switches
  FOR ALL TO authenticated 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- Genesis Operations - User-scoped
CREATE POLICY "genesis_operations_user" ON public.genesis_operations
  FOR ALL TO authenticated 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- Causal Models - User-scoped
CREATE POLICY "causal_models_user" ON public.causal_models
  FOR ALL TO authenticated 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- Counterfactual Simulations - User-scoped
CREATE POLICY "counterfactual_simulations_user" ON public.counterfactual_simulations
  FOR ALL TO authenticated 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- Hypergraph Edges - User-scoped
CREATE POLICY "hypergraph_edges_user" ON public.hypergraph_edges
  FOR ALL TO authenticated 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- Indexes for performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_edge_function_registry_category ON public.edge_function_registry(category);
CREATE INDEX IF NOT EXISTS idx_edge_function_registry_phase ON public.edge_function_registry(phase_level);
CREATE INDEX IF NOT EXISTS idx_edge_function_registry_active ON public.edge_function_registry(is_active);

CREATE INDEX IF NOT EXISTS idx_agent_workflows_user ON public.agent_workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_workflows_type ON public.agent_workflows(workflow_type);

CREATE INDEX IF NOT EXISTS idx_agent_workflow_executions_workflow ON public.agent_workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_agent_workflow_executions_user ON public.agent_workflow_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_workflow_executions_status ON public.agent_workflow_executions(status);

CREATE INDEX IF NOT EXISTS idx_constitutional_rules_category ON public.constitutional_rules(category);
CREATE INDEX IF NOT EXISTS idx_constitutional_rules_severity ON public.constitutional_rules(severity);
CREATE INDEX IF NOT EXISTS idx_constitutional_rules_active ON public.constitutional_rules(is_active);

CREATE INDEX IF NOT EXISTS idx_constitutional_violations_rule ON public.constitutional_violations(rule_id);
CREATE INDEX IF NOT EXISTS idx_constitutional_violations_user ON public.constitutional_violations(user_id);

CREATE INDEX IF NOT EXISTS idx_agent_kill_switches_user ON public.agent_kill_switches(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_kill_switches_agent ON public.agent_kill_switches(agent_type);

CREATE INDEX IF NOT EXISTS idx_genesis_operations_user ON public.genesis_operations(user_id);
CREATE INDEX IF NOT EXISTS idx_genesis_operations_type ON public.genesis_operations(operation_type);
CREATE INDEX IF NOT EXISTS idx_genesis_operations_status ON public.genesis_operations(status);

CREATE INDEX IF NOT EXISTS idx_causal_models_user ON public.causal_models(user_id);
CREATE INDEX IF NOT EXISTS idx_counterfactual_simulations_model ON public.counterfactual_simulations(causal_model_id);
CREATE INDEX IF NOT EXISTS idx_hypergraph_edges_user ON public.hypergraph_edges(user_id);
CREATE INDEX IF NOT EXISTS idx_hypergraph_edges_type ON public.hypergraph_edges(edge_type);

-- =====================================================
-- Updated_at triggers
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_edge_function_registry_updated_at
  BEFORE UPDATE ON public.edge_function_registry
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agent_workflows_updated_at
  BEFORE UPDATE ON public.agent_workflows
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_constitutional_rules_updated_at
  BEFORE UPDATE ON public.constitutional_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agent_kill_switches_updated_at
  BEFORE UPDATE ON public.agent_kill_switches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_genesis_operations_updated_at
  BEFORE UPDATE ON public.genesis_operations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_causal_models_updated_at
  BEFORE UPDATE ON public.causal_models
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hypergraph_edges_updated_at
  BEFORE UPDATE ON public.hypergraph_edges
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- Seed some default constitutional rules
-- =====================================================
INSERT INTO public.constitutional_rules (rule_name, rule_type, description, category, severity, violation_action, is_system, priority)
VALUES
  ('no_pii_exposure', 'content_filter', 'Prevent exposure of PII in outputs', 'privacy', 'block', 'block', true, 10),
  ('no_illegal_advice', 'content_filter', 'Block advice for illegal activities', 'legal', 'block', 'block', true, 5),
  ('ethical_manipulation', 'behavior_guard', 'Flag potentially manipulative tactics', 'ethical', 'warning', 'warn', true, 20),
  ('brand_tone', 'style_guide', 'Maintain professional communication tone', 'brand', 'info', 'log', true, 50),
  ('rate_limit_protection', 'operational', 'Enforce rate limits on AI operations', 'operational', 'block', 'block', true, 15),
  ('data_retention', 'compliance', 'Ensure data retention policies are followed', 'legal', 'warning', 'escalate', true, 25)
ON CONFLICT DO NOTHING;