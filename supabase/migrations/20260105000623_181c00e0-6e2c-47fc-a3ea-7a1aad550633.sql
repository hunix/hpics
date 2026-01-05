-- Add media reference columns to messages table for WhatsApp media imports
ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_id uuid REFERENCES media(id);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_type text;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_filename text;

-- Create index for faster media lookups
CREATE INDEX IF NOT EXISTS idx_messages_media_id ON messages(media_id) WHERE media_id IS NOT NULL;