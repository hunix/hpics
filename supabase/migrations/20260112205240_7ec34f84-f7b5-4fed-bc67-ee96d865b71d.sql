-- Create voice-recordings bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('voice-recordings', 'voice-recordings', false)
ON CONFLICT (id) DO NOTHING;

-- Add SELECT policy for media bucket so users can read their uploaded files
CREATE POLICY "Users can read their own media files"
ON storage.objects FOR SELECT
USING (bucket_id = 'media' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- Voice recordings bucket policies
CREATE POLICY "Users can upload voice recordings"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'voice-recordings' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can read their own voice recordings"
ON storage.objects FOR SELECT
USING (bucket_id = 'voice-recordings' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own voice recordings"
ON storage.objects FOR DELETE
USING (bucket_id = 'voice-recordings' AND (auth.uid())::text = (storage.foldername(name))[1]);