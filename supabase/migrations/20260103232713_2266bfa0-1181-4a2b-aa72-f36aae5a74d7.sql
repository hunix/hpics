-- Create table for storing generated temporal mosaics
CREATE TABLE public.video_mosaics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  media_id UUID NOT NULL REFERENCES public.media(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mosaic_url TEXT NOT NULL,
  frame_count INTEGER NOT NULL,
  grid_cols INTEGER NOT NULL,
  grid_rows INTEGER NOT NULL,
  cell_width INTEGER NOT NULL,
  cell_height INTEGER NOT NULL,
  canvas_width INTEGER NOT NULL,
  canvas_height INTEGER NOT NULL,
  video_duration NUMERIC NOT NULL,
  frames_per_second NUMERIC NOT NULL,
  model_key TEXT NOT NULL,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.video_mosaics ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own mosaics" 
ON public.video_mosaics 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own mosaics" 
ON public.video_mosaics 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mosaics" 
ON public.video_mosaics 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_video_mosaics_media_id ON public.video_mosaics(media_id);
CREATE INDEX idx_video_mosaics_profile_id ON public.video_mosaics(profile_id);

-- Create storage bucket for mosaics
INSERT INTO storage.buckets (id, name, public) VALUES ('mosaics', 'mosaics', false);

-- Create storage policies for mosaics bucket
CREATE POLICY "Users can view their own mosaic files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'mosaics' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own mosaic files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'mosaics' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own mosaic files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'mosaics' AND auth.uid()::text = (storage.foldername(name))[1]);