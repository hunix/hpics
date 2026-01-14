-- =============================================
-- PHASE 1: Alert Service Tables
-- =============================================

-- Alert Rules table for automated alert generation
CREATE TABLE IF NOT EXISTS public.alert_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL DEFAULT 'threshold',
  conditions JSONB NOT NULL DEFAULT '{}',
  actions JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 5,
  cooldown_minutes INTEGER DEFAULT 15,
  last_triggered_at TIMESTAMPTZ,
  trigger_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Alert Notifications table for tracking notification dispatch
CREATE TABLE IF NOT EXISTS public.alert_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  alert_id UUID REFERENCES public.hardware_alerts(id) ON DELETE CASCADE,
  channel TEXT NOT NULL DEFAULT 'in_app',
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- PHASE 2: Historical Analytics Tables
-- =============================================

-- Analytics Forecast table for AI predictions
CREATE TABLE IF NOT EXISTS public.analytics_forecast (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  forecast_type TEXT NOT NULL,
  period TEXT NOT NULL DEFAULT 'daily',
  predictions JSONB NOT NULL DEFAULT '[]',
  confidence_score NUMERIC(4,3) DEFAULT 0.0,
  model_version TEXT,
  valid_from TIMESTAMPTZ DEFAULT now(),
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- PHASE 3: Device Health Monitoring Tables
-- =============================================

-- Device Health Checks table
CREATE TABLE IF NOT EXISTS public.device_health_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id UUID REFERENCES public.hardware_devices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  check_type TEXT NOT NULL,
  health_score INTEGER DEFAULT 100,
  status TEXT DEFAULT 'healthy',
  metrics JSONB DEFAULT '{}',
  issues_detected JSONB DEFAULT '[]',
  recommendations JSONB DEFAULT '[]',
  next_check_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add health columns to hardware_devices (IF NOT EXISTS handles this safely)
ALTER TABLE public.hardware_devices 
ADD COLUMN IF NOT EXISTS battery_level INTEGER,
ADD COLUMN IF NOT EXISTS last_health_check_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS maintenance_due_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS health_status TEXT DEFAULT 'healthy';

-- =============================================
-- PHASE 4: Cross-Device Correlation Tables
-- =============================================

-- Cross Device Correlations table
CREATE TABLE IF NOT EXISTS public.cross_device_correlations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  correlation_type TEXT NOT NULL,
  source_events JSONB NOT NULL DEFAULT '[]',
  correlation_strength NUMERIC(4,3) DEFAULT 0.0,
  findings JSONB DEFAULT '{}',
  location_overlap JSONB,
  time_overlap_seconds INTEGER,
  threat_level TEXT,
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  mission_id UUID REFERENCES public.intelligence_missions(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Correlation Rules table
CREATE TABLE IF NOT EXISTS public.correlation_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  rule_name TEXT NOT NULL,
  source_device_types TEXT[] DEFAULT '{}',
  correlation_logic JSONB NOT NULL DEFAULT '{}',
  auto_generate_alert BOOLEAN DEFAULT false,
  alert_severity TEXT DEFAULT 'medium',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- Enable RLS on all new tables
-- =============================================

ALTER TABLE public.alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_forecast ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cross_device_correlations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.correlation_rules ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS Policies (using DO blocks to avoid duplicates)
-- =============================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'alert_rules' AND policyname = 'Users can view their own alert rules') THEN
    CREATE POLICY "Users can view their own alert rules" ON public.alert_rules FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'alert_rules' AND policyname = 'Users can create their own alert rules') THEN
    CREATE POLICY "Users can create their own alert rules" ON public.alert_rules FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'alert_rules' AND policyname = 'Users can update their own alert rules') THEN
    CREATE POLICY "Users can update their own alert rules" ON public.alert_rules FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'alert_rules' AND policyname = 'Users can delete their own alert rules') THEN
    CREATE POLICY "Users can delete their own alert rules" ON public.alert_rules FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'alert_notifications' AND policyname = 'Users can view their own alert notifications') THEN
    CREATE POLICY "Users can view their own alert notifications" ON public.alert_notifications FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'alert_notifications' AND policyname = 'Users can create their own alert notifications') THEN
    CREATE POLICY "Users can create their own alert notifications" ON public.alert_notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'alert_notifications' AND policyname = 'Users can update their own alert notifications') THEN
    CREATE POLICY "Users can update their own alert notifications" ON public.alert_notifications FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'analytics_forecast' AND policyname = 'Users can view their own forecasts') THEN
    CREATE POLICY "Users can view their own forecasts" ON public.analytics_forecast FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'analytics_forecast' AND policyname = 'Users can create their own forecasts') THEN
    CREATE POLICY "Users can create their own forecasts" ON public.analytics_forecast FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'analytics_forecast' AND policyname = 'Users can update their own forecasts') THEN
    CREATE POLICY "Users can update their own forecasts" ON public.analytics_forecast FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'analytics_forecast' AND policyname = 'Users can delete their own forecasts') THEN
    CREATE POLICY "Users can delete their own forecasts" ON public.analytics_forecast FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'device_health_checks' AND policyname = 'Users can view their own health checks') THEN
    CREATE POLICY "Users can view their own health checks" ON public.device_health_checks FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'device_health_checks' AND policyname = 'Users can create their own health checks') THEN
    CREATE POLICY "Users can create their own health checks" ON public.device_health_checks FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'device_health_checks' AND policyname = 'Users can update their own health checks') THEN
    CREATE POLICY "Users can update their own health checks" ON public.device_health_checks FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'device_health_checks' AND policyname = 'Users can delete their own health checks') THEN
    CREATE POLICY "Users can delete their own health checks" ON public.device_health_checks FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cross_device_correlations' AND policyname = 'Users can view their own correlations') THEN
    CREATE POLICY "Users can view their own correlations" ON public.cross_device_correlations FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cross_device_correlations' AND policyname = 'Users can create their own correlations') THEN
    CREATE POLICY "Users can create their own correlations" ON public.cross_device_correlations FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cross_device_correlations' AND policyname = 'Users can update their own correlations') THEN
    CREATE POLICY "Users can update their own correlations" ON public.cross_device_correlations FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cross_device_correlations' AND policyname = 'Users can delete their own correlations') THEN
    CREATE POLICY "Users can delete their own correlations" ON public.cross_device_correlations FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'correlation_rules' AND policyname = 'Users can view their own correlation rules') THEN
    CREATE POLICY "Users can view their own correlation rules" ON public.correlation_rules FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'correlation_rules' AND policyname = 'Users can create their own correlation rules') THEN
    CREATE POLICY "Users can create their own correlation rules" ON public.correlation_rules FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'correlation_rules' AND policyname = 'Users can update their own correlation rules') THEN
    CREATE POLICY "Users can update their own correlation rules" ON public.correlation_rules FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'correlation_rules' AND policyname = 'Users can delete their own correlation rules') THEN
    CREATE POLICY "Users can delete their own correlation rules" ON public.correlation_rules FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- =============================================
-- Indexes for performance (IF NOT EXISTS)
-- =============================================

CREATE INDEX IF NOT EXISTS idx_alert_rules_user_active ON public.alert_rules(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_alert_notifications_user_status ON public.alert_notifications(user_id, status);
CREATE INDEX IF NOT EXISTS idx_analytics_forecast_user_type ON public.analytics_forecast(user_id, forecast_type);
CREATE INDEX IF NOT EXISTS idx_device_health_checks_device ON public.device_health_checks(device_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cross_device_correlations_user ON public.cross_device_correlations(user_id, created_at DESC);

-- =============================================
-- Enable realtime for key tables (ignore errors if already added)
-- =============================================

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.alert_rules;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.cross_device_correlations;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.device_health_checks;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;