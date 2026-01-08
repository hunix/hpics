-- =====================================================
-- PHASE 3: OSINT + COUNTER-INTELLIGENCE INFRASTRUCTURE
-- =====================================================

-- Table: osint_findings
-- Stores OSINT scan results from web searches, news, and public data
CREATE TABLE IF NOT EXISTS public.osint_findings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  finding_type TEXT NOT NULL, -- 'news_mention', 'social_profile', 'company_update', 'public_record', 'web_mention'
  source TEXT NOT NULL, -- 'google', 'news_api', 'linkedin', 'twitter', etc.
  source_url TEXT,
  title TEXT NOT NULL,
  snippet TEXT,
  full_content TEXT,
  published_at TIMESTAMPTZ,
  sentiment_score NUMERIC(4,3),
  relevance_score NUMERIC(4,3) CHECK (relevance_score >= 0 AND relevance_score <= 1),
  is_verified BOOLEAN DEFAULT false,
  is_important BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for osint_findings
CREATE INDEX idx_osint_findings_user_profile ON public.osint_findings(user_id, profile_id);
CREATE INDEX idx_osint_findings_type ON public.osint_findings(finding_type);
CREATE INDEX idx_osint_findings_important ON public.osint_findings(is_important) WHERE is_important = true;
CREATE INDEX idx_osint_findings_recent ON public.osint_findings(created_at DESC);

-- RLS for osint_findings
ALTER TABLE public.osint_findings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own OSINT findings"
  ON public.osint_findings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own OSINT findings"
  ON public.osint_findings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own OSINT findings"
  ON public.osint_findings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own OSINT findings"
  ON public.osint_findings FOR DELETE
  USING (auth.uid() = user_id);

-- Table: threat_assessments
-- Stores counter-intelligence threat analysis results
CREATE TABLE IF NOT EXISTS public.threat_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assessment_type TEXT NOT NULL, -- 'identity_verification', 'behavioral_anomaly', 'social_engineering', 'deception_risk'
  threat_level TEXT NOT NULL CHECK (threat_level IN ('low', 'medium', 'high', 'critical')),
  threat_score NUMERIC(4,3) CHECK (threat_score >= 0 AND threat_score <= 1),
  identity_confidence NUMERIC(4,3), -- Overall identity confidence score
  indicators JSONB DEFAULT '[]', -- Array of threat indicators
  contradictions JSONB DEFAULT '[]', -- Cross-modal contradictions found
  recommendations JSONB DEFAULT '[]', -- Recommended actions
  evidence JSONB DEFAULT '{}', -- Supporting evidence
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for threat_assessments
CREATE INDEX idx_threat_assessments_user_profile ON public.threat_assessments(user_id, profile_id);
CREATE INDEX idx_threat_assessments_level ON public.threat_assessments(threat_level);
CREATE INDEX idx_threat_assessments_unresolved ON public.threat_assessments(is_resolved) WHERE is_resolved = false;

-- RLS for threat_assessments
ALTER TABLE public.threat_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own threat assessments"
  ON public.threat_assessments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own threat assessments"
  ON public.threat_assessments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own threat assessments"
  ON public.threat_assessments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own threat assessments"
  ON public.threat_assessments FOR DELETE
  USING (auth.uid() = user_id);

-- Table: integration_configs (stores non-secret integration settings)
CREATE TABLE IF NOT EXISTS public.integration_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  integration_type TEXT NOT NULL, -- 'osint_google', 'osint_news', 'osint_linkedin', etc.
  is_enabled BOOLEAN DEFAULT false,
  config JSONB DEFAULT '{}', -- Non-secret config (e.g., search preferences, rate limits)
  last_used_at TIMESTAMPTZ,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_integration UNIQUE (user_id, integration_type)
);

-- RLS for integration_configs
ALTER TABLE public.integration_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own integration configs"
  ON public.integration_configs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_osint_findings_updated_at
  BEFORE UPDATE ON public.osint_findings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_threat_assessments_updated_at
  BEFORE UPDATE ON public.threat_assessments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_integration_configs_updated_at
  BEFORE UPDATE ON public.integration_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();