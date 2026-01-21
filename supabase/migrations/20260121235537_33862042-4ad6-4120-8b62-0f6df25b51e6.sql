-- =====================================================
-- INNOVATION 1: Intelligence Tribunal Engine Tables
-- =====================================================

-- Agent Tribunal Configurations (Admin-managed)
CREATE TABLE public.agent_tribunal_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tribunal_type TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  min_advocates INTEGER DEFAULT 2,
  max_advocates INTEGER DEFAULT 4,
  consensus_threshold NUMERIC DEFAULT 0.67,
  stability_rounds INTEGER DEFAULT 2,
  auto_escalate_to_arbitrator BOOLEAN DEFAULT TRUE,
  arbitrator_config JSONB DEFAULT '{}',
  advocate_roles JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tribunal Deliberations (Execution logs)
CREATE TABLE public.agent_deliberations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  tribunal_type TEXT NOT NULL,
  deliberation_session_id UUID NOT NULL,
  round_number INTEGER NOT NULL,
  agent_role TEXT NOT NULL,
  position TEXT NOT NULL,
  argument_text TEXT NOT NULL,
  evidence_references JSONB DEFAULT '[]',
  confidence_score NUMERIC NOT NULL,
  cost_cents INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tribunal Verdicts
CREATE TABLE public.tribunal_verdicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  deliberation_session_id UUID NOT NULL,
  tribunal_type TEXT NOT NULL,
  verdict TEXT NOT NULL,
  consensus_reached BOOLEAN NOT NULL,
  final_confidence NUMERIC NOT NULL,
  total_rounds INTEGER NOT NULL,
  participating_agents JSONB NOT NULL DEFAULT '[]',
  verdict_rationale TEXT NOT NULL,
  dissenting_opinions JSONB DEFAULT '[]',
  arbitrator_involved BOOLEAN DEFAULT FALSE,
  total_cost_cents INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INNOVATION 2: Warfare Verification Chamber Tables
-- =====================================================

-- Verification Stage Definitions
CREATE TABLE public.verification_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  prompt_key TEXT NOT NULL,
  model_tier TEXT DEFAULT 'quality',
  focus_criteria JSONB NOT NULL DEFAULT '{}',
  approval_threshold NUMERIC DEFAULT 0.7,
  can_veto BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Verification Chamber Configurations
CREATE TABLE public.verification_chamber_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chamber_type TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  verification_stages JSONB NOT NULL DEFAULT '[]',
  require_unanimous BOOLEAN DEFAULT TRUE,
  timeout_per_stage_ms INTEGER DEFAULT 30000,
  auto_reject_on_timeout BOOLEAN DEFAULT TRUE,
  escalation_config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Verification Reviews (Audit Trail)
CREATE TABLE public.decision_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES public.autonomous_campaigns(id) ON DELETE SET NULL,
  chamber_type TEXT NOT NULL,
  review_session_id UUID NOT NULL,
  stage_key TEXT NOT NULL,
  stage_order INTEGER NOT NULL,
  reviewer_verdict TEXT NOT NULL,
  confidence_score NUMERIC NOT NULL,
  review_rationale TEXT NOT NULL,
  identified_risks JSONB DEFAULT '[]',
  suggested_modifications JSONB DEFAULT '[]',
  veto_exercised BOOLEAN DEFAULT FALSE,
  cost_cents INTEGER DEFAULT 0,
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Final Chamber Decisions
CREATE TABLE public.chamber_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES public.autonomous_campaigns(id) ON DELETE SET NULL,
  chamber_type TEXT NOT NULL,
  review_session_id UUID NOT NULL,
  final_verdict TEXT NOT NULL,
  unanimous_approval BOOLEAN NOT NULL,
  stages_passed INTEGER NOT NULL,
  stages_total INTEGER NOT NULL,
  blocking_stage TEXT,
  applied_modifications JSONB DEFAULT '[]',
  total_cost_cents INTEGER DEFAULT 0,
  total_processing_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INNOVATION 3: SOP Distillation Engine Tables
-- =====================================================

-- Procedural Memory (SOPs)
CREATE TABLE public.procedural_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  sop_key TEXT NOT NULL,
  sop_name TEXT NOT NULL,
  description TEXT,
  trigger_conditions JSONB NOT NULL DEFAULT '{}',
  action_sequence JSONB NOT NULL DEFAULT '[]',
  success_criteria JSONB NOT NULL DEFAULT '{}',
  source_task_ids UUID[] DEFAULT '{}',
  confidence_score NUMERIC DEFAULT 0.5,
  usage_count INTEGER DEFAULT 0,
  success_rate NUMERIC DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, sop_key)
);

-- Reflect Agent Configuration
CREATE TABLE public.reflect_agent_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reflection_type TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  prompt_key TEXT NOT NULL,
  evaluation_dimensions JSONB NOT NULL DEFAULT '[]',
  min_confidence_for_sop NUMERIC DEFAULT 0.8,
  sop_generation_enabled BOOLEAN DEFAULT TRUE,
  failure_analysis_enabled BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reflection Results
CREATE TABLE public.task_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  source_execution_id UUID REFERENCES public.agent_executions(id) ON DELETE SET NULL,
  source_analysis_id UUID REFERENCES public.ai_analyses(id) ON DELETE SET NULL,
  reflection_type TEXT NOT NULL,
  evaluation_scores JSONB NOT NULL DEFAULT '{}',
  overall_success BOOLEAN NOT NULL,
  distilled_sop_id UUID REFERENCES public.procedural_memory(id) ON DELETE SET NULL,
  failure_analysis JSONB,
  improvement_suggestions JSONB DEFAULT '[]',
  cost_cents INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Failure Analysis Reports
CREATE TABLE public.failure_analysis_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  source_execution_id UUID REFERENCES public.agent_executions(id) ON DELETE SET NULL,
  failure_type TEXT NOT NULL,
  root_cause_analysis TEXT NOT NULL,
  contributing_factors JSONB DEFAULT '[]',
  recommended_fixes JSONB DEFAULT '[]',
  prevented_by_sop_id UUID REFERENCES public.procedural_memory(id) ON DELETE SET NULL,
  severity TEXT DEFAULT 'medium',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INNOVATION 4: Memory Crystallization Tables
-- =====================================================

-- Agentic Memory Nodes
CREATE TABLE public.agentic_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  memory_tier TEXT NOT NULL,
  memory_type TEXT NOT NULL,
  content TEXT NOT NULL,
  structured_data JSONB DEFAULT '{}',
  keywords TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  confidence_score NUMERIC DEFAULT 0.5,
  decay_rate NUMERIC DEFAULT 0.01,
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  access_count INTEGER DEFAULT 0,
  source_type TEXT,
  source_id UUID,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Memory Links (Bidirectional Graph)
CREATE TABLE public.memory_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_memory_id UUID NOT NULL REFERENCES public.agentic_memory(id) ON DELETE CASCADE,
  target_memory_id UUID NOT NULL REFERENCES public.agentic_memory(id) ON DELETE CASCADE,
  link_type TEXT NOT NULL,
  link_strength NUMERIC DEFAULT 0.5,
  bidirectional BOOLEAN DEFAULT TRUE,
  created_by TEXT DEFAULT 'system',
  evidence JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_memory_id, target_memory_id, link_type)
);

-- Memory Reconsolidation Events
CREATE TABLE public.memory_reconsolidation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  trigger_memory_id UUID REFERENCES public.agentic_memory(id) ON DELETE SET NULL,
  affected_memory_ids UUID[] NOT NULL DEFAULT '{}',
  reconsolidation_type TEXT NOT NULL,
  before_state JSONB NOT NULL DEFAULT '{}',
  after_state JSONB NOT NULL DEFAULT '{}',
  resolution_rationale TEXT,
  confidence_delta NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Memory Configuration
CREATE TABLE public.memory_crystallization_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  config_value JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INNOVATION 5: Agent Observability Layer Tables
-- =====================================================

-- Trace Sessions
CREATE TABLE public.agent_trace_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_type TEXT NOT NULL,
  trace_id TEXT NOT NULL UNIQUE,
  parent_trace_id TEXT,
  status TEXT DEFAULT 'in_progress',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  total_spans INTEGER DEFAULT 0,
  total_cost_cents INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'
);

-- Individual Spans
CREATE TABLE public.agent_spans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trace_session_id UUID NOT NULL REFERENCES public.agent_trace_sessions(id) ON DELETE CASCADE,
  span_id TEXT NOT NULL,
  parent_span_id TEXT,
  span_type TEXT NOT NULL,
  span_name TEXT NOT NULL,
  agent_type TEXT,
  function_name TEXT,
  status TEXT DEFAULT 'ok',
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_ms INTEGER,
  input_summary TEXT,
  output_summary TEXT,
  attributes JSONB DEFAULT '{}',
  events JSONB DEFAULT '[]',
  cost_cents INTEGER DEFAULT 0,
  error_message TEXT
);

-- Observability Configuration
CREATE TABLE public.observability_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  config_value JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Span Type Definitions (Configurable)
CREATE TABLE public.span_type_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  span_type TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  tracked_attributes JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Tribunal indexes
CREATE INDEX idx_agent_deliberations_session ON public.agent_deliberations(deliberation_session_id);
CREATE INDEX idx_agent_deliberations_user ON public.agent_deliberations(user_id);
CREATE INDEX idx_tribunal_verdicts_session ON public.tribunal_verdicts(deliberation_session_id);
CREATE INDEX idx_tribunal_verdicts_user ON public.tribunal_verdicts(user_id);

-- Verification indexes
CREATE INDEX idx_decision_reviews_session ON public.decision_reviews(review_session_id);
CREATE INDEX idx_decision_reviews_campaign ON public.decision_reviews(campaign_id);
CREATE INDEX idx_chamber_decisions_campaign ON public.chamber_decisions(campaign_id);

-- SOP indexes
CREATE INDEX idx_procedural_memory_user ON public.procedural_memory(user_id);
CREATE INDEX idx_procedural_memory_active ON public.procedural_memory(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_task_reflections_user ON public.task_reflections(user_id);
CREATE INDEX idx_failure_analysis_user ON public.failure_analysis_reports(user_id);

-- Memory indexes
CREATE INDEX idx_agentic_memory_user ON public.agentic_memory(user_id);
CREATE INDEX idx_agentic_memory_profile ON public.agentic_memory(profile_id);
CREATE INDEX idx_agentic_memory_tier ON public.agentic_memory(memory_tier);
CREATE INDEX idx_agentic_memory_keywords ON public.agentic_memory USING GIN(keywords);
CREATE INDEX idx_memory_links_source ON public.memory_links(source_memory_id);
CREATE INDEX idx_memory_links_target ON public.memory_links(target_memory_id);

-- Observability indexes
CREATE INDEX idx_agent_trace_sessions_user ON public.agent_trace_sessions(user_id);
CREATE INDEX idx_agent_trace_sessions_trace ON public.agent_trace_sessions(trace_id);
CREATE INDEX idx_agent_spans_session ON public.agent_spans(trace_session_id);
CREATE INDEX idx_agent_spans_type ON public.agent_spans(span_type);

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE public.agent_tribunal_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_deliberations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tribunal_verdicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_chamber_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decision_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chamber_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procedural_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reflect_agent_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.failure_analysis_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agentic_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_reconsolidation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_crystallization_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_trace_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_spans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.observability_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.span_type_definitions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES - Config tables (read-only for all authenticated users)
-- =====================================================

-- Tribunal Config (read-only)
CREATE POLICY "Users can view tribunal configs" ON public.agent_tribunal_config
  FOR SELECT TO authenticated USING (TRUE);

-- Verification Stages (read-only)
CREATE POLICY "Users can view verification stages" ON public.verification_stages
  FOR SELECT TO authenticated USING (TRUE);

-- Verification Chamber Config (read-only)
CREATE POLICY "Users can view chamber configs" ON public.verification_chamber_config
  FOR SELECT TO authenticated USING (TRUE);

-- Reflect Agent Config (read-only)
CREATE POLICY "Users can view reflect configs" ON public.reflect_agent_config
  FOR SELECT TO authenticated USING (TRUE);

-- Memory Crystallization Config (read-only)
CREATE POLICY "Users can view memory configs" ON public.memory_crystallization_config
  FOR SELECT TO authenticated USING (TRUE);

-- Observability Config (read-only)
CREATE POLICY "Users can view observability configs" ON public.observability_config
  FOR SELECT TO authenticated USING (TRUE);

-- Span Type Definitions (read-only)
CREATE POLICY "Users can view span types" ON public.span_type_definitions
  FOR SELECT TO authenticated USING (TRUE);

-- =====================================================
-- RLS POLICIES - User data tables (CRUD for own data)
-- =====================================================

-- Agent Deliberations
CREATE POLICY "Users can view own deliberations" ON public.agent_deliberations
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own deliberations" ON public.agent_deliberations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Tribunal Verdicts
CREATE POLICY "Users can view own verdicts" ON public.tribunal_verdicts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own verdicts" ON public.tribunal_verdicts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Decision Reviews
CREATE POLICY "Users can view own reviews" ON public.decision_reviews
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reviews" ON public.decision_reviews
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Chamber Decisions
CREATE POLICY "Users can view own chamber decisions" ON public.chamber_decisions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chamber decisions" ON public.chamber_decisions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Procedural Memory
CREATE POLICY "Users can view own SOPs" ON public.procedural_memory
  FOR SELECT TO authenticated USING (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "Users can insert own SOPs" ON public.procedural_memory
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own SOPs" ON public.procedural_memory
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own SOPs" ON public.procedural_memory
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Task Reflections
CREATE POLICY "Users can view own reflections" ON public.task_reflections
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reflections" ON public.task_reflections
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Failure Analysis Reports
CREATE POLICY "Users can view own failure reports" ON public.failure_analysis_reports
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own failure reports" ON public.failure_analysis_reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Agentic Memory
CREATE POLICY "Users can view own memories" ON public.agentic_memory
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own memories" ON public.agentic_memory
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own memories" ON public.agentic_memory
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own memories" ON public.agentic_memory
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Memory Links
CREATE POLICY "Users can view links to own memories" ON public.memory_links
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.agentic_memory WHERE id = source_memory_id AND user_id = auth.uid())
  );
CREATE POLICY "Users can insert links to own memories" ON public.memory_links
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.agentic_memory WHERE id = source_memory_id AND user_id = auth.uid())
  );
CREATE POLICY "Users can delete links to own memories" ON public.memory_links
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.agentic_memory WHERE id = source_memory_id AND user_id = auth.uid())
  );

-- Memory Reconsolidation Events
CREATE POLICY "Users can view own reconsolidation events" ON public.memory_reconsolidation_events
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reconsolidation events" ON public.memory_reconsolidation_events
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Agent Trace Sessions
CREATE POLICY "Users can view own traces" ON public.agent_trace_sessions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own traces" ON public.agent_trace_sessions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own traces" ON public.agent_trace_sessions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Agent Spans
CREATE POLICY "Users can view spans of own traces" ON public.agent_spans
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.agent_trace_sessions WHERE id = trace_session_id AND user_id = auth.uid())
  );
CREATE POLICY "Users can insert spans to own traces" ON public.agent_spans
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.agent_trace_sessions WHERE id = trace_session_id AND user_id = auth.uid())
  );
CREATE POLICY "Users can update spans of own traces" ON public.agent_spans
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.agent_trace_sessions WHERE id = trace_session_id AND user_id = auth.uid())
  );

-- =====================================================
-- SEED DATA - Tribunal Configurations
-- =====================================================

INSERT INTO public.agent_tribunal_config (tribunal_type, display_name, description, advocate_roles) VALUES
('threat_assessment', 'Threat Assessment Tribunal', 'Multi-agent debate for critical threat classification', 
 '[{"role": "behavioral_advocate", "prompt_key": "tribunal_behavioral", "focus_area": "behavioral_patterns"},
   {"role": "counterintel_advocate", "prompt_key": "tribunal_counterintel", "focus_area": "threat_indicators"},
   {"role": "psychological_advocate", "prompt_key": "tribunal_psychological", "focus_area": "psychological_profile"}]'::jsonb),
('campaign_approval', 'Campaign Approval Tribunal', 'Debate before activating high-stakes campaigns',
 '[{"role": "strategy_advocate", "prompt_key": "tribunal_strategy", "focus_area": "strategic_value"},
   {"role": "risk_advocate", "prompt_key": "tribunal_risk", "focus_area": "potential_risks"},
   {"role": "ethics_advocate", "prompt_key": "tribunal_ethics", "focus_area": "ethical_implications"}]'::jsonb),
('dossier_validation', 'Dossier Validation Tribunal', 'Validate high-confidence intelligence assessments',
 '[{"role": "source_validator", "prompt_key": "tribunal_source", "focus_area": "source_reliability"},
   {"role": "analysis_critic", "prompt_key": "tribunal_analysis", "focus_area": "analytical_rigor"},
   {"role": "bias_detector", "prompt_key": "tribunal_bias", "focus_area": "cognitive_biases"}]'::jsonb);

-- =====================================================
-- SEED DATA - Verification Stages
-- =====================================================

INSERT INTO public.verification_stages (stage_key, display_name, description, prompt_key, focus_criteria) VALUES
('planner', 'Strategic Planner', 'Evaluates strategic value and resource allocation', 'chamber_planner', 
 '{"evaluate": ["strategic_value", "resource_allocation", "timeline_feasibility"]}'::jsonb),
('red_team', 'Red Team Adversary', 'Identifies counter-measures and failure modes', 'chamber_red_team', 
 '{"evaluate": ["counter_measures", "detection_risk", "failure_modes"]}'::jsonb),
('legal_review', 'Legal Compliance', 'Assesses legal exposure and regulatory compliance', 'chamber_legal', 
 '{"evaluate": ["legal_exposure", "regulatory_compliance", "liability_risk"]}'::jsonb),
('final_verifier', 'Final Verifier', 'Overall coherence and execution readiness check', 'chamber_verifier', 
 '{"evaluate": ["overall_coherence", "risk_reward_ratio", "execution_readiness"]}'::jsonb);

INSERT INTO public.verification_chamber_config (chamber_type, display_name, description, verification_stages) VALUES
('warfare_campaign', 'Warfare Campaign Chamber', 'Full verification for psychological warfare campaigns',
 '[{"stage_key": "planner", "order": 1}, {"stage_key": "red_team", "order": 2}, 
   {"stage_key": "legal_review", "order": 3}, {"stage_key": "final_verifier", "order": 4}]'::jsonb),
('high_risk_operation', 'High Risk Operation Chamber', 'Verification for high-stakes autonomous actions',
 '[{"stage_key": "planner", "order": 1}, {"stage_key": "red_team", "order": 2}]'::jsonb);

-- =====================================================
-- SEED DATA - Reflect Agent Configurations
-- =====================================================

INSERT INTO public.reflect_agent_config (reflection_type, display_name, prompt_key, evaluation_dimensions) VALUES
('task_completion', 'Task Completion Reflector', 'reflect_task', 
 '[{"name": "truthfulness", "weight": 0.4, "criteria": "Conclusions traceable to specific observations"},
   {"name": "deliverable", "weight": 0.35, "criteria": "Output complete and correctly formatted"},
   {"name": "data_fidelity", "weight": 0.25, "criteria": "No data corruption during processing"}]'::jsonb),
('analysis_quality', 'Analysis Quality Reflector', 'reflect_analysis',
 '[{"name": "accuracy", "weight": 0.35, "criteria": "Factual correctness verified"},
   {"name": "depth", "weight": 0.3, "criteria": "Sufficient analytical depth"},
   {"name": "actionability", "weight": 0.35, "criteria": "Insights are actionable"}]'::jsonb),
('campaign_outcome', 'Campaign Outcome Reflector', 'reflect_campaign',
 '[{"name": "objective_achievement", "weight": 0.4, "criteria": "Campaign objectives met"},
   {"name": "efficiency", "weight": 0.3, "criteria": "Resource utilization optimal"},
   {"name": "side_effects", "weight": 0.3, "criteria": "Unintended consequences minimized"}]'::jsonb);

-- =====================================================
-- SEED DATA - Memory Crystallization Configs
-- =====================================================

INSERT INTO public.memory_crystallization_config (config_key, display_name, description, config_value) VALUES
('tier_weights', 'Memory Tier Retrieval Weights', 'Priority weights for each memory tier during retrieval',
 '{"core": 1.0, "episodic": 0.8, "semantic": 0.7, "procedural": 0.6, "resource": 0.5}'::jsonb),
('decay_thresholds', 'Confidence Decay Thresholds', 'Thresholds for archiving and reconsolidating memories',
 '{"archive_below": 0.2, "reconsolidate_below": 0.5, "stale_after_days": 30}'::jsonb),
('link_creation', 'Automatic Link Creation Rules', 'Rules for automatically linking related memories',
 '{"min_similarity": 0.75, "contradiction_threshold": 0.3, "max_links_per_memory": 20}'::jsonb),
('reconsolidation', 'Reconsolidation Triggers', 'Events that trigger memory reconsolidation',
 '{"on_contradiction": true, "on_new_evidence": true, "on_access": false, "idle_consolidation": true}'::jsonb);

-- =====================================================
-- SEED DATA - Span Type Definitions
-- =====================================================

INSERT INTO public.span_type_definitions (span_type, display_name, description, icon, color, tracked_attributes) VALUES
('AGENT', 'Agent Operation', 'High-level agent decision or action', 'brain', '#8b5cf6', 
 '["agent_type", "decision_type", "confidence"]'::jsonb),
('TOOL', 'Tool Invocation', 'External tool or API call', 'wrench', '#3b82f6', 
 '["tool_name", "tool_version", "retry_count"]'::jsonb),
('RETRIEVER', 'Knowledge Retrieval', 'RAG or memory access operation', 'database', '#10b981', 
 '["retriever_type", "documents_retrieved", "relevance_score"]'::jsonb),
('GUARDRAIL', 'Safety Check', 'Constitutional or safety validation', 'shield', '#ef4444', 
 '["check_type", "passed", "violation_reason"]'::jsonb),
('EVALUATOR', 'Quality Assessment', 'Output quality evaluation', 'check-circle', '#f59e0b', 
 '["evaluation_type", "score", "criteria"]'::jsonb);

-- =====================================================
-- SEED DATA - Observability Configs
-- =====================================================

INSERT INTO public.observability_config (config_key, display_name, description, config_value) VALUES
('sampling', 'Trace Sampling Configuration', 'Controls what percentage of operations are traced',
 '{"sample_rate": 1.0, "sample_error_traces": true, "max_spans_per_trace": 500}'::jsonb),
('retention', 'Trace Retention Policy', 'How long to keep trace data',
 '{"retain_days": 30, "retain_error_traces_days": 90, "archive_after_days": 7}'::jsonb),
('attributes', 'Global Span Attributes', 'Attributes included in all spans',
 '{"include_user_id": true, "include_cost": true, "include_model": true}'::jsonb);

-- =====================================================
-- UPDATE TRIGGER FOR TIMESTAMPS
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_agent_tribunal_config_updated_at
  BEFORE UPDATE ON public.agent_tribunal_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_verification_chamber_config_updated_at
  BEFORE UPDATE ON public.verification_chamber_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_procedural_memory_updated_at
  BEFORE UPDATE ON public.procedural_memory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agentic_memory_updated_at
  BEFORE UPDATE ON public.agentic_memory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();