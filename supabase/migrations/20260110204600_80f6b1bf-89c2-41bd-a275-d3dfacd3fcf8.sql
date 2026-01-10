-- Create device_presence table for tracking extension connection status
CREATE TABLE public.device_presence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  device_type TEXT NOT NULL DEFAULT 'chrome_extension',
  device_id TEXT,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, device_type)
);

-- Enable RLS
ALTER TABLE public.device_presence ENABLE ROW LEVEL SECURITY;

-- Users can only read their own presence
CREATE POLICY "Users can view their own device presence"
ON public.device_presence
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own presence (for service role upserts, RLS is bypassed)
CREATE POLICY "Users can insert their own device presence"
ON public.device_presence
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own presence
CREATE POLICY "Users can update their own device presence"
ON public.device_presence
FOR UPDATE
USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_device_presence_updated_at
BEFORE UPDATE ON public.device_presence
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();