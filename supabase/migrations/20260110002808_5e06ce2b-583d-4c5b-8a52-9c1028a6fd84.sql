-- Create storage bucket for face crops if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('face-crops', 'face-crops', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for face-crops bucket
CREATE POLICY "Users can view their own face crops"
ON storage.objects FOR SELECT
USING (bucket_id = 'face-crops' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own face crops"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'face-crops' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own face crops"
ON storage.objects FOR UPDATE
USING (bucket_id = 'face-crops' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own face crops"
ON storage.objects FOR DELETE
USING (bucket_id = 'face-crops' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Also allow public read access since bucket is public
CREATE POLICY "Public can view face crops"
ON storage.objects FOR SELECT
USING (bucket_id = 'face-crops');