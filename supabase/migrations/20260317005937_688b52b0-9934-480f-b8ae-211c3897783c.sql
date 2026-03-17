
-- Cached vulnerability intelligence from real CVE feeds
CREATE TABLE public.vulnerability_intel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  cve_id text NOT NULL,
  platform text,
  cvss_score numeric,
  epss_score numeric,
  is_exploited_in_wild boolean DEFAULT false,
  source text,
  description text,
  remediation text,
  exploit_references jsonb DEFAULT '[]'::jsonb,
  affected_versions jsonb DEFAULT '[]'::jsonb,
  attack_vector text,
  attack_complexity text,
  severity text,
  fetched_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, cve_id)
);

-- Red team scenarios generated and tracked
CREATE TABLE public.red_team_scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  cve_id text,
  target_platform text NOT NULL,
  target_device_id uuid,
  attack_scenario jsonb NOT NULL DEFAULT '{}'::jsonb,
  defense_plan jsonb NOT NULL DEFAULT '{}'::jsonb,
  exploit_chain jsonb DEFAULT '[]'::jsonb,
  prerequisites jsonb DEFAULT '[]'::jsonb,
  patch_checklist jsonb DEFAULT '[]'::jsonb,
  agent_assigned text,
  status text DEFAULT 'pending',
  priority text DEFAULT 'medium',
  execution_notes jsonb DEFAULT '[]'::jsonb,
  verification_result jsonb,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

-- User device inventory for continuous scanning
CREATE TABLE public.device_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  device_name text NOT NULL,
  device_type text NOT NULL,
  os_name text,
  os_version text,
  manufacturer text,
  model text,
  cpe_identifiers jsonb DEFAULT '[]'::jsonb,
  installed_apps jsonb DEFAULT '[]'::jsonb,
  accounts jsonb DEFAULT '[]'::jsonb,
  security_config jsonb DEFAULT '{}'::jsonb,
  last_scanned_at timestamptz,
  vulnerability_count int DEFAULT 0,
  critical_count int DEFAULT 0,
  risk_level text DEFAULT 'unknown',
  scan_results jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS policies
ALTER TABLE public.vulnerability_intel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.red_team_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own vulnerability intel" ON public.vulnerability_intel FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own red team scenarios" ON public.red_team_scenarios FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own device inventory" ON public.device_inventory FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Service role bypass for edge functions
CREATE POLICY "Service role full access vulnerability_intel" ON public.vulnerability_intel FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access red_team_scenarios" ON public.red_team_scenarios FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access device_inventory" ON public.device_inventory FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX idx_vulnerability_intel_user ON public.vulnerability_intel(user_id);
CREATE INDEX idx_vulnerability_intel_cve ON public.vulnerability_intel(cve_id);
CREATE INDEX idx_vulnerability_intel_platform ON public.vulnerability_intel(platform);
CREATE INDEX idx_vulnerability_intel_severity ON public.vulnerability_intel(severity);
CREATE INDEX idx_red_team_scenarios_user ON public.red_team_scenarios(user_id);
CREATE INDEX idx_red_team_scenarios_status ON public.red_team_scenarios(status);
CREATE INDEX idx_red_team_scenarios_platform ON public.red_team_scenarios(target_platform);
CREATE INDEX idx_device_inventory_user ON public.device_inventory(user_id);
CREATE INDEX idx_device_inventory_risk ON public.device_inventory(risk_level);
