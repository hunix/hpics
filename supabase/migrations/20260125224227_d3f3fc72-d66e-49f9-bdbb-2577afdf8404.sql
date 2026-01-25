-- Add detected_language column to media table for language filtering
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS detected_language TEXT;

-- Create index for efficient language-based filtering
CREATE INDEX IF NOT EXISTS idx_media_detected_language ON public.media(detected_language);