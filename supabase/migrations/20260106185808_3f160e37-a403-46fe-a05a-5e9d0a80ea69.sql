-- Intelligence Infrastructure Tables

-- 1. Contact Activity Feed for real-time tracking
CREATE TABLE public.contact_activity_feed (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'communication', 'message', 'media', 'document', 'event', 'analysis', 'location', 'status_change'
  activity_subtype TEXT, -- specific action like 'sent', 'received', 'uploaded', 'analyzed'
  source TEXT, -- 'email', 'whatsapp', 'phone', 'meeting', 'manual', 'import', 'ai'
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  importance_score INTEGER DEFAULT 50, -- 0-100
  is_anomaly BOOLEAN DEFAULT false,
  anomaly_reason TEXT,
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Alert Rules for custom triggers
CREATE TABLE public.intelligence_alert_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT NOT NULL, -- 'silence', 'sentiment_shift', 'pattern_break', 'geo_alert', 'keyword', 'behavioral'
  conditions JSONB NOT NULL, -- { "days_silent": 14, "sentiment_drop": 30, "keywords": ["urgent", "lawsuit"] }
  target_profiles UUID[], -- null means all contacts
  target_groups UUID[], -- target contact groups
  severity TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  notification_channels TEXT[] DEFAULT ARRAY['in_app'], -- 'in_app', 'email', 'push'
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  trigger_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Alert Triggers (fired alerts)
CREATE TABLE public.intelligence_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  rule_id UUID REFERENCES public.intelligence_alert_rules(id) ON DELETE SET NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  evidence JSONB DEFAULT '{}', -- supporting data
  is_acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  is_dismissed BOOLEAN DEFAULT false,
  action_taken TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Behavioral Baselines for anomaly detection
CREATE TABLE public.behavioral_baselines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  baseline_type TEXT NOT NULL, -- 'communication_frequency', 'response_time', 'sentiment', 'activity_hours', 'channel_preference'
  baseline_data JSONB NOT NULL, -- statistical data
  confidence_score NUMERIC(5,2),
  sample_size INTEGER,
  calculation_period_days INTEGER DEFAULT 90,
  last_calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, profile_id, baseline_type)
);

-- 5. Deviations/Anomalies detected
CREATE TABLE public.behavioral_anomalies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  baseline_id UUID REFERENCES public.behavioral_baselines(id) ON DELETE SET NULL,
  anomaly_type TEXT NOT NULL, -- 'frequency_drop', 'sentiment_shift', 'pattern_break', 'unusual_activity'
  severity TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
  description TEXT,
  expected_value JSONB,
  actual_value JSONB,
  deviation_score NUMERIC(5,2), -- standard deviations from norm
  is_resolved BOOLEAN DEFAULT false,
  resolution_notes TEXT,
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Counter-Intelligence: Trust & Authenticity Tracking
CREATE TABLE public.trust_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  overall_trust_score NUMERIC(5,2), -- 0-100
  authenticity_score NUMERIC(5,2), -- 0-100
  consistency_score NUMERIC(5,2), -- 0-100, how consistent their behavior is
  deception_indicators JSONB DEFAULT '[]', -- array of detected red flags
  inconsistencies JSONB DEFAULT '[]', -- contradictions found in data
  verification_status TEXT, -- 'unverified', 'partially_verified', 'verified', 'suspicious'
  evidence_summary TEXT,
  ai_assessment TEXT,
  confidence_level NUMERIC(5,2),
  data_sources_analyzed JSONB DEFAULT '[]',
  last_assessment_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, profile_id)
);

-- 7. Location Intelligence
CREATE TABLE public.contact_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  location_type TEXT NOT NULL, -- 'home', 'work', 'frequent', 'travel', 'current', 'mentioned'
  location_name TEXT,
  address TEXT,
  city TEXT,
  region TEXT,
  country TEXT,
  country_code TEXT,
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  timezone TEXT,
  confidence_score NUMERIC(5,2),
  source TEXT, -- 'manual', 'inferred', 'document', 'conversation', 'travel_history'
  is_current BOOLEAN DEFAULT false,
  first_seen_at TIMESTAMP WITH TIME ZONE,
  last_seen_at TIMESTAMP WITH TIME ZONE,
  visit_count INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 8. Connection Intelligence: Shared Connections
CREATE TABLE public.connection_intelligence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_a_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  profile_b_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  connection_type TEXT NOT NULL, -- 'shared_contact', 'same_organization', 'same_event', 'communication_pattern', 'inferred'
  connection_strength NUMERIC(5,2), -- 0-100
  evidence JSONB DEFAULT '[]', -- what links them
  mutual_contacts UUID[] DEFAULT '{}',
  shared_organizations TEXT[] DEFAULT '{}',
  shared_events UUID[] DEFAULT '{}',
  communication_overlap JSONB, -- if they appear in same threads
  inferred_relationship TEXT, -- AI guess at relationship
  confidence_score NUMERIC(5,2),
  last_analyzed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, profile_a_id, profile_b_id)
);

-- 9. Dossier Generation History
CREATE TABLE public.dossiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  dossier_type TEXT NOT NULL, -- 'full', 'executive_brief', 'threat_assessment', 'background_check', 'relationship_summary'
  title TEXT NOT NULL,
  classification TEXT DEFAULT 'internal', -- 'public', 'internal', 'confidential', 'restricted'
  sections JSONB NOT NULL, -- structured dossier content
  summary TEXT,
  key_findings JSONB DEFAULT '[]',
  risk_assessment JSONB,
  recommendations JSONB DEFAULT '[]',
  data_sources_used JSONB DEFAULT '[]',
  ai_model_used TEXT,
  generation_cost_cents INTEGER,
  file_url TEXT,
  storage_path TEXT,
  is_archived BOOLEAN DEFAULT false,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.contact_activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intelligence_alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intelligence_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.behavioral_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.behavioral_anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connection_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dossiers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own activity feed" ON public.contact_activity_feed FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own alert rules" ON public.intelligence_alert_rules FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own alerts" ON public.intelligence_alerts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own baselines" ON public.behavioral_baselines FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own anomalies" ON public.behavioral_anomalies FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own trust assessments" ON public.trust_assessments FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own locations" ON public.contact_locations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own connection intelligence" ON public.connection_intelligence FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own dossiers" ON public.dossiers FOR ALL USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_activity_feed_profile ON public.contact_activity_feed(profile_id, occurred_at DESC);
CREATE INDEX idx_activity_feed_user_time ON public.contact_activity_feed(user_id, occurred_at DESC);
CREATE INDEX idx_activity_feed_anomaly ON public.contact_activity_feed(user_id, is_anomaly) WHERE is_anomaly = true;
CREATE INDEX idx_intelligence_alerts_unack ON public.intelligence_alerts(user_id, is_acknowledged) WHERE is_acknowledged = false;
CREATE INDEX idx_behavioral_anomalies_unresolved ON public.behavioral_anomalies(user_id, is_resolved) WHERE is_resolved = false;
CREATE INDEX idx_trust_assessments_profile ON public.trust_assessments(profile_id);
CREATE INDEX idx_contact_locations_profile ON public.contact_locations(profile_id);
CREATE INDEX idx_connection_intelligence_profiles ON public.connection_intelligence(profile_a_id, profile_b_id);
CREATE INDEX idx_dossiers_profile ON public.dossiers(profile_id);

-- Enable realtime for activity feed and alerts
ALTER PUBLICATION supabase_realtime ADD TABLE public.contact_activity_feed;
ALTER PUBLICATION supabase_realtime ADD TABLE public.intelligence_alerts;