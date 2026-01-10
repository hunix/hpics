-- Add encrypted columns to email_messages table
ALTER TABLE public.email_messages 
ADD COLUMN IF NOT EXISTS body_encrypted TEXT,
ADD COLUMN IF NOT EXISTS subject_encrypted TEXT,
ADD COLUMN IF NOT EXISTS encryption_classification TEXT DEFAULT 'confidential',
ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN DEFAULT false;

-- Add encrypted columns to email_threads table  
ALTER TABLE public.email_threads
ADD COLUMN IF NOT EXISTS subject_encrypted TEXT,
ADD COLUMN IF NOT EXISTS encryption_classification TEXT DEFAULT 'confidential',
ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN DEFAULT false;

-- Create MBOX import sessions table for tracking large imports
CREATE TABLE IF NOT EXISTS public.mbox_import_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_name TEXT,
  file_size BIGINT,
  total_emails INTEGER DEFAULT 0,
  processed_emails INTEGER DEFAULT 0,
  matched_emails INTEGER DEFAULT 0,
  failed_emails INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'uploading', 'processing', 'matching', 'completed', 'failed', 'cancelled')),
  error_message TEXT,
  storage_path TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on mbox_import_sessions
ALTER TABLE public.mbox_import_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for mbox_import_sessions
CREATE POLICY "Users can view their own import sessions"
  ON public.mbox_import_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own import sessions"
  ON public.mbox_import_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own import sessions"
  ON public.mbox_import_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Create email access audit log table (separate from immutable_audit_logs for performance)
CREATE TABLE IF NOT EXISTS public.email_access_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email_message_id UUID REFERENCES public.email_messages(id) ON DELETE SET NULL,
  email_thread_id UUID REFERENCES public.email_threads(id) ON DELETE SET NULL,
  access_type TEXT NOT NULL CHECK (access_type IN ('view', 'decrypt', 'export', 'search', 'ai_analysis')),
  ip_address INET,
  user_agent TEXT,
  accessed_fields TEXT[],
  was_decrypted BOOLEAN DEFAULT false,
  clearance_used TEXT,
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Hash chain for tamper detection
  previous_hash TEXT,
  current_hash TEXT
);

-- Enable RLS on email_access_logs
ALTER TABLE public.email_access_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view email access logs
CREATE POLICY "Admins can view email access logs"
  ON public.email_access_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- System can insert access logs (via service role)
CREATE POLICY "System can insert email access logs"
  ON public.email_access_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_access_logs_user_id ON public.email_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_access_logs_accessed_at ON public.email_access_logs(accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_access_logs_email_message_id ON public.email_access_logs(email_message_id);

-- Create index on email_messages for encryption status
CREATE INDEX IF NOT EXISTS idx_email_messages_is_encrypted ON public.email_messages(is_encrypted);
CREATE INDEX IF NOT EXISTS idx_email_threads_is_encrypted ON public.email_threads(is_encrypted);

-- Function to compute hash for email access log chain
CREATE OR REPLACE FUNCTION public.compute_email_access_hash()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prev_hash TEXT;
  hash_input TEXT;
BEGIN
  -- Get the previous hash
  SELECT current_hash INTO prev_hash
  FROM email_access_logs
  WHERE user_id = NEW.user_id
  ORDER BY accessed_at DESC
  LIMIT 1;
  
  NEW.previous_hash := prev_hash;
  
  -- Compute current hash
  hash_input := COALESCE(prev_hash, 'GENESIS') || '|' ||
                NEW.user_id::text || '|' ||
                COALESCE(NEW.email_message_id::text, '') || '|' ||
                COALESCE(NEW.email_thread_id::text, '') || '|' ||
                NEW.access_type || '|' ||
                NEW.accessed_at::text;
  
  NEW.current_hash := encode(sha256(hash_input::bytea), 'hex');
  
  RETURN NEW;
END;
$$;

-- Trigger to compute hash on insert
CREATE TRIGGER compute_email_access_hash_trigger
  BEFORE INSERT ON public.email_access_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.compute_email_access_hash();

-- Function to log email access (called from edge functions/client)
CREATE OR REPLACE FUNCTION public.log_email_access(
  p_email_message_id UUID DEFAULT NULL,
  p_email_thread_id UUID DEFAULT NULL,
  p_access_type TEXT DEFAULT 'view',
  p_accessed_fields TEXT[] DEFAULT NULL,
  p_was_decrypted BOOLEAN DEFAULT false,
  p_clearance_used TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO email_access_logs (
    user_id,
    email_message_id,
    email_thread_id,
    access_type,
    accessed_fields,
    was_decrypted,
    clearance_used
  ) VALUES (
    auth.uid(),
    p_email_message_id,
    p_email_thread_id,
    p_access_type,
    p_accessed_fields,
    p_was_decrypted,
    p_clearance_used
  )
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$;

-- Create storage bucket for MBOX imports
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'mbox-imports',
  'mbox-imports',
  false,
  5368709120, -- 5GB limit for large archives
  ARRAY['application/mbox', 'application/octet-stream', 'text/plain']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for mbox-imports bucket
CREATE POLICY "Users can upload their own mbox files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'mbox-imports' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own mbox files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'mbox-imports' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own mbox files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'mbox-imports' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Add trigger to update updated_at on mbox_import_sessions
CREATE TRIGGER update_mbox_import_sessions_updated_at
  BEFORE UPDATE ON public.mbox_import_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();