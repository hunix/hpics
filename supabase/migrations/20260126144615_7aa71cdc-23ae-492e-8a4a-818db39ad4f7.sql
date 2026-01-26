-- Expand voice_insights source_type constraint to include new recording types
ALTER TABLE voice_insights 
DROP CONSTRAINT IF EXISTS voice_insights_source_type_check;

ALTER TABLE voice_insights 
ADD CONSTRAINT voice_insights_source_type_check 
CHECK (source_type = ANY (ARRAY[
  'voice_note', 
  'meeting_recording', 
  'media', 
  'whatsapp_audio',
  'voice_recording_session',
  'voice_recording'
]));