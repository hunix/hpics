-- Store import session state for resume capability
CREATE TABLE public.whatsapp_import_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  file_name text,
  file_size integer,
  
  -- Parsed data (stored for resume)
  total_messages integer DEFAULT 0,
  total_media_files integer DEFAULT 0,
  
  -- Progress tracking
  messages_imported integer DEFAULT 0,
  media_uploaded integer DEFAULT 0,
  
  -- Skipped/failed tracking
  skipped_files jsonb DEFAULT '[]',
  failed_files jsonb DEFAULT '[]',
  
  -- Duplicate handling
  duplicate_action text DEFAULT 'ask',
  existing_conversation_id uuid REFERENCES public.conversations(id) ON DELETE SET NULL,
  new_conversation_id uuid REFERENCES public.conversations(id) ON DELETE SET NULL,
  
  -- State for resume
  last_processed_index integer DEFAULT 0,
  parsed_messages jsonb,
  media_files_state jsonb,
  
  paused_at timestamptz,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whatsapp_import_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own import sessions"
  ON public.whatsapp_import_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own import sessions"
  ON public.whatsapp_import_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own import sessions"
  ON public.whatsapp_import_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own import sessions"
  ON public.whatsapp_import_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE TRIGGER update_whatsapp_import_sessions_updated_at
  BEFORE UPDATE ON public.whatsapp_import_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for finding active sessions
CREATE INDEX idx_whatsapp_import_sessions_user_status 
  ON public.whatsapp_import_sessions(user_id, status);