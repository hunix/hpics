-- Add storage_path columns for signed URL support
ALTER TABLE media ADD COLUMN IF NOT EXISTS storage_path text;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS storage_path text;

-- Migrate existing file_url values to storage_path (extract path from URL)
UPDATE media 
SET storage_path = regexp_replace(file_url, '^.*/storage/v1/object/public/media/', '')
WHERE storage_path IS NULL AND file_url IS NOT NULL AND file_url LIKE '%/storage/v1/object/public/media/%';

UPDATE documents 
SET storage_path = regexp_replace(file_url, '^.*/storage/v1/object/public/documents/', '')
WHERE storage_path IS NULL AND file_url IS NOT NULL AND file_url LIKE '%/storage/v1/object/public/documents/%';