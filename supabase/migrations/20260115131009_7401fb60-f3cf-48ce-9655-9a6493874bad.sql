-- AGIS Enhancement Suite - Complete Tables and Triggers

-- ============================================
-- Table 1: Conversation Scripts (AI-generated dialogue trees)
-- ============================================
CREATE TABLE IF NOT EXISTS public.conversation_scripts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  objective TEXT NOT NULL,
  script_tree JSONB NOT NULL DEFAULT '{}',
  branches JSONB DEFAULT '[]',
  effectiveness_data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- Table 2: Campaign Chains (Cross-domain campaign linking)
-- ============================================
CREATE TABLE IF NOT EXISTS public.campaign_chains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  chain_name TEXT NOT NULL,
  description TEXT,
  trigger_campaign_id UUID,
  trigger_campaign_type TEXT NOT NULL,
  trigger_condition JSONB NOT NULL,
  action_campaign_type TEXT NOT NULL,
  action_config JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  requires_approval BOOLEAN DEFAULT true,
  execution_count INTEGER DEFAULT 0,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- Table 3: Intelligence Snapshots (Historical metric tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS public.intelligence_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  mice_scores JSONB DEFAULT '{}',
  betrayal_scores JSONB DEFAULT '{}',
  sacred_values JSONB DEFAULT '{}',
  gottman_scores JSONB DEFAULT '{}',
  trust_score NUMERIC(3,2),
  overall_vulnerability NUMERIC(3,2),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add unique constraint if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'intelligence_snapshots_user_id_profile_id_snapshot_date_key'
  ) THEN
    ALTER TABLE public.intelligence_snapshots ADD CONSTRAINT intelligence_snapshots_user_id_profile_id_snapshot_date_key UNIQUE (user_id, profile_id, snapshot_date);
  END IF;
END $$;

-- ============================================
-- Table 4: Counter Intelligence Events
-- ============================================
CREATE TABLE IF NOT EXISTS public.counter_intel_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  detection_type TEXT NOT NULL,
  indicators JSONB NOT NULL DEFAULT '[]',
  threat_level TEXT DEFAULT 'low',
  recommended_response JSONB DEFAULT '{}',
  is_resolved BOOLEAN DEFAULT false,
  resolution_notes TEXT,
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- Table 5: Influence Paths (Network mapping)
-- ============================================
CREATE TABLE IF NOT EXISTS public.influence_paths (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  source_profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  path_nodes JSONB NOT NULL DEFAULT '[]',
  influence_strength NUMERIC(3,2),
  path_type TEXT DEFAULT 'direct',
  bottleneck_nodes JSONB DEFAULT '[]',
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- Table 6: Narrative Simulations
-- ============================================
CREATE TABLE IF NOT EXISTS public.narrative_simulations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  simulation_name TEXT NOT NULL,
  narratives JSONB NOT NULL DEFAULT '[]',
  audience_segments JSONB DEFAULT '[]',
  simulation_config JSONB DEFAULT '{}',
  simulation_results JSONB DEFAULT '{}',
  iterations_run INTEGER DEFAULT 0,
  dominant_narrative TEXT,
  status TEXT DEFAULT 'pending',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- Modify elicitation_sessions table
-- ============================================
ALTER TABLE public.elicitation_sessions 
ADD COLUMN IF NOT EXISTS conversation_transcript JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS technique_effectiveness JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS session_recording_url TEXT;

-- ============================================
-- Enable RLS on all new tables
-- ============================================
ALTER TABLE public.conversation_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_chains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intelligence_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counter_intel_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influence_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.narrative_simulations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies (using DO blocks to avoid duplicates)
-- ============================================
DO $$ BEGIN
  CREATE POLICY "Users can manage own conversation scripts" ON public.conversation_scripts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can manage own campaign chains" ON public.campaign_chains FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can manage own intelligence snapshots" ON public.intelligence_snapshots FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can manage own counter intel events" ON public.counter_intel_events FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can manage own influence paths" ON public.influence_paths FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can manage own narrative simulations" ON public.narrative_simulations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- Indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_conversation_scripts_user ON public.conversation_scripts(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_scripts_profile ON public.conversation_scripts(profile_id);
CREATE INDEX IF NOT EXISTS idx_campaign_chains_user ON public.campaign_chains(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_chains_active ON public.campaign_chains(is_active);
CREATE INDEX IF NOT EXISTS idx_intelligence_snapshots_user_profile ON public.intelligence_snapshots(user_id, profile_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_snapshots_date ON public.intelligence_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_counter_intel_events_user ON public.counter_intel_events(user_id);
CREATE INDEX IF NOT EXISTS idx_counter_intel_events_profile ON public.counter_intel_events(profile_id);
CREATE INDEX IF NOT EXISTS idx_counter_intel_events_threat ON public.counter_intel_events(threat_level);
CREATE INDEX IF NOT EXISTS idx_influence_paths_user ON public.influence_paths(user_id);
CREATE INDEX IF NOT EXISTS idx_influence_paths_source ON public.influence_paths(source_profile_id);
CREATE INDEX IF NOT EXISTS idx_influence_paths_target ON public.influence_paths(target_profile_id);
CREATE INDEX IF NOT EXISTS idx_narrative_simulations_user ON public.narrative_simulations(user_id);

-- ============================================
-- Triggers for updated_at
-- ============================================
DROP TRIGGER IF EXISTS update_conversation_scripts_updated_at ON public.conversation_scripts;
CREATE TRIGGER update_conversation_scripts_updated_at
BEFORE UPDATE ON public.conversation_scripts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_campaign_chains_updated_at ON public.campaign_chains;
CREATE TRIGGER update_campaign_chains_updated_at
BEFORE UPDATE ON public.campaign_chains
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Enable Realtime for AGIS tables (ignore if already added)
-- ============================================
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.mice_assessments;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.betrayal_predictions;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.sacred_values;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.counter_intel_events;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;