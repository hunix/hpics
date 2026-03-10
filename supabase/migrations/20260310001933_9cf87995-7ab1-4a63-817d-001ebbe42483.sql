
-- Agent Sessions table
CREATE TABLE public.agent_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL DEFAULT 'standard',
  goal TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  agent_turns JSONB DEFAULT '[]'::jsonb,
  final_report TEXT,
  confidence_score NUMERIC,
  self_verification_score NUMERIC,
  contradiction_count INTEGER NOT NULL DEFAULT 0,
  complexity_score NUMERIC,
  models_used JSONB DEFAULT '{}'::jsonb,
  duration_ms INTEGER,
  total_tokens INTEGER,
  estimated_cost_usd NUMERIC,
  phase_ids INTEGER[] DEFAULT '{}',
  sources_retrieved INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own agent sessions"
  ON public.agent_sessions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Intelligence Reports table
CREATE TABLE public.intelligence_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.agent_sessions(id) ON DELETE SET NULL,
  report_type TEXT NOT NULL DEFAULT 'standard',
  title TEXT,
  summary TEXT,
  full_report TEXT,
  confidence_score NUMERIC,
  threat_level TEXT,
  key_findings JSONB DEFAULT '[]'::jsonb,
  recommendations JSONB DEFAULT '[]'::jsonb,
  sources JSONB DEFAULT '[]'::jsonb,
  superseded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.intelligence_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own intelligence reports"
  ON public.intelligence_reports FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Intelligence Reasoning Chains table
CREATE TABLE public.intelligence_reasoning_chains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.agent_sessions(id) ON DELETE SET NULL,
  chain_type TEXT NOT NULL DEFAULT 'deductive',
  premise TEXT,
  steps JSONB DEFAULT '[]'::jsonb,
  conclusion TEXT,
  confidence NUMERIC,
  supporting_evidence JSONB DEFAULT '[]'::jsonb,
  counter_evidence JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.intelligence_reasoning_chains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own reasoning chains"
  ON public.intelligence_reasoning_chains FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Vulnerability Window Predictions table
CREATE TABLE public.vulnerability_window_predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  window_type TEXT NOT NULL DEFAULT 'emotional',
  status TEXT NOT NULL DEFAULT 'predicted',
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  window_end TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  probability NUMERIC DEFAULT 0.5,
  trigger_factors JSONB DEFAULT '[]'::jsonb,
  recommended_actions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vulnerability_window_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own vulnerability predictions"
  ON public.vulnerability_window_predictions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Intelligence Briefings table
CREATE TABLE public.intelligence_briefings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  briefing_date DATE NOT NULL DEFAULT CURRENT_DATE,
  title TEXT,
  summary TEXT,
  priority_items JSONB DEFAULT '[]'::jsonb,
  alerts JSONB DEFAULT '[]'::jsonb,
  metrics JSONB DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, briefing_date)
);

ALTER TABLE public.intelligence_briefings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own briefings"
  ON public.intelligence_briefings FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
