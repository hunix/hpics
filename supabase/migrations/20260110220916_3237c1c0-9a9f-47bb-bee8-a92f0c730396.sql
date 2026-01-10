-- Drop the conflicting/overlapping RLS policies
DROP POLICY IF EXISTS "Users can create their own psychological profiles" ON public.psychological_profiles;
DROP POLICY IF EXISTS "Users can delete their own psychological profiles" ON public.psychological_profiles;
DROP POLICY IF EXISTS "Users can update their own psychological profiles" ON public.psychological_profiles;
DROP POLICY IF EXISTS "Users with TOP SECRET clearance can manage psychological profil" ON public.psychological_profiles;
DROP POLICY IF EXISTS "Users with TOP SECRET clearance can view psychological profiles" ON public.psychological_profiles;

-- Create new stricter RLS policies requiring SCI clearance (highest level)
CREATE POLICY "SCI clearance required for viewing psychological profiles" 
ON public.psychological_profiles FOR SELECT 
USING (
  auth.uid() = user_id 
  AND has_clearance(auth.uid(), 'sci'::clearance_level)
);

CREATE POLICY "SCI clearance required for inserting psychological profiles" 
ON public.psychological_profiles FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND has_clearance(auth.uid(), 'sci'::clearance_level)
);

CREATE POLICY "SCI clearance required for updating psychological profiles" 
ON public.psychological_profiles FOR UPDATE 
USING (
  auth.uid() = user_id 
  AND has_clearance(auth.uid(), 'sci'::clearance_level)
);

CREATE POLICY "SCI clearance required for deleting psychological profiles" 
ON public.psychological_profiles FOR DELETE 
USING (
  auth.uid() = user_id 
  AND has_clearance(auth.uid(), 'sci'::clearance_level)
);

-- Create an audit log table for tracking access to psychological profiles
CREATE TABLE IF NOT EXISTS public.psychological_profile_access_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID NOT NULL REFERENCES public.psychological_profiles(id) ON DELETE CASCADE,
  target_profile_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('view', 'create', 'update', 'delete')),
  accessed_fields TEXT[],
  ip_address TEXT,
  user_agent TEXT,
  accessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on audit log - only admins can view
ALTER TABLE public.psychological_profile_access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view psychological profile access logs"
ON public.psychological_profile_access_logs FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can insert their own access logs (for logging purposes)
CREATE POLICY "Users can insert their own access logs"
ON public.psychological_profile_access_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create function to log psychological profile access
CREATE OR REPLACE FUNCTION public.log_psychological_profile_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.psychological_profile_access_logs (
    user_id,
    profile_id,
    target_profile_id,
    action,
    accessed_fields
  ) VALUES (
    auth.uid(),
    COALESCE(NEW.id, OLD.id),
    COALESCE(NEW.profile_id, OLD.profile_id),
    TG_OP,
    CASE 
      WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN 
        ARRAY(SELECT key FROM jsonb_object_keys(to_jsonb(NEW)) AS key)
      ELSE 
        ARRAY['all']
    END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger to log all access
DROP TRIGGER IF EXISTS log_psychological_profile_access_trigger ON public.psychological_profiles;
CREATE TRIGGER log_psychological_profile_access_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.psychological_profiles
FOR EACH ROW EXECUTE FUNCTION public.log_psychological_profile_access();

-- Add encrypted versions of the most sensitive fields
ALTER TABLE public.psychological_profiles 
ADD COLUMN IF NOT EXISTS dark_triad_encrypted TEXT,
ADD COLUMN IF NOT EXISTS psychiatric_indicators_encrypted TEXT,
ADD COLUMN IF NOT EXISTS deception_analysis_encrypted TEXT,
ADD COLUMN IF NOT EXISTS behavioral_predictions_encrypted TEXT,
ADD COLUMN IF NOT EXISTS encryption_key_id TEXT,
ADD COLUMN IF NOT EXISTS data_classification TEXT DEFAULT 'SCI' CHECK (data_classification IN ('CONFIDENTIAL', 'SECRET', 'TOP_SECRET', 'SCI'));

-- Add index for audit log queries
CREATE INDEX IF NOT EXISTS idx_psych_access_logs_user ON public.psychological_profile_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_psych_access_logs_profile ON public.psychological_profile_access_logs(profile_id);
CREATE INDEX IF NOT EXISTS idx_psych_access_logs_accessed_at ON public.psychological_profile_access_logs(accessed_at DESC);