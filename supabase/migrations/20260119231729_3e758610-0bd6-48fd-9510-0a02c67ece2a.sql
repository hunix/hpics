-- OPSEC Domain
CREATE TABLE IF NOT EXISTS public.opsec_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id),
  assessment_type TEXT NOT NULL,
  overall_score INTEGER,
  exposure_vectors JSONB DEFAULT '[]'::jsonb,
  recommendations JSONB DEFAULT '[]'::jsonb,
  digital_footprint JSONB DEFAULT '{}'::jsonb,
  metadata_leakage JSONB DEFAULT '{}'::jsonb,
  assessed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.digital_footprint_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id),
  source_type TEXT NOT NULL,
  source_url TEXT,
  exposure_level TEXT DEFAULT 'medium',
  data_category TEXT,
  data_content JSONB DEFAULT '{}'::jsonb,
  risk_score INTEGER DEFAULT 50,
  remediation_status TEXT DEFAULT 'pending',
  detected_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Social Engineering Defense
CREATE TABLE IF NOT EXISTS public.social_engineering_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id),
  attack_type TEXT NOT NULL,
  attack_vector TEXT,
  confidence_score NUMERIC DEFAULT 0,
  indicators JSONB DEFAULT '[]'::jsonb,
  communication_excerpt TEXT,
  counter_response JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'detected',
  detected_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.honey_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_name TEXT NOT NULL,
  persona_data JSONB DEFAULT '{}'::jsonb,
  tripwires JSONB DEFAULT '[]'::jsonb,
  access_log JSONB DEFAULT '[]'::jsonb,
  deployment_status TEXT DEFAULT 'draft',
  effectiveness_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Legal & Reputation Domain
CREATE TABLE IF NOT EXISTS public.legal_threat_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  threat_type TEXT NOT NULL,
  severity TEXT DEFAULT 'medium',
  adversary_profile_id UUID REFERENCES public.profiles(id),
  evidence_chain JSONB DEFAULT '[]'::jsonb,
  counter_strategies JSONB DEFAULT '[]'::jsonb,
  jurisdiction TEXT,
  statute_of_limitations JSONB DEFAULT '{}'::jsonb,
  legal_counsel_notes TEXT,
  status TEXT DEFAULT 'active',
  assessed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reputation_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  incident_type TEXT NOT NULL,
  platform TEXT,
  content_url TEXT,
  sentiment_impact NUMERIC DEFAULT 0,
  reach_estimate INTEGER DEFAULT 0,
  bot_network_detected BOOLEAN DEFAULT false,
  counter_actions JSONB DEFAULT '[]'::jsonb,
  narrative_response TEXT,
  status TEXT DEFAULT 'monitoring',
  detected_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Family Protection Domain
CREATE TABLE IF NOT EXISTS public.protected_persons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  risk_level TEXT DEFAULT 'low',
  age_category TEXT,
  location_general TEXT,
  protection_protocols JSONB DEFAULT '[]'::jsonb,
  emergency_contacts JSONB DEFAULT '[]'::jsonb,
  digital_exposure_score INTEGER DEFAULT 0,
  last_risk_assessment TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.emergency_protocols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  protocol_name TEXT NOT NULL,
  protocol_type TEXT NOT NULL,
  trigger_conditions JSONB DEFAULT '[]'::jsonb,
  actions JSONB DEFAULT '[]'::jsonb,
  contacts JSONB DEFAULT '[]'::jsonb,
  escalation_path JSONB DEFAULT '[]'::jsonb,
  auto_execute BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Crisis Response Domain
CREATE TABLE IF NOT EXISTS public.crisis_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  event_name TEXT,
  severity TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'active',
  affected_domains JSONB DEFAULT '[]'::jsonb,
  timeline JSONB DEFAULT '[]'::jsonb,
  countermeasures_deployed JSONB DEFAULT '[]'::jsonb,
  stakeholders_notified JSONB DEFAULT '[]'::jsonb,
  evidence_preserved JSONB DEFAULT '[]'::jsonb,
  resolution_notes TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.incident_timelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crisis_event_id UUID REFERENCES public.crisis_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  action_type TEXT NOT NULL,
  description TEXT,
  actor TEXT,
  evidence JSONB DEFAULT '{}'::jsonb,
  impact_assessment JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Economic Warfare Domain
CREATE TABLE IF NOT EXISTS public.economic_threat_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  threat_type TEXT NOT NULL,
  severity TEXT DEFAULT 'medium',
  target_assets JSONB DEFAULT '[]'::jsonb,
  attack_vectors JSONB DEFAULT '[]'::jsonb,
  financial_impact_estimate NUMERIC,
  countermeasures JSONB DEFAULT '[]'::jsonb,
  adversary_profile_id UUID REFERENCES public.profiles(id),
  status TEXT DEFAULT 'monitoring',
  assessed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Technical Countermeasures Domain
CREATE TABLE IF NOT EXISTS public.tscm_sweep_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  sweep_type TEXT NOT NULL,
  device_id TEXT,
  anomalies_detected JSONB DEFAULT '[]'::jsonb,
  compromise_indicators JSONB DEFAULT '[]'::jsonb,
  network_anomalies JSONB DEFAULT '[]'::jsonb,
  risk_score INTEGER DEFAULT 0,
  recommendations JSONB DEFAULT '[]'::jsonb,
  sweep_duration_ms INTEGER,
  swept_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.behavioral_baselines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  baseline_type TEXT NOT NULL,
  baseline_data JSONB DEFAULT '{}'::jsonb,
  anomaly_threshold NUMERIC DEFAULT 2.0,
  last_anomaly_detected TIMESTAMPTZ,
  anomaly_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.opsec_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_footprint_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_engineering_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.honey_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_threat_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reputation_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protected_persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crisis_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_timelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.economic_threat_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tscm_sweep_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.behavioral_baselines ENABLE ROW LEVEL SECURITY;

-- RLS Policies for all tables (user can only access their own data)
CREATE POLICY "Users can manage their own opsec_assessments" ON public.opsec_assessments FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own digital_footprint_items" ON public.digital_footprint_items FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own social_engineering_incidents" ON public.social_engineering_incidents FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own honey_profiles" ON public.honey_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own legal_threat_assessments" ON public.legal_threat_assessments FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own reputation_incidents" ON public.reputation_incidents FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own protected_persons" ON public.protected_persons FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own emergency_protocols" ON public.emergency_protocols FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own crisis_events" ON public.crisis_events FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own incident_timelines" ON public.incident_timelines FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own economic_threat_assessments" ON public.economic_threat_assessments FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own tscm_sweep_results" ON public.tscm_sweep_results FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own behavioral_baselines" ON public.behavioral_baselines FOR ALL USING (auth.uid() = user_id);