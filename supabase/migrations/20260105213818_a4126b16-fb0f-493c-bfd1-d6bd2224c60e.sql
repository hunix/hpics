-- Create table for tagging contacts in media (photos/videos)
CREATE TABLE public.media_contact_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id UUID NOT NULL REFERENCES public.media(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  face_position JSONB, -- {x, y, width, height} for bounding box
  tagged_by TEXT NOT NULL DEFAULT 'user' CHECK (tagged_by IN ('ai', 'user')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(media_id, profile_id)
);

-- Enable RLS
ALTER TABLE public.media_contact_tags ENABLE ROW LEVEL SECURITY;

-- RLS policies for media_contact_tags
CREATE POLICY "Users can view their own media contact tags"
ON public.media_contact_tags
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own media contact tags"
ON public.media_contact_tags
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own media contact tags"
ON public.media_contact_tags
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own media contact tags"
ON public.media_contact_tags
FOR DELETE
USING (auth.uid() = user_id);

-- Index for efficient lookup
CREATE INDEX idx_media_contact_tags_media ON public.media_contact_tags(media_id);
CREATE INDEX idx_media_contact_tags_profile ON public.media_contact_tags(profile_id);
CREATE INDEX idx_media_contact_tags_user ON public.media_contact_tags(user_id);