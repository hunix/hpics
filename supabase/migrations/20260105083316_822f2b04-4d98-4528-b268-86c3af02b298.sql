-- Add main page view preferences
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS main_media_view_mode TEXT DEFAULT 'folders',
ADD COLUMN IF NOT EXISTS main_media_items_per_page INTEGER DEFAULT 24,
ADD COLUMN IF NOT EXISTS main_documents_view_mode TEXT DEFAULT 'folders',
ADD COLUMN IF NOT EXISTS main_documents_items_per_page INTEGER DEFAULT 20;