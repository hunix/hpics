-- Add storage_path column to voice_analysis_items for signed URL generation
ALTER TABLE voice_analysis_items 
ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- Add comment for documentation
COMMENT ON COLUMN voice_analysis_items.storage_path IS 'Storage bucket path for generating signed URLs to access private files';