-- Hardware Alerts Table for real-time anomaly notifications
CREATE TABLE public.hardware_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  device_id UUID REFERENCES public.hardware_devices(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'low',
  title TEXT NOT NULL,
  description TEXT,
  source_data JSONB DEFAULT '{}',
  is_acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by TEXT,
  auto_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Intelligence Fusion Events Table for cross-modal correlations
CREATE TABLE public.intelligence_fusion_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  correlation_id TEXT,
  sources JSONB NOT NULL DEFAULT '[]',
  fusion_result JSONB DEFAULT '{}',
  confidence_score NUMERIC(3,2) DEFAULT 0,
  threat_level TEXT,
  priority TEXT DEFAULT 'medium',
  location_data JSONB,
  temporal_data JSONB,
  recommendations JSONB DEFAULT '[]',
  is_processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Hardware Analytics Snapshots for historical data
CREATE TABLE public.hardware_analytics_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  snapshot_type TEXT NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  metrics JSONB NOT NULL DEFAULT '{}',
  device_stats JSONB DEFAULT '{}',
  alert_summary JSONB DEFAULT '{}',
  fusion_summary JSONB DEFAULT '{}',
  trend_indicators JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hardware_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intelligence_fusion_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hardware_analytics_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policies for hardware_alerts
CREATE POLICY "Users can view their own hardware alerts" 
ON public.hardware_alerts FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own hardware alerts" 
ON public.hardware_alerts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own hardware alerts" 
ON public.hardware_alerts FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own hardware alerts" 
ON public.hardware_alerts FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for intelligence_fusion_events
CREATE POLICY "Users can view their own fusion events" 
ON public.intelligence_fusion_events FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own fusion events" 
ON public.intelligence_fusion_events FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own fusion events" 
ON public.intelligence_fusion_events FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for hardware_analytics_snapshots
CREATE POLICY "Users can view their own analytics snapshots" 
ON public.hardware_analytics_snapshots FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own analytics snapshots" 
ON public.hardware_analytics_snapshots FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_hardware_alerts_user_unack ON public.hardware_alerts(user_id, is_acknowledged) WHERE is_acknowledged = false;
CREATE INDEX idx_hardware_alerts_severity ON public.hardware_alerts(user_id, severity);
CREATE INDEX idx_hardware_alerts_device ON public.hardware_alerts(device_id);
CREATE INDEX idx_fusion_events_user ON public.intelligence_fusion_events(user_id, created_at DESC);
CREATE INDEX idx_fusion_events_correlation ON public.intelligence_fusion_events(correlation_id);
CREATE INDEX idx_fusion_events_threat ON public.intelligence_fusion_events(user_id, threat_level);
CREATE INDEX idx_analytics_snapshots_user ON public.hardware_analytics_snapshots(user_id, snapshot_type, period_end DESC);

-- Enable realtime for alerts and fusion events
ALTER PUBLICATION supabase_realtime ADD TABLE public.hardware_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.intelligence_fusion_events;

-- Trigger for updated_at on hardware_alerts
CREATE TRIGGER update_hardware_alerts_updated_at
BEFORE UPDATE ON public.hardware_alerts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();