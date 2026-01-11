-- ============================================
-- ULTIMATE INTELLIGENCE SYSTEM ENHANCEMENT
-- Phase 1: Database Schema & Core Infrastructure
-- ============================================

-- 1. Enrichment Jobs Table - Track all enrichment operations
CREATE TABLE IF NOT EXISTS public.enrichment_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL, -- 'web_search', 'social_scrape', 'company_research', 'firecrawl', 'osint', 'auto'
  source_config JSONB DEFAULT '{}'::jsonb,
  priority INTEGER DEFAULT 50, -- 0-100, higher = more important
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed', 'cancelled'
  result JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  processing_time_ms INTEGER,
  cost_cents INTEGER DEFAULT 0,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Network Snapshots Table - Track network evolution over time
CREATE TABLE IF NOT EXISTS public.network_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  snapshot_type TEXT DEFAULT 'daily', -- 'daily', 'weekly', 'monthly', 'manual'
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Metrics include: node_count, edge_count, avg_degree, clustering_coef, communities, centrality_leaders, etc.
  graph_data JSONB DEFAULT '{}'::jsonb,
  -- Compressed adjacency data for diff analysis
  community_structure JSONB DEFAULT '{}'::jsonb,
  -- Community membership at this point
  change_summary JSONB DEFAULT '{}'::jsonb,
  -- Changes from previous snapshot
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, snapshot_date, snapshot_type)
);

-- 3. Meeting Intelligence Table - Pre/post meeting insights
CREATE TABLE IF NOT EXISTS public.meeting_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  meeting_title TEXT,
  meeting_date TIMESTAMPTZ,
  -- Pre-meeting briefing
  pre_briefing JSONB DEFAULT '{}'::jsonb,
  briefing_generated_at TIMESTAMPTZ,
  -- Post-meeting analysis
  post_summary JSONB DEFAULT '{}'::jsonb,
  summary_generated_at TIMESTAMPTZ,
  -- Action items extracted
  action_items JSONB DEFAULT '[]'::jsonb,
  -- Commitments made
  commitments JSONB DEFAULT '[]'::jsonb,
  -- Follow-up tracking
  follow_up_sent BOOLEAN DEFAULT false,
  follow_up_draft JSONB DEFAULT '{}'::jsonb,
  follow_up_sent_at TIMESTAMPTZ,
  next_touchpoint_date DATE,
  -- Meeting quality metrics
  meeting_effectiveness_score INTEGER,
  relationship_impact_score INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Web Monitoring Jobs Table - Track web mentions and news
CREATE TABLE IF NOT EXISTS public.web_monitoring_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_name TEXT NOT NULL,
  search_query TEXT NOT NULL,
  search_type TEXT DEFAULT 'general', -- 'general', 'news', 'social', 'company', 'person'
  frequency_hours INTEGER DEFAULT 24, -- How often to run
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  last_results JSONB DEFAULT '[]'::jsonb,
  last_result_count INTEGER DEFAULT 0,
  total_mentions_found INTEGER DEFAULT 0,
  alert_on_new_results BOOLEAN DEFAULT true,
  alert_threshold INTEGER DEFAULT 1, -- Minimum new results to trigger alert
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Web Monitoring Results Table - Store individual findings
CREATE TABLE IF NOT EXISTS public.web_monitoring_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.web_monitoring_jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  result_url TEXT,
  result_title TEXT,
  result_snippet TEXT,
  result_content TEXT,
  source_domain TEXT,
  sentiment_score DECIMAL(3,2),
  importance_score INTEGER DEFAULT 50,
  is_new BOOLEAN DEFAULT true,
  is_read BOOLEAN DEFAULT false,
  is_flagged BOOLEAN DEFAULT false,
  detected_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- 6. Community Evolution Table - Track community changes
CREATE TABLE IF NOT EXISTS public.community_evolution (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  snapshot_id UUID REFERENCES public.network_snapshots(id) ON DELETE CASCADE,
  community_id INTEGER NOT NULL,
  community_label TEXT,
  member_count INTEGER NOT NULL,
  leader_profile_ids UUID[] DEFAULT '{}',
  member_profile_ids UUID[] DEFAULT '{}',
  health_score INTEGER DEFAULT 50, -- 0-100
  growth_rate DECIMAL(5,2), -- Percentage change
  cohesion_score DECIMAL(3,2), -- Internal connectivity
  external_connections INTEGER DEFAULT 0,
  status TEXT DEFAULT 'stable', -- 'growing', 'stable', 'fragmenting', 'merging', 'new', 'dissolved'
  detected_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Influence Propagation Simulations Table
CREATE TABLE IF NOT EXISTS public.influence_simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  simulation_name TEXT,
  seed_profile_ids UUID[] NOT NULL,
  propagation_model TEXT DEFAULT 'independent_cascade', -- 'independent_cascade', 'linear_threshold', 'sir'
  parameters JSONB DEFAULT '{}'::jsonb,
  results JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Results include: reach_by_step, final_reach, time_to_reach, bottlenecks
  max_reach_achieved INTEGER,
  optimal_seeds_suggested UUID[],
  simulation_steps INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Gait Analysis Table - For biometric gait patterns
CREATE TABLE IF NOT EXISTS public.gait_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  source_recording_id UUID REFERENCES public.meeting_recordings(id) ON DELETE SET NULL,
  video_url TEXT,
  gait_pattern JSONB DEFAULT '{}'::jsonb, -- stride_length, cadence, arm_swing, symmetry
  personality_indicators JSONB DEFAULT '{}'::jsonb,
  health_indicators JSONB DEFAULT '{}'::jsonb,
  emotional_indicators JSONB DEFAULT '{}'::jsonb,
  confidence_score DECIMAL(3,2),
  ai_model_used TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Real-time Surveillance Alerts Table
CREATE TABLE IF NOT EXISTS public.surveillance_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL, -- 'anomaly', 'news', 'social_activity', 'communication_blackout', 'sentiment_shift', 'threat'
  severity TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  title TEXT NOT NULL,
  description TEXT,
  source TEXT, -- Where the alert originated
  source_data JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT false,
  is_acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMPTZ,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  auto_generated BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. AI Request Cache Table - For semantic caching
CREATE TABLE IF NOT EXISTS public.ai_request_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cache_key TEXT NOT NULL, -- Hash of prompt + model + key params
  prompt_hash TEXT NOT NULL,
  model_name TEXT NOT NULL,
  response_content TEXT NOT NULL,
  response_metadata JSONB DEFAULT '{}'::jsonb,
  tokens_saved INTEGER DEFAULT 0,
  cost_saved_cents INTEGER DEFAULT 0,
  hit_count INTEGER DEFAULT 1,
  last_hit_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, cache_key)
);

-- 11. Intervention Playbooks Table - For churn prevention
CREATE TABLE IF NOT EXISTS public.intervention_playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  churn_prediction_id UUID REFERENCES public.churn_predictions(id) ON DELETE SET NULL,
  playbook_type TEXT DEFAULT 'churn_prevention', -- 'churn_prevention', 'relationship_repair', 'reengagement'
  risk_level TEXT,
  intervention_steps JSONB DEFAULT '[]'::jsonb,
  outreach_scripts JSONB DEFAULT '[]'::jsonb,
  timing_recommendations JSONB DEFAULT '{}'::jsonb,
  channel_recommendations TEXT[],
  gift_suggestions JSONB DEFAULT '[]'::jsonb,
  escalation_path JSONB DEFAULT '[]'::jsonb,
  success_probability DECIMAL(3,2),
  status TEXT DEFAULT 'generated', -- 'generated', 'in_progress', 'completed', 'abandoned'
  outcome TEXT, -- 'success', 'partial', 'failed'
  outcome_notes TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 12. Brand Intelligence Table - Store extracted branding from companies
CREATE TABLE IF NOT EXISTS public.brand_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name TEXT,
  website_url TEXT,
  extracted_branding JSONB DEFAULT '{}'::jsonb,
  -- Includes: colors, fonts, logos, design_language, tone_of_voice
  color_palette JSONB DEFAULT '[]'::jsonb,
  typography JSONB DEFAULT '{}'::jsonb,
  logos JSONB DEFAULT '[]'::jsonb,
  tone_of_voice TEXT,
  communication_style TEXT,
  key_messages TEXT[],
  last_scraped_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.enrichment_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.web_monitoring_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.web_monitoring_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_evolution ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influence_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gait_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surveillance_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_request_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intervention_playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_intelligence ENABLE ROW LEVEL SECURITY;

-- RLS Policies for enrichment_jobs
CREATE POLICY "Users can view their own enrichment jobs" ON public.enrichment_jobs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own enrichment jobs" ON public.enrichment_jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own enrichment jobs" ON public.enrichment_jobs
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own enrichment jobs" ON public.enrichment_jobs
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for network_snapshots
CREATE POLICY "Users can view their own network snapshots" ON public.network_snapshots
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own network snapshots" ON public.network_snapshots
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own network snapshots" ON public.network_snapshots
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for meeting_intelligence
CREATE POLICY "Users can view their own meeting intelligence" ON public.meeting_intelligence
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own meeting intelligence" ON public.meeting_intelligence
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own meeting intelligence" ON public.meeting_intelligence
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own meeting intelligence" ON public.meeting_intelligence
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for web_monitoring_jobs
CREATE POLICY "Users can view their own web monitoring jobs" ON public.web_monitoring_jobs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own web monitoring jobs" ON public.web_monitoring_jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own web monitoring jobs" ON public.web_monitoring_jobs
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own web monitoring jobs" ON public.web_monitoring_jobs
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for web_monitoring_results
CREATE POLICY "Users can view their own web monitoring results" ON public.web_monitoring_results
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own web monitoring results" ON public.web_monitoring_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own web monitoring results" ON public.web_monitoring_results
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own web monitoring results" ON public.web_monitoring_results
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for community_evolution
CREATE POLICY "Users can view their own community evolution" ON public.community_evolution
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own community evolution" ON public.community_evolution
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for influence_simulations
CREATE POLICY "Users can view their own influence simulations" ON public.influence_simulations
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own influence simulations" ON public.influence_simulations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own influence simulations" ON public.influence_simulations
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for gait_analyses
CREATE POLICY "Users can view their own gait analyses" ON public.gait_analyses
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own gait analyses" ON public.gait_analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own gait analyses" ON public.gait_analyses
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for surveillance_alerts
CREATE POLICY "Users can view their own surveillance alerts" ON public.surveillance_alerts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own surveillance alerts" ON public.surveillance_alerts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own surveillance alerts" ON public.surveillance_alerts
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own surveillance alerts" ON public.surveillance_alerts
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for ai_request_cache
CREATE POLICY "Users can view their own AI cache" ON public.ai_request_cache
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own AI cache" ON public.ai_request_cache
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own AI cache" ON public.ai_request_cache
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own AI cache" ON public.ai_request_cache
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for intervention_playbooks
CREATE POLICY "Users can view their own intervention playbooks" ON public.intervention_playbooks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own intervention playbooks" ON public.intervention_playbooks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own intervention playbooks" ON public.intervention_playbooks
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own intervention playbooks" ON public.intervention_playbooks
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for brand_intelligence
CREATE POLICY "Users can view their own brand intelligence" ON public.brand_intelligence
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own brand intelligence" ON public.brand_intelligence
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own brand intelligence" ON public.brand_intelligence
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own brand intelligence" ON public.brand_intelligence
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_enrichment_jobs_user_status ON public.enrichment_jobs(user_id, status);
CREATE INDEX IF NOT EXISTS idx_enrichment_jobs_profile ON public.enrichment_jobs(profile_id);
CREATE INDEX IF NOT EXISTS idx_enrichment_jobs_priority ON public.enrichment_jobs(priority DESC, created_at ASC) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_network_snapshots_user_date ON public.network_snapshots(user_id, snapshot_date DESC);

CREATE INDEX IF NOT EXISTS idx_meeting_intelligence_event ON public.meeting_intelligence(event_id);
CREATE INDEX IF NOT EXISTS idx_meeting_intelligence_profile ON public.meeting_intelligence(profile_id);
CREATE INDEX IF NOT EXISTS idx_meeting_intelligence_date ON public.meeting_intelligence(user_id, meeting_date DESC);

CREATE INDEX IF NOT EXISTS idx_web_monitoring_jobs_active ON public.web_monitoring_jobs(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_web_monitoring_results_job ON public.web_monitoring_results(job_id, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_web_monitoring_results_unread ON public.web_monitoring_results(user_id, is_read) WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_community_evolution_snapshot ON public.community_evolution(snapshot_id);

CREATE INDEX IF NOT EXISTS idx_surveillance_alerts_user_unread ON public.surveillance_alerts(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_surveillance_alerts_severity ON public.surveillance_alerts(user_id, severity, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_cache_lookup ON public.ai_request_cache(user_id, cache_key);
CREATE INDEX IF NOT EXISTS idx_ai_cache_expiry ON public.ai_request_cache(expires_at);

CREATE INDEX IF NOT EXISTS idx_intervention_playbooks_profile ON public.intervention_playbooks(profile_id);
CREATE INDEX IF NOT EXISTS idx_intervention_playbooks_status ON public.intervention_playbooks(user_id, status);

CREATE INDEX IF NOT EXISTS idx_brand_intelligence_company ON public.brand_intelligence(company_name);

-- Trigger for auto-enrichment on new profiles
CREATE OR REPLACE FUNCTION public.trigger_auto_enrichment()
RETURNS TRIGGER AS $$
BEGIN
  -- Queue enrichment job for new profile
  INSERT INTO public.enrichment_jobs (user_id, profile_id, job_type, priority, source_config)
  VALUES (
    NEW.user_id,
    NEW.id,
    'auto',
    CASE 
      WHEN NEW.is_favorite = true THEN 90
      WHEN NEW.relationship_type IN ('client', 'family', 'mentor') THEN 80
      ELSE 50
    END,
    jsonb_build_object('trigger', 'new_profile', 'created_at', now())
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_auto_enrich_new_profile
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_auto_enrichment();

-- Trigger for surveillance alerts on high-severity anomalies
CREATE OR REPLACE FUNCTION public.trigger_surveillance_alert_on_anomaly()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.severity IN ('high', 'critical') THEN
    INSERT INTO public.surveillance_alerts (
      user_id, profile_id, alert_type, severity, title, description, source, source_data
    )
    VALUES (
      NEW.user_id,
      NEW.profile_id,
      'anomaly',
      NEW.severity,
      'Behavioral Anomaly Detected: ' || NEW.anomaly_type,
      NEW.description,
      'behavioral_anomalies',
      jsonb_build_object('anomaly_id', NEW.id, 'deviation_score', NEW.deviation_score)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_surveillance_alert_anomaly
  AFTER INSERT ON public.behavioral_anomalies
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_surveillance_alert_on_anomaly();

-- Updated timestamp triggers
CREATE TRIGGER update_enrichment_jobs_updated_at
  BEFORE UPDATE ON public.enrichment_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_meeting_intelligence_updated_at
  BEFORE UPDATE ON public.meeting_intelligence
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_web_monitoring_jobs_updated_at
  BEFORE UPDATE ON public.web_monitoring_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gait_analyses_updated_at
  BEFORE UPDATE ON public.gait_analyses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_intervention_playbooks_updated_at
  BEFORE UPDATE ON public.intervention_playbooks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_brand_intelligence_updated_at
  BEFORE UPDATE ON public.brand_intelligence
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();