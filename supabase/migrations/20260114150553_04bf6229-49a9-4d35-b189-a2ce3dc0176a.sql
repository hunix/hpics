-- Hardware Intelligence Platform - Phase 1: Foundation
-- Core tables for hardware device management and intelligence operations

-- Hardware device registry
CREATE TABLE public.hardware_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  device_type TEXT NOT NULL,
  device_id TEXT NOT NULL,
  device_name TEXT,
  device_model TEXT,
  firmware_version TEXT,
  capabilities JSONB DEFAULT '{}',
  configuration JSONB DEFAULT '{}',
  location JSONB, -- {lat, lng, accuracy}
  location_name TEXT,
  last_seen_at TIMESTAMPTZ,
  is_online BOOLEAN DEFAULT false,
  battery_level INTEGER,
  signal_strength INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, device_id)
);

-- Hardware telemetry stream
CREATE TABLE public.hardware_telemetry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES public.hardware_devices ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  telemetry_type TEXT NOT NULL,
  data JSONB NOT NULL,
  location JSONB,
  priority TEXT DEFAULT 'normal',
  processed BOOLEAN DEFAULT false,
  recorded_at TIMESTAMPTZ DEFAULT now()
);

-- Intelligence missions/operations
CREATE TABLE public.intelligence_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  mission_name TEXT NOT NULL,
  mission_type TEXT NOT NULL,
  target_profile_id UUID REFERENCES public.profiles ON DELETE SET NULL,
  target_location JSONB,
  target_location_name TEXT,
  target_radius_meters INTEGER,
  devices_assigned UUID[] DEFAULT '{}',
  parameters JSONB DEFAULT '{}',
  automation_rules JSONB DEFAULT '{}',
  status TEXT DEFAULT 'planned',
  priority TEXT DEFAULT 'normal',
  scheduled_start TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  findings JSONB DEFAULT '{}',
  summary TEXT,
  threat_level TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Mission events/timeline
CREATE TABLE public.mission_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID REFERENCES public.intelligence_missions ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  device_id UUID REFERENCES public.hardware_devices ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  location JSONB,
  severity TEXT DEFAULT 'info',
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Hardware command queue
CREATE TABLE public.hardware_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES public.hardware_devices ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  mission_id UUID REFERENCES public.intelligence_missions ON DELETE SET NULL,
  command_type TEXT NOT NULL,
  command_data JSONB NOT NULL,
  priority INTEGER DEFAULT 5,
  status TEXT DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  acknowledged_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  response JSONB,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RF Signal captures
CREATE TABLE public.rf_signal_captures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  device_id UUID REFERENCES public.hardware_devices ON DELETE SET NULL,
  mission_id UUID REFERENCES public.intelligence_missions ON DELETE SET NULL,
  signal_type TEXT NOT NULL,
  frequency_hz DECIMAL,
  bandwidth_hz DECIMAL,
  protocol TEXT,
  modulation TEXT,
  signal_strength_dbm DECIMAL,
  raw_data_url TEXT,
  decoded_data JSONB,
  device_fingerprint JSONB,
  associated_profile_id UUID REFERENCES public.profiles ON DELETE SET NULL,
  threat_classification TEXT,
  analysis JSONB,
  location JSONB,
  location_name TEXT,
  captured_at TIMESTAMPTZ DEFAULT now()
);

-- Thermal imaging captures
CREATE TABLE public.thermal_captures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  device_id UUID REFERENCES public.hardware_devices ON DELETE SET NULL,
  mission_id UUID REFERENCES public.intelligence_missions ON DELETE SET NULL,
  raw_thermal_url TEXT,
  processed_image_url TEXT,
  overlay_image_url TEXT,
  detected_signatures JSONB DEFAULT '[]',
  ambient_temperature_celsius DECIMAL,
  min_temperature_celsius DECIMAL,
  max_temperature_celsius DECIMAL,
  occupancy_count INTEGER,
  heat_anomalies JSONB DEFAULT '[]',
  analysis JSONB,
  associated_profile_id UUID REFERENCES public.profiles ON DELETE SET NULL,
  location JSONB,
  location_name TEXT,
  captured_at TIMESTAMPTZ DEFAULT now()
);

-- Aerial reconnaissance
CREATE TABLE public.aerial_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  mission_id UUID REFERENCES public.intelligence_missions ON DELETE SET NULL,
  drone_device_id UUID REFERENCES public.hardware_devices ON DELETE SET NULL,
  waypoints JSONB NOT NULL DEFAULT '[]',
  flight_path JSONB,
  flight_mode TEXT DEFAULT 'manual',
  altitude_meters DECIMAL,
  speed_mps DECIMAL,
  camera_settings JSONB DEFAULT '{}',
  telemetry_log JSONB DEFAULT '[]',
  weather_conditions JSONB,
  status TEXT DEFAULT 'planned',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  total_distance_meters DECIMAL,
  flight_duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Aerial captures
CREATE TABLE public.aerial_captures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aerial_mission_id UUID REFERENCES public.aerial_missions ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  capture_type TEXT NOT NULL,
  media_url TEXT,
  thumbnail_url TEXT,
  location JSONB,
  altitude_meters DECIMAL,
  heading_degrees DECIMAL,
  gimbal_pitch_degrees DECIMAL,
  detected_objects JSONB DEFAULT '[]',
  analysis JSONB,
  captured_at TIMESTAMPTZ DEFAULT now()
);

-- Sensor network nodes
CREATE TABLE public.sensor_network_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  hardware_device_id UUID REFERENCES public.hardware_devices ON DELETE SET NULL,
  node_address TEXT NOT NULL,
  node_name TEXT,
  node_type TEXT,
  sensors JSONB DEFAULT '[]',
  location JSONB,
  location_description TEXT,
  zone_name TEXT,
  battery_level DECIMAL,
  solar_voltage DECIMAL,
  signal_strength INTEGER,
  last_reading_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  alert_rules JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Sensor readings
CREATE TABLE public.sensor_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id UUID REFERENCES public.sensor_network_nodes ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  mission_id UUID REFERENCES public.intelligence_missions ON DELETE SET NULL,
  sensor_type TEXT NOT NULL,
  value DECIMAL NOT NULL,
  unit TEXT,
  anomaly_detected BOOLEAN DEFAULT false,
  anomaly_type TEXT,
  alert_triggered BOOLEAN DEFAULT false,
  recorded_at TIMESTAMPTZ DEFAULT now()
);

-- TSCM sweeps
CREATE TABLE public.tscm_sweeps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  mission_id UUID REFERENCES public.intelligence_missions ON DELETE SET NULL,
  sweep_name TEXT,
  location_name TEXT,
  location JSONB,
  location_bounds JSONB,
  sweep_type TEXT NOT NULL,
  devices_used UUID[] DEFAULT '{}',
  rf_findings JSONB DEFAULT '[]',
  thermal_findings JSONB DEFAULT '[]',
  acoustic_findings JSONB DEFAULT '[]',
  visual_findings JSONB DEFAULT '[]',
  threat_level TEXT,
  overall_findings JSONB DEFAULT '{}',
  recommendations JSONB DEFAULT '[]',
  sweep_duration_minutes INTEGER,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Metal detection sweeps
CREATE TABLE public.metal_detection_sweeps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  mission_id UUID REFERENCES public.intelligence_missions ON DELETE SET NULL,
  device_id UUID REFERENCES public.hardware_devices ON DELETE SET NULL,
  location_name TEXT,
  location JSONB,
  detection_points JSONB DEFAULT '[]',
  sweep_area JSONB,
  findings_summary JSONB,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.hardware_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hardware_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intelligence_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hardware_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rf_signal_captures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thermal_captures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aerial_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aerial_captures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensor_network_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tscm_sweeps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metal_detection_sweeps ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own devices" ON public.hardware_devices FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own telemetry" ON public.hardware_telemetry FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own missions" ON public.intelligence_missions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own mission events" ON public.mission_events FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own commands" ON public.hardware_commands FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own RF captures" ON public.rf_signal_captures FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own thermal captures" ON public.thermal_captures FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own aerial missions" ON public.aerial_missions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own aerial captures" ON public.aerial_captures FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own sensor nodes" ON public.sensor_network_nodes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own sensor readings" ON public.sensor_readings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own TSCM sweeps" ON public.tscm_sweeps FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own metal detection sweeps" ON public.metal_detection_sweeps FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_hardware_devices_user_type ON public.hardware_devices(user_id, device_type);
CREATE INDEX idx_hardware_devices_online ON public.hardware_devices(user_id, is_online);
CREATE INDEX idx_hardware_telemetry_device ON public.hardware_telemetry(device_id, recorded_at DESC);
CREATE INDEX idx_intelligence_missions_status ON public.intelligence_missions(user_id, status);
CREATE INDEX idx_mission_events_mission ON public.mission_events(mission_id, created_at DESC);
CREATE INDEX idx_hardware_commands_device ON public.hardware_commands(device_id, status);
CREATE INDEX idx_rf_signal_captures_user ON public.rf_signal_captures(user_id, captured_at DESC);
CREATE INDEX idx_thermal_captures_user ON public.thermal_captures(user_id, captured_at DESC);
CREATE INDEX idx_sensor_readings_node ON public.sensor_readings(node_id, recorded_at DESC);

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.hardware_devices;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hardware_telemetry;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mission_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hardware_commands;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sensor_readings;

-- Triggers for updated_at
CREATE TRIGGER update_hardware_devices_updated_at
  BEFORE UPDATE ON public.hardware_devices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_intelligence_missions_updated_at
  BEFORE UPDATE ON public.intelligence_missions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sensor_network_nodes_updated_at
  BEFORE UPDATE ON public.sensor_network_nodes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();