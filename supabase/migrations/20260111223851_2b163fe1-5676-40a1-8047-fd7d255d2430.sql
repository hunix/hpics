-- Phase 1 & 2: Enhance bulk_upload_sessions and bulk_upload_items tables

-- Add resumability tracking columns to sessions
ALTER TABLE bulk_upload_sessions 
  ADD COLUMN IF NOT EXISTS resumable_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ DEFAULT NOW();

-- Add content_hash for duplicate detection
ALTER TABLE bulk_upload_items 
  ADD COLUMN IF NOT EXISTS content_hash VARCHAR(64);

-- Create index for efficient history queries
CREATE INDEX IF NOT EXISTS idx_bulk_sessions_user_date 
  ON bulk_upload_sessions(user_id, created_at DESC);

-- Create index for resumable sessions
CREATE INDEX IF NOT EXISTS idx_bulk_sessions_resumable 
  ON bulk_upload_sessions(user_id, status, resumable_until) 
  WHERE status IN ('paused', 'uploading');

-- Create index for fast duplicate lookups
CREATE INDEX IF NOT EXISTS idx_bulk_items_hash 
  ON bulk_upload_items(content_hash) 
  WHERE status = 'uploaded' AND content_hash IS NOT NULL;

-- Create index for session items lookup
CREATE INDEX IF NOT EXISTS idx_bulk_items_session 
  ON bulk_upload_items(session_id, status);

-- Enable realtime for upload tables (Phase 7)
ALTER PUBLICATION supabase_realtime ADD TABLE bulk_upload_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE bulk_upload_items;

-- Create function to update last_activity_at
CREATE OR REPLACE FUNCTION update_session_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE bulk_upload_sessions 
  SET last_activity_at = NOW()
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for activity tracking
DROP TRIGGER IF EXISTS track_upload_activity ON bulk_upload_items;
CREATE TRIGGER track_upload_activity
  AFTER UPDATE ON bulk_upload_items
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION update_session_activity();