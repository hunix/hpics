-- Create synced calendar events table for Google and Outlook calendar sync
CREATE TABLE public.synced_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('google', 'outlook')),
  external_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  location TEXT,
  attendees JSONB DEFAULT '[]',
  matched_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  raw_data JSONB,
  synced_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, source, external_id)
);

-- Enable Row Level Security
ALTER TABLE public.synced_calendar_events ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own synced events
CREATE POLICY "Users can view their synced events"
  ON public.synced_calendar_events FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can create their own synced events  
CREATE POLICY "Users can create their synced events"
  ON public.synced_calendar_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their synced events
CREATE POLICY "Users can update their synced events"
  ON public.synced_calendar_events FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policy: Users can delete their synced events
CREATE POLICY "Users can delete their synced events"
  ON public.synced_calendar_events FOR DELETE
  USING (auth.uid() = user_id);

-- Index for efficient querying by user and time
CREATE INDEX idx_synced_events_user_time ON public.synced_calendar_events(user_id, start_time);
CREATE INDEX idx_synced_events_source ON public.synced_calendar_events(user_id, source);