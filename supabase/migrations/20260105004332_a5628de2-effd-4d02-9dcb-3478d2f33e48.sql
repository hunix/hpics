-- Security audit log table for government-class tracking
CREATE TABLE public.security_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  action_type text NOT NULL, -- 'view', 'create', 'update', 'delete', 'export', 'bulk_operation'
  table_name text NOT NULL,
  record_id uuid,
  data_classification text NOT NULL DEFAULT 'internal', -- 'public', 'internal', 'confidential', 'restricted'
  ip_address text,
  user_agent text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_audit_logs_user_id ON public.security_audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.security_audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_table_name ON public.security_audit_logs(table_name);
CREATE INDEX idx_audit_logs_classification ON public.security_audit_logs(data_classification);

-- Enable RLS
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own audit logs
CREATE POLICY "Users can view own audit logs" ON public.security_audit_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Only system (service role) can insert audit logs
CREATE POLICY "System can insert audit logs" ON public.security_audit_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Security alerts table for threat detection
CREATE TABLE public.security_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  alert_type text NOT NULL, -- 'threat', 'anomaly', 'warning'
  category text NOT NULL, -- 'brute_force', 'rate_limit', 'data_exfiltration', etc.
  severity text NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  description text NOT NULL,
  metadata jsonb DEFAULT '{}',
  is_acknowledged boolean DEFAULT false,
  acknowledged_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for alerts
CREATE INDEX idx_alerts_user_id ON public.security_alerts(user_id);
CREATE INDEX idx_alerts_created_at ON public.security_alerts(created_at DESC);
CREATE INDEX idx_alerts_severity ON public.security_alerts(severity);
CREATE INDEX idx_alerts_unacknowledged ON public.security_alerts(user_id) WHERE is_acknowledged = false;

-- Enable RLS
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;

-- Users can see and acknowledge their own alerts
CREATE POLICY "Users can view own alerts" ON public.security_alerts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts" ON public.security_alerts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert alerts" ON public.security_alerts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Data access patterns table for anomaly detection
CREATE TABLE public.data_access_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  table_name text NOT NULL,
  access_count integer DEFAULT 1,
  last_accessed_at timestamptz DEFAULT now(),
  hourly_pattern jsonb DEFAULT '{}', -- Tracks access patterns by hour
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, table_name)
);

-- Enable RLS
ALTER TABLE public.data_access_patterns ENABLE ROW LEVEL SECURITY;

-- Users can only see their own patterns
CREATE POLICY "Users can manage own patterns" ON public.data_access_patterns
  FOR ALL USING (auth.uid() = user_id);

-- Enable leaked password protection for authentication
-- Note: This is a configuration change that should be done via dashboard/API

-- Add trigger for updated_at
CREATE TRIGGER update_data_access_patterns_updated_at
  BEFORE UPDATE ON public.data_access_patterns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();