-- Create data retention policies table
CREATE TABLE public.data_retention_policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  data_category TEXT NOT NULL, -- 'messages', 'biometrics', 'financial', 'analytics', 'logs', 'interactions'
  table_name TEXT NOT NULL,
  retention_days INTEGER NOT NULL DEFAULT 365,
  delete_strategy TEXT NOT NULL DEFAULT 'soft_delete', -- 'soft_delete', 'hard_delete', 'anonymize'
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  last_executed_at TIMESTAMPTZ,
  records_deleted INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, table_name)
);

-- Create retention execution log
CREATE TABLE public.data_retention_execution_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  policy_id UUID REFERENCES public.data_retention_policies(id) ON DELETE CASCADE,
  table_name TEXT NOT NULL,
  records_processed INTEGER NOT NULL DEFAULT 0,
  records_deleted INTEGER NOT NULL DEFAULT 0,
  records_anonymized INTEGER NOT NULL DEFAULT 0,
  execution_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER
);

-- Enable RLS
ALTER TABLE public.data_retention_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_retention_execution_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for data_retention_policies
CREATE POLICY "Users can view their own retention policies"
  ON public.data_retention_policies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own retention policies"
  ON public.data_retention_policies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own retention policies"
  ON public.data_retention_policies FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own retention policies"
  ON public.data_retention_policies FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for execution log
CREATE POLICY "Users can view their own retention logs"
  ON public.data_retention_execution_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own retention logs"
  ON public.data_retention_execution_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_data_retention_policies_updated_at
  BEFORE UPDATE ON public.data_retention_policies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default retention policies template (will be copied per-user on first access)
-- Categories with GDPR/CCPA recommended defaults:
-- - Messages: 2 years (730 days)
-- - Biometrics: 90 days (sensitive data)
-- - Financial: 7 years (2555 days) for compliance
-- - Analytics: 1 year (365 days)
-- - Logs: 90 days
-- - Interactions: 3 years (1095 days)

-- Create index for efficient querying
CREATE INDEX idx_retention_policies_user_enabled ON public.data_retention_policies(user_id, is_enabled);
CREATE INDEX idx_retention_execution_log_policy ON public.data_retention_execution_log(policy_id, started_at DESC);