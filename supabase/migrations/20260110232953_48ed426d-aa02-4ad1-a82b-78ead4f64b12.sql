-- Add field-level encryption support to contact_methods table
-- This protects email addresses, phone numbers, and other sensitive contact data

-- Add encrypted value column (stores AES-256-GCM encrypted data)
ALTER TABLE public.contact_methods 
ADD COLUMN IF NOT EXISTS value_encrypted TEXT;

-- Add encryption metadata columns
ALTER TABLE public.contact_methods 
ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN DEFAULT false;

ALTER TABLE public.contact_methods 
ADD COLUMN IF NOT EXISTS encryption_classification TEXT DEFAULT 'confidential';

-- Add last_accessed_at for audit trail
ALTER TABLE public.contact_methods 
ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster lookups on encrypted status
CREATE INDEX IF NOT EXISTS idx_contact_methods_encrypted 
ON public.contact_methods(is_encrypted) WHERE is_encrypted = true;

-- Create contact_methods_access_logs table for audit trail
CREATE TABLE IF NOT EXISTS public.contact_methods_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  contact_method_id UUID NOT NULL REFERENCES public.contact_methods(id) ON DELETE CASCADE,
  access_type TEXT NOT NULL, -- 'view', 'decrypt', 'export', 'share'
  accessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address INET,
  user_agent TEXT,
  was_decrypted BOOLEAN DEFAULT false,
  access_context TEXT, -- 'ui', 'api', 'export', 'sync'
  -- Hash chain for tamper-proof audit trail
  previous_hash TEXT,
  current_hash TEXT,
  CONSTRAINT valid_access_type CHECK (access_type IN ('view', 'decrypt', 'export', 'share', 'update', 'delete'))
);

-- Enable RLS on access logs
ALTER TABLE public.contact_methods_access_logs ENABLE ROW LEVEL SECURITY;

-- Only service role and admins can view audit logs
CREATE POLICY "Service role can manage access logs"
ON public.contact_methods_access_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Users can view their own access logs
CREATE POLICY "Users can view their own access logs"
ON public.contact_methods_access_logs
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Create hash chain function for contact_methods_access_logs
CREATE OR REPLACE FUNCTION public.compute_contact_method_access_hash()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  last_hash TEXT;
  hash_input TEXT;
BEGIN
  -- Get the previous hash
  SELECT current_hash INTO last_hash
  FROM public.contact_methods_access_logs
  WHERE contact_method_id = NEW.contact_method_id
  ORDER BY accessed_at DESC
  LIMIT 1;
  
  NEW.previous_hash := COALESCE(last_hash, 'GENESIS');
  
  -- Compute current hash
  hash_input := NEW.user_id::text || NEW.contact_method_id::text || 
                NEW.access_type || NEW.accessed_at::text || 
                COALESCE(NEW.was_decrypted::text, 'false') ||
                NEW.previous_hash;
  
  NEW.current_hash := encode(sha256(hash_input::bytea), 'hex');
  
  RETURN NEW;
END;
$$;

-- Create trigger for hash chain
DROP TRIGGER IF EXISTS contact_method_access_hash_trigger ON public.contact_methods_access_logs;
CREATE TRIGGER contact_method_access_hash_trigger
  BEFORE INSERT ON public.contact_methods_access_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.compute_contact_method_access_hash();

-- Function to log contact method access
CREATE OR REPLACE FUNCTION public.log_contact_method_access(
  p_contact_method_id UUID,
  p_access_type TEXT,
  p_was_decrypted BOOLEAN DEFAULT false,
  p_access_context TEXT DEFAULT 'ui',
  p_ip_address INET DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.contact_methods_access_logs (
    user_id,
    contact_method_id,
    access_type,
    was_decrypted,
    access_context,
    ip_address
  ) VALUES (
    auth.uid(),
    p_contact_method_id,
    p_access_type,
    p_was_decrypted,
    p_access_context,
    p_ip_address
  )
  RETURNING id INTO log_id;
  
  -- Update last_accessed_at on the contact method
  UPDATE public.contact_methods 
  SET last_accessed_at = now()
  WHERE id = p_contact_method_id;
  
  RETURN log_id;
END;
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contact_methods_access_logs_user 
ON public.contact_methods_access_logs(user_id, accessed_at DESC);

CREATE INDEX IF NOT EXISTS idx_contact_methods_access_logs_method 
ON public.contact_methods_access_logs(contact_method_id, accessed_at DESC);

-- Add comment explaining the security model
COMMENT ON TABLE public.contact_methods IS 
'Stores contact methods with field-level AES-256-GCM encryption. 
Sensitive values (emails, phones) are stored in value_encrypted column. 
All access is logged to contact_methods_access_logs with tamper-proof hash chain.';