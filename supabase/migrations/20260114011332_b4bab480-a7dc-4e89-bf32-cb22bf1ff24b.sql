
-- Phase 3: Enhanced Security Architecture

-- Create data classification enum
DO $$ BEGIN
  CREATE TYPE data_classification AS ENUM ('public', 'internal', 'confidential', 'restricted', 'top_secret');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create encryption key rotation tracking table
CREATE TABLE IF NOT EXISTS public.encryption_key_rotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  key_version INTEGER NOT NULL DEFAULT 1,
  algorithm TEXT NOT NULL DEFAULT 'AES-256-GCM',
  created_at TIMESTAMPTZ DEFAULT now(),
  rotated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active', -- 'active', 'rotating', 'retired', 'compromised'
  affected_tables TEXT[],
  rotation_started_by TEXT,
  rotation_completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create data classification tags table
CREATE TABLE IF NOT EXISTS public.data_classification_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  table_name TEXT NOT NULL,
  column_name TEXT,
  classification TEXT NOT NULL DEFAULT 'internal',
  requires_encryption BOOLEAN DEFAULT false,
  requires_audit BOOLEAN DEFAULT true,
  retention_days INTEGER,
  pii_type TEXT, -- 'name', 'email', 'phone', 'address', 'ssn', 'financial', 'health', 'biometric'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, table_name, column_name)
);

-- Create cryptographic audit verification table
CREATE TABLE IF NOT EXISTS public.audit_chain_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  verification_type TEXT NOT NULL, -- 'periodic', 'manual', 'triggered'
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  total_entries_checked INTEGER,
  valid_entries INTEGER,
  invalid_entries INTEGER,
  first_broken_at TIMESTAMPTZ,
  broken_entry_id UUID,
  verification_hash TEXT,
  status TEXT NOT NULL, -- 'valid', 'broken', 'in_progress', 'failed'
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create data residency controls table
CREATE TABLE IF NOT EXISTS public.data_residency_controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  data_region TEXT NOT NULL DEFAULT 'us', -- 'us', 'eu', 'apac', 'global'
  sovereignty_requirements TEXT[], -- 'gdpr', 'ccpa', 'hipaa', 'sox'
  allowed_processing_regions TEXT[] DEFAULT ARRAY['us'],
  restricted_from_regions TEXT[],
  requires_consent BOOLEAN DEFAULT false,
  consent_obtained_at TIMESTAMPTZ,
  consent_expires_at TIMESTAMPTZ,
  retention_policy TEXT,
  deletion_requested_at TIMESTAMPTZ,
  deletion_scheduled_for TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create security events table for real-time monitoring
CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL, -- 'access_attempt', 'encryption_failure', 'anomaly_detected', 'policy_violation', 'key_rotation', 'data_export'
  severity TEXT NOT NULL DEFAULT 'info', -- 'info', 'warning', 'critical', 'emergency'
  source_ip INET,
  user_agent TEXT,
  resource_type TEXT,
  resource_id UUID,
  action_taken TEXT,
  action_successful BOOLEAN,
  failure_reason TEXT,
  risk_score NUMERIC,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create field-level access controls table
CREATE TABLE IF NOT EXISTS public.field_access_controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  table_name TEXT NOT NULL,
  field_name TEXT NOT NULL,
  required_clearance TEXT DEFAULT 'uncleared',
  required_roles TEXT[],
  required_compartments TEXT[],
  encryption_required BOOLEAN DEFAULT false,
  mask_pattern TEXT, -- e.g., '***-**-{last4}' for SSN
  audit_access BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, table_name, field_name)
);

-- Create tamper detection alerts table
CREATE TABLE IF NOT EXISTS public.tamper_detection_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  detection_type TEXT NOT NULL, -- 'hash_mismatch', 'sequence_gap', 'timestamp_anomaly', 'unauthorized_modification'
  affected_table TEXT NOT NULL,
  affected_record_id UUID,
  expected_value TEXT,
  actual_value TEXT,
  detected_at TIMESTAMPTZ DEFAULT now(),
  investigated_at TIMESTAMPTZ,
  investigated_by UUID,
  resolution TEXT,
  is_resolved BOOLEAN DEFAULT false,
  severity TEXT NOT NULL DEFAULT 'critical',
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS on all new tables
ALTER TABLE public.encryption_key_rotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_classification_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_chain_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_residency_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_access_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tamper_detection_alerts ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own encryption keys" ON public.encryption_key_rotations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own encryption keys" ON public.encryption_key_rotations FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own classification tags" ON public.data_classification_tags FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own classification tags" ON public.data_classification_tags FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own audit verifications" ON public.audit_chain_verifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own audit verifications" ON public.audit_chain_verifications FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own residency controls" ON public.data_residency_controls FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own residency controls" ON public.data_residency_controls FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own security events" ON public.security_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own security events" ON public.security_events FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own field access controls" ON public.field_access_controls FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own field access controls" ON public.field_access_controls FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own tamper alerts" ON public.tamper_detection_alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own tamper alerts" ON public.tamper_detection_alerts FOR ALL USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_security_events_user_type ON public.security_events(user_id, event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON public.security_events(severity) WHERE severity IN ('critical', 'emergency');
CREATE INDEX IF NOT EXISTS idx_tamper_alerts_unresolved ON public.tamper_detection_alerts(user_id) WHERE NOT is_resolved;
CREATE INDEX IF NOT EXISTS idx_data_residency_profile ON public.data_residency_controls(profile_id);

-- Triggers for updated_at
CREATE TRIGGER update_data_classification_tags_updated_at
  BEFORE UPDATE ON public.data_classification_tags
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_residency_controls_updated_at
  BEFORE UPDATE ON public.data_residency_controls
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_field_access_controls_updated_at
  BEFORE UPDATE ON public.field_access_controls
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to verify audit chain integrity
CREATE OR REPLACE FUNCTION public.verify_audit_chain_segment(
  p_user_id UUID,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE(
  is_valid BOOLEAN,
  total_checked INTEGER,
  first_broken_id UUID,
  broken_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  prev_hash TEXT := NULL;
  current_record RECORD;
  checked_count INTEGER := 0;
  computed_hash TEXT;
BEGIN
  is_valid := true;
  total_checked := 0;
  first_broken_id := NULL;
  broken_at := NULL;
  
  FOR current_record IN
    SELECT * FROM immutable_audit_logs
    WHERE user_id = p_user_id
      AND (p_start_date IS NULL OR created_at >= p_start_date)
      AND (p_end_date IS NULL OR created_at <= p_end_date)
    ORDER BY created_at ASC
  LOOP
    checked_count := checked_count + 1;
    
    -- Verify previous hash matches
    IF prev_hash IS NOT NULL AND current_record.previous_hash != prev_hash THEN
      is_valid := false;
      first_broken_id := current_record.id;
      broken_at := current_record.created_at;
      EXIT;
    END IF;
    
    prev_hash := current_record.current_hash;
  END LOOP;
  
  total_checked := checked_count;
  RETURN NEXT;
END;
$$;

-- Function to log security event
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type TEXT,
  p_severity TEXT DEFAULT 'info',
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id UUID DEFAULT NULL,
  p_action_taken TEXT DEFAULT NULL,
  p_action_successful BOOLEAN DEFAULT true,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  event_id UUID;
BEGIN
  INSERT INTO security_events (
    user_id, event_type, severity, resource_type, resource_id,
    action_taken, action_successful, metadata
  ) VALUES (
    auth.uid(), p_event_type, p_severity, p_resource_type, p_resource_id,
    p_action_taken, p_action_successful, p_metadata
  )
  RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$;
