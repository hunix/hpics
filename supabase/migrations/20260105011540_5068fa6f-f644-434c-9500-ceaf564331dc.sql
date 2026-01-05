-- Add file view preference columns to user_preferences table
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS media_view_mode TEXT DEFAULT 'grid',
ADD COLUMN IF NOT EXISTS media_items_per_page INTEGER DEFAULT 12,
ADD COLUMN IF NOT EXISTS documents_view_mode TEXT DEFAULT 'list',
ADD COLUMN IF NOT EXISTS documents_items_per_page INTEGER DEFAULT 10;