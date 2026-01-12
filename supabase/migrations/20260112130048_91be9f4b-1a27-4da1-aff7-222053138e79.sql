-- Phase 12: Mobile Life-Analysis Ecosystem Database Tables

-- Geofence management for contact-linked location zones
CREATE TABLE public.geofences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  radius_meters INTEGER NOT NULL DEFAULT 100,
  trigger_on_enter BOOLEAN DEFAULT true,
  trigger_on_exit BOOLEAN DEFAULT true,
  notification_enabled BOOLEAN DEFAULT true,
  notification_message TEXT,
  geofence_type TEXT DEFAULT 'custom',
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  trigger_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.geofences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own geofences" ON public.geofences
  FOR ALL USING (auth.uid() = user_id);

-- Proximity events - when you were near known contacts
CREATE TABLE public.proximity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  detected_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  detection_method TEXT NOT NULL,
  confidence REAL DEFAULT 0.5,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  location_accuracy REAL,
  location_name TEXT,
  device_info JSONB,
  duration_seconds INTEGER,
  interaction_type TEXT,
  context_data JSONB,
  detected_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.proximity_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own proximity events" ON public.proximity_events
  FOR ALL USING (auth.uid() = user_id);

-- Live transcriptions with speaker identification
CREATE TABLE public.live_transcriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_id UUID NOT NULL,
  recording_id UUID REFERENCES public.meeting_recordings(id) ON DELETE SET NULL,
  speaker_label TEXT,
  matched_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  match_confidence REAL,
  text TEXT NOT NULL,
  language TEXT DEFAULT 'en',
  sentiment_score REAL,
  keywords TEXT[],
  is_question BOOLEAN DEFAULT false,
  is_commitment BOOLEAN DEFAULT false,
  timestamp_start REAL NOT NULL,
  timestamp_end REAL,
  word_count INTEGER,
  audio_quality_score REAL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.live_transcriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own transcriptions" ON public.live_transcriptions
  FOR ALL USING (auth.uid() = user_id);

-- Context snapshots - periodic sensor fusion data
CREATE TABLE public.context_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  snapshot_type TEXT NOT NULL,
  trigger_source TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  location_accuracy REAL,
  location_name TEXT,
  location_type TEXT,
  activity_type TEXT,
  activity_confidence REAL,
  step_count INTEGER,
  ambient_light_level REAL,
  ambient_noise_level REAL,
  is_indoor BOOLEAN,
  weather_conditions JSONB,
  battery_level REAL,
  network_type TEXT,
  connected_bluetooth_devices JSONB,
  heart_rate INTEGER,
  stress_level REAL,
  nearby_contacts JSONB,
  calendar_event_id TEXT,
  inferred_context TEXT,
  context_confidence REAL,
  ai_insights JSONB,
  captured_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.context_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own context snapshots" ON public.context_snapshots
  FOR ALL USING (auth.uid() = user_id);

-- Automation rules - IFTTT-style triggers
CREATE TABLE public.automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL,
  trigger_config JSONB NOT NULL,
  conditions JSONB DEFAULT '[]',
  action_type TEXT NOT NULL,
  action_config JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  cooldown_minutes INTEGER DEFAULT 60,
  max_daily_executions INTEGER DEFAULT 10,
  execution_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  last_triggered_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  last_error TEXT,
  priority INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own automation rules" ON public.automation_rules
  FOR ALL USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_geofences_user_active ON public.geofences(user_id, is_active);
CREATE INDEX idx_geofences_profile ON public.geofences(profile_id) WHERE profile_id IS NOT NULL;
CREATE INDEX idx_geofences_location ON public.geofences(latitude, longitude) WHERE is_active = true;

CREATE INDEX idx_proximity_events_user_time ON public.proximity_events(user_id, detected_at DESC);
CREATE INDEX idx_proximity_events_profile ON public.proximity_events(detected_profile_id, detected_at DESC);
CREATE INDEX idx_proximity_events_method ON public.proximity_events(user_id, detection_method);

CREATE INDEX idx_live_transcriptions_session ON public.live_transcriptions(session_id, timestamp_start);
CREATE INDEX idx_live_transcriptions_profile ON public.live_transcriptions(matched_profile_id) WHERE matched_profile_id IS NOT NULL;
CREATE INDEX idx_live_transcriptions_search ON public.live_transcriptions USING gin(to_tsvector('english', text));

CREATE INDEX idx_context_snapshots_user_time ON public.context_snapshots(user_id, captured_at DESC);
CREATE INDEX idx_context_snapshots_type ON public.context_snapshots(user_id, inferred_context);
CREATE INDEX idx_context_snapshots_location ON public.context_snapshots(latitude, longitude) WHERE latitude IS NOT NULL;

CREATE INDEX idx_automation_rules_user_active ON public.automation_rules(user_id, is_active);
CREATE INDEX idx_automation_rules_trigger ON public.automation_rules(trigger_type) WHERE is_active = true;

-- Triggers for updated_at
CREATE TRIGGER update_geofences_updated_at
  BEFORE UPDATE ON public.geofences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_automation_rules_updated_at
  BEFORE UPDATE ON public.automation_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();