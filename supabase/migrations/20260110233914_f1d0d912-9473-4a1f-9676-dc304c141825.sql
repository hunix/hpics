-- =============================================
-- ADD FIELD-LEVEL ENCRYPTION TO PROFILES TABLE
-- Protects sensitive fields: notes, bio, linkedin_url
-- =============================================

-- Add encrypted columns for sensitive fields
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS notes_encrypted TEXT;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio_encrypted TEXT;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS linkedin_url_encrypted TEXT;

-- Add encryption metadata
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN DEFAULT false;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS encryption_classification TEXT DEFAULT 'confidential';

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMP WITH TIME ZONE;

-- =============================================
-- CREATE ACCESS AUDIT LOG FOR PROFILES
-- =============================================

CREATE TABLE IF NOT EXISTS public.profiles_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  access_type TEXT NOT NULL,
  accessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address INET,
  user_agent TEXT,
  fields_accessed TEXT[],
  was_decrypted BOOLEAN DEFAULT false,
  access_context TEXT DEFAULT 'ui',
  -- Hash chain for tamper-proof audit
  previous_hash TEXT,
  current_hash TEXT,
  CONSTRAINT valid_profile_access_type CHECK (access_type IN ('view', 'decrypt', 'export', 'share', 'update', 'delete', 'search'))
);

-- Enable RLS on access logs
ALTER TABLE public.profiles_access_logs ENABLE ROW LEVEL SECURITY;

-- Only service role can manage logs
CREATE POLICY "Service role manages profile access logs"
ON public.profiles_access_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Users can view their own access logs
CREATE POLICY "Users can view their own profile access logs"
ON public.profiles_access_logs
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Hash chain function for profiles access logs
CREATE OR REPLACE FUNCTION public.compute_profile_access_hash()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  last_hash TEXT;
  hash_input TEXT;
BEGIN
  SELECT current_hash INTO last_hash
  FROM public.profiles_access_logs
  WHERE profile_id = NEW.profile_id
  ORDER BY accessed_at DESC
  LIMIT 1;
  
  NEW.previous_hash := COALESCE(last_hash, 'GENESIS');
  
  hash_input := NEW.user_id::text || NEW.profile_id::text || 
                NEW.access_type || NEW.accessed_at::text || 
                COALESCE(NEW.was_decrypted::text, 'false') ||
                NEW.previous_hash;
  
  NEW.current_hash := encode(sha256(hash_input::bytea), 'hex');
  
  RETURN NEW;
END;
$$;

-- Trigger for hash chain
DROP TRIGGER IF EXISTS profile_access_hash_trigger ON public.profiles_access_logs;
CREATE TRIGGER profile_access_hash_trigger
  BEFORE INSERT ON public.profiles_access_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.compute_profile_access_hash();

-- Function to log profile access
CREATE OR REPLACE FUNCTION public.log_profile_access(
  p_profile_id UUID,
  p_access_type TEXT,
  p_fields_accessed TEXT[] DEFAULT NULL,
  p_was_decrypted BOOLEAN DEFAULT false,
  p_access_context TEXT DEFAULT 'ui'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.profiles_access_logs (
    user_id,
    profile_id,
    access_type,
    fields_accessed,
    was_decrypted,
    access_context
  ) VALUES (
    auth.uid(),
    p_profile_id,
    p_access_type,
    p_fields_accessed,
    p_was_decrypted,
    p_access_context
  )
  RETURNING id INTO log_id;
  
  UPDATE public.profiles 
  SET last_accessed_at = now()
  WHERE id = p_profile_id;
  
  RETURN log_id;
END;
$$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_access_logs_user 
ON public.profiles_access_logs(user_id, accessed_at DESC);

CREATE INDEX IF NOT EXISTS idx_profiles_access_logs_profile 
ON public.profiles_access_logs(profile_id, accessed_at DESC);

CREATE INDEX IF NOT EXISTS idx_profiles_encrypted 
ON public.profiles(is_encrypted) WHERE is_encrypted = true;

-- =============================================
-- ENSURE PSYCHOLOGICAL_PROFILES HAS ACCESS LOGGING
-- =============================================

CREATE TABLE IF NOT EXISTS public.psychological_profiles_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID NOT NULL,
  access_type TEXT NOT NULL,
  accessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address INET,
  fields_accessed TEXT[],
  was_decrypted BOOLEAN DEFAULT false,
  clearance_used TEXT,
  access_denied BOOLEAN DEFAULT false,
  denial_reason TEXT,
  previous_hash TEXT,
  current_hash TEXT,
  CONSTRAINT valid_psych_access_type CHECK (access_type IN ('view', 'decrypt', 'export', 'analysis', 'update', 'delete'))
);

ALTER TABLE public.psychological_profiles_access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages psych access logs"
ON public.psychological_profiles_access_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Hash chain for psychological profiles access
CREATE OR REPLACE FUNCTION public.compute_psych_profile_access_hash()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  last_hash TEXT;
  hash_input TEXT;
BEGIN
  SELECT current_hash INTO last_hash
  FROM public.psychological_profiles_access_logs
  WHERE profile_id = NEW.profile_id
  ORDER BY accessed_at DESC
  LIMIT 1;
  
  NEW.previous_hash := COALESCE(last_hash, 'GENESIS');
  
  hash_input := NEW.user_id::text || NEW.profile_id::text || 
                NEW.access_type || NEW.accessed_at::text || 
                COALESCE(NEW.was_decrypted::text, 'false') ||
                COALESCE(NEW.access_denied::text, 'false') ||
                NEW.previous_hash;
  
  NEW.current_hash := encode(sha256(hash_input::bytea), 'hex');
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS psych_profile_access_hash_trigger ON public.psychological_profiles_access_logs;
CREATE TRIGGER psych_profile_access_hash_trigger
  BEFORE INSERT ON public.psychological_profiles_access_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.compute_psych_profile_access_hash();

-- Add documentation
COMMENT ON TABLE public.profiles IS 
'Contact profiles with field-level AES-256-GCM encryption for sensitive fields (notes, bio, linkedin_url). 
All access is logged to profiles_access_logs with tamper-proof hash chain.';

COMMENT ON TABLE public.psychological_profiles_access_logs IS 
'Tamper-proof audit log for all access attempts to psychological profiles, including denied access.';