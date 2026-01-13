-- =============================================
-- Reliability Engine Database Tables
-- Phase 3: Core persistence tables
-- =============================================

-- Task checkpoints for multi-step task recovery
CREATE TABLE public.task_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  task_id TEXT NOT NULL,
  task_name TEXT NOT NULL,
  current_step INTEGER DEFAULT 0,
  total_steps INTEGER NOT NULL,
  data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for fast user lookups
CREATE INDEX idx_task_checkpoints_user_id ON public.task_checkpoints(user_id);
CREATE INDEX idx_task_checkpoints_task_id ON public.task_checkpoints(task_id);
CREATE INDEX idx_task_checkpoints_status ON public.task_checkpoints(status);

-- Enable RLS
ALTER TABLE public.task_checkpoints ENABLE ROW LEVEL SECURITY;

-- RLS Policies for task_checkpoints
CREATE POLICY "Users can view their own task checkpoints"
  ON public.task_checkpoints FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own task checkpoints"
  ON public.task_checkpoints FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own task checkpoints"
  ON public.task_checkpoints FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own task checkpoints"
  ON public.task_checkpoints FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- Error logs for centralized error tracking
-- =============================================
CREATE TABLE public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  reference_id TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL,
  message TEXT,
  severity TEXT DEFAULT 'error' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  category TEXT,
  context JSONB DEFAULT '{}',
  stack_trace TEXT,
  user_agent TEXT,
  url TEXT,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for error querying
CREATE INDEX idx_error_logs_user_id ON public.error_logs(user_id);
CREATE INDEX idx_error_logs_code ON public.error_logs(code);
CREATE INDEX idx_error_logs_severity ON public.error_logs(severity);
CREATE INDEX idx_error_logs_created_at ON public.error_logs(created_at DESC);
CREATE INDEX idx_error_logs_reference_id ON public.error_logs(reference_id);

-- Enable RLS
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for error_logs
CREATE POLICY "Users can view their own error logs"
  ON public.error_logs FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Anyone can create error logs"
  ON public.error_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own error logs"
  ON public.error_logs FOR UPDATE
  USING (auth.uid() = user_id);

-- =============================================
-- Document integrity hashes for verification
-- =============================================
CREATE TABLE public.document_hashes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  document_id UUID NOT NULL,
  document_type TEXT NOT NULL,
  hash TEXT NOT NULL,
  algorithm TEXT DEFAULT 'SHA-256',
  file_size BIGINT,
  metadata JSONB DEFAULT '{}',
  is_valid BOOLEAN DEFAULT true,
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(document_id, algorithm)
);

-- Create indexes
CREATE INDEX idx_document_hashes_user_id ON public.document_hashes(user_id);
CREATE INDEX idx_document_hashes_document_id ON public.document_hashes(document_id);
CREATE INDEX idx_document_hashes_hash ON public.document_hashes(hash);

-- Enable RLS
ALTER TABLE public.document_hashes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document_hashes
CREATE POLICY "Users can view their own document hashes"
  ON public.document_hashes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own document hashes"
  ON public.document_hashes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own document hashes"
  ON public.document_hashes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own document hashes"
  ON public.document_hashes FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- Compliance violations tracking
-- =============================================
CREATE TABLE public.compliance_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  rule_id TEXT NOT NULL,
  rule_name TEXT,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  category TEXT,
  description TEXT,
  field_path TEXT,
  expected_value TEXT,
  actual_value TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved', 'escalated', 'false_positive')),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  resolution_notes TEXT,
  escalated_to TEXT,
  escalation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_compliance_violations_user_id ON public.compliance_violations(user_id);
CREATE INDEX idx_compliance_violations_rule_id ON public.compliance_violations(rule_id);
CREATE INDEX idx_compliance_violations_status ON public.compliance_violations(status);
CREATE INDEX idx_compliance_violations_severity ON public.compliance_violations(severity);
CREATE INDEX idx_compliance_violations_entity ON public.compliance_violations(entity_type, entity_id);

-- Enable RLS
ALTER TABLE public.compliance_violations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for compliance_violations
CREATE POLICY "Users can view their own compliance violations"
  ON public.compliance_violations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own compliance violations"
  ON public.compliance_violations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own compliance violations"
  ON public.compliance_violations FOR UPDATE
  USING (auth.uid() = user_id);

-- =============================================
-- Saga transactions for multi-step operations
-- =============================================
CREATE TABLE public.saga_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  saga_name TEXT NOT NULL,
  saga_type TEXT,
  steps JSONB NOT NULL,
  current_step INTEGER DEFAULT 0,
  total_steps INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'compensating', 'compensated', 'cancelled')),
  context JSONB DEFAULT '{}',
  result JSONB,
  error_message TEXT,
  audit_log JSONB DEFAULT '[]',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_saga_transactions_user_id ON public.saga_transactions(user_id);
CREATE INDEX idx_saga_transactions_status ON public.saga_transactions(status);
CREATE INDEX idx_saga_transactions_saga_name ON public.saga_transactions(saga_name);
CREATE INDEX idx_saga_transactions_created_at ON public.saga_transactions(created_at DESC);

-- Enable RLS
ALTER TABLE public.saga_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for saga_transactions
CREATE POLICY "Users can view their own saga transactions"
  ON public.saga_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saga transactions"
  ON public.saga_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saga transactions"
  ON public.saga_transactions FOR UPDATE
  USING (auth.uid() = user_id);

-- =============================================
-- Updated at triggers
-- =============================================
CREATE TRIGGER update_task_checkpoints_updated_at
  BEFORE UPDATE ON public.task_checkpoints
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_compliance_violations_updated_at
  BEFORE UPDATE ON public.compliance_violations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_saga_transactions_updated_at
  BEFORE UPDATE ON public.saga_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();