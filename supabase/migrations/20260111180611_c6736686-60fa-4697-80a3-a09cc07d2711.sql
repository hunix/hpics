-- Location History table for GPS tracking
CREATE TABLE public.location_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  latitude NUMERIC(10,7) NOT NULL,
  longitude NUMERIC(10,7) NOT NULL,
  altitude NUMERIC,
  accuracy NUMERIC,
  speed NUMERIC,
  heading NUMERIC,
  place_name TEXT,
  place_type TEXT,
  recorded_at TIMESTAMPTZ NOT NULL,
  activity_type TEXT,
  steps_since_last INTEGER,
  source TEXT DEFAULT 'mobile',
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Movement Routes table
CREATE TABLE public.movement_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  start_location_id UUID REFERENCES public.location_history(id) ON DELETE SET NULL,
  end_location_id UUID REFERENCES public.location_history(id) ON DELETE SET NULL,
  route_polyline TEXT,
  distance_meters NUMERIC,
  duration_minutes NUMERIC,
  transport_mode TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  waypoints JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Sync Cursors for differential sync
CREATE TABLE public.sync_cursors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  source_type TEXT NOT NULL,
  source_identifier TEXT,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  last_sync_at TIMESTAMPTZ,
  last_item_timestamp TIMESTAMPTZ,
  last_item_id TEXT,
  items_synced_total INTEGER DEFAULT 0,
  sync_hash TEXT,
  sync_status TEXT DEFAULT 'idle',
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, source_type, source_identifier)
);

-- Message fingerprints for deduplication
CREATE TABLE public.message_fingerprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  fingerprint TEXT NOT NULL,
  source_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, fingerprint)
);

-- Indexes for performance
CREATE INDEX idx_location_history_user_time ON public.location_history(user_id, recorded_at DESC);
CREATE INDEX idx_location_history_profile ON public.location_history(profile_id) WHERE profile_id IS NOT NULL;
CREATE INDEX idx_movement_routes_user ON public.movement_routes(user_id, start_time DESC);
CREATE INDEX idx_sync_cursors_user_source ON public.sync_cursors(user_id, source_type);
CREATE INDEX idx_message_fingerprints_lookup ON public.message_fingerprints(user_id, fingerprint);

-- Enable RLS
ALTER TABLE public.location_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movement_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_cursors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_fingerprints ENABLE ROW LEVEL SECURITY;

-- RLS Policies for location_history
CREATE POLICY "Users can view own location history"
  ON public.location_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own location history"
  ON public.location_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own location history"
  ON public.location_history FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for movement_routes
CREATE POLICY "Users can view own routes"
  ON public.movement_routes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own routes"
  ON public.movement_routes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own routes"
  ON public.movement_routes FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for sync_cursors
CREATE POLICY "Users can view own sync cursors"
  ON public.sync_cursors FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own sync cursors"
  ON public.sync_cursors FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for message_fingerprints
CREATE POLICY "Users can view own fingerprints"
  ON public.message_fingerprints FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own fingerprints"
  ON public.message_fingerprints FOR ALL
  USING (auth.uid() = user_id);

-- Function to update sync_cursors updated_at
CREATE OR REPLACE FUNCTION public.update_sync_cursor_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sync_cursors_timestamp
  BEFORE UPDATE ON public.sync_cursors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_sync_cursor_timestamp();