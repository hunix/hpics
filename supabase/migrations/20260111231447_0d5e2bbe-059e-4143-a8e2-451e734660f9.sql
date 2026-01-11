-- Create temp bucket for server-side ZIP uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('whatsapp-imports-temp', 'whatsapp-imports-temp', false, 5368709120)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for temp bucket
CREATE POLICY "Users can upload their own ZIPs to temp"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'whatsapp-imports-temp' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can read their own ZIPs from temp"
ON storage.objects FOR SELECT
USING (bucket_id = 'whatsapp-imports-temp' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own ZIPs from temp"
ON storage.objects FOR DELETE
USING (bucket_id = 'whatsapp-imports-temp' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add processing_mode column to whatsapp_import_sessions
ALTER TABLE whatsapp_import_sessions 
ADD COLUMN IF NOT EXISTS processing_mode VARCHAR(10) DEFAULT 'client';

-- Add metadata column for storing additional info like contactName
ALTER TABLE whatsapp_import_sessions 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;