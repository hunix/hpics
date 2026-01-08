-- Create only missing tables for Phases 10-14

-- Cost anomaly alerts table
CREATE TABLE public.cost_anomaly_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  anomaly_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  title TEXT NOT NULL,
  description TEXT,
  detected_value NUMERIC,
  expected_value NUMERIC,
  deviation_percentage NUMERIC,
  function_name TEXT,
  model_name TEXT,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- A/B Tests table
CREATE TABLE public.ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  prompt_key TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  test_status TEXT NOT NULL DEFAULT 'draft',
  traffic_split JSONB NOT NULL DEFAULT '{"control": 50, "variant": 50}',
  control_version_id UUID,
  variant_version_id UUID,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  winner_version_id UUID,
  statistical_significance NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- A/B Test Assignments
CREATE TABLE public.ab_test_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES public.ab_tests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  profile_id UUID,
  assigned_variant TEXT NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  converted BOOLEAN DEFAULT false,
  converted_at TIMESTAMPTZ,
  UNIQUE(test_id, user_id, profile_id)
);

-- Network predictions table
CREATE TABLE public.network_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID NOT NULL,
  prediction_type TEXT NOT NULL,
  risk_score NUMERIC,
  confidence_score NUMERIC,
  predicted_outcome TEXT,
  predicted_date TIMESTAMPTZ,
  contributing_factors JSONB,
  recommendations JSONB,
  actual_outcome TEXT,
  outcome_date TIMESTAMPTZ,
  accuracy_score NUMERIC,
  model_version TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Security findings table  
CREATE TABLE public.security_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  scan_id UUID,
  finding_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  affected_resource TEXT,
  remediation TEXT,
  finding_status TEXT DEFAULT 'open',
  assigned_to UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT
);

-- Enable RLS on all new tables
ALTER TABLE public.cost_anomaly_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_test_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_findings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cost_anomaly_alerts
CREATE POLICY "Users can view own cost alerts" ON public.cost_anomaly_alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own cost alerts" ON public.cost_anomaly_alerts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cost alerts" ON public.cost_anomaly_alerts FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for ab_tests
CREATE POLICY "Users can view own ab tests" ON public.ab_tests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own ab tests" ON public.ab_tests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ab tests" ON public.ab_tests FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own ab tests" ON public.ab_tests FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for ab_test_assignments
CREATE POLICY "Users can view own ab test assignments" ON public.ab_test_assignments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create ab test assignments" ON public.ab_test_assignments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ab test assignments" ON public.ab_test_assignments FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for network_predictions
CREATE POLICY "Users can view own network predictions" ON public.network_predictions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own network predictions" ON public.network_predictions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own network predictions" ON public.network_predictions FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for security_findings
CREATE POLICY "Users can view own security findings" ON public.security_findings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create security findings" ON public.security_findings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own security findings" ON public.security_findings FOR UPDATE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_cost_anomaly_alerts_user ON public.cost_anomaly_alerts(user_id, created_at DESC);
CREATE INDEX idx_ab_tests_user_status ON public.ab_tests(user_id, test_status);
CREATE INDEX idx_ab_test_assignments_test ON public.ab_test_assignments(test_id);
CREATE INDEX idx_network_predictions_user_profile ON public.network_predictions(user_id, profile_id);
CREATE INDEX idx_security_findings_user_status ON public.security_findings(user_id, finding_status);