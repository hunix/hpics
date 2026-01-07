-- Function to bootstrap first admin (only works if no admins exist)
CREATE OR REPLACE FUNCTION public.bootstrap_first_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_count integer;
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  SELECT COUNT(*) INTO admin_count 
  FROM user_roles 
  WHERE role = 'admin';
  
  -- Only allow if no admins exist
  IF admin_count = 0 THEN
    -- Insert or update the user's role to admin with SCI clearance
    INSERT INTO user_roles (user_id, role, clearance)
    VALUES (current_user_id, 'admin', 'sci')
    ON CONFLICT (user_id) 
    DO UPDATE SET role = 'admin', clearance = 'sci', updated_at = now();
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Table for counter-surveillance events
CREATE TABLE IF NOT EXISTS public.counter_surveillance_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  event_type text NOT NULL,
  severity text NOT NULL DEFAULT 'medium',
  description text NOT NULL,
  evidence jsonb,
  detected_at timestamptz DEFAULT now(),
  reviewed_by uuid,
  reviewed_at timestamptz,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.counter_surveillance_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for counter_surveillance_events
CREATE POLICY "Users can view their own counter surveillance events"
ON public.counter_surveillance_events
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all counter surveillance events"
ON public.counter_surveillance_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "System can insert counter surveillance events"
ON public.counter_surveillance_events
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Table for key rotation schedule
CREATE TABLE IF NOT EXISTS public.key_rotation_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  key_name text NOT NULL,
  rotation_interval_days integer DEFAULT 90,
  last_rotated_at timestamptz,
  next_rotation_at timestamptz,
  auto_rotate boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.key_rotation_schedule ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can manage their own key rotation schedules"
ON public.key_rotation_schedule
FOR ALL
USING (auth.uid() = user_id);

-- Table for secure deletion records
CREATE TABLE IF NOT EXISTS public.secure_deletion_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  record_type text NOT NULL,
  record_id uuid NOT NULL,
  record_summary text,
  deletion_method text DEFAULT 'crypto_shred',
  shredding_passes integer DEFAULT 3,
  destruction_certificate jsonb,
  deleted_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.secure_deletion_records ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own deletion records"
ON public.secure_deletion_records
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create deletion records"
ON public.secure_deletion_records
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Trigger function for auto cross-referencing contact methods
CREATE OR REPLACE FUNCTION public.populate_cross_references()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- For phone numbers
  IF NEW.contact_type = 'phone' THEN
    INSERT INTO cross_references (profile_id, reference_type, reference_value, normalized_value, source, confidence, user_id)
    VALUES (NEW.profile_id, 'phone', NEW.value, regexp_replace(NEW.value, '[^0-9+]', '', 'g'), 'contact_methods', 0.95, NEW.user_id)
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- For emails
  IF NEW.contact_type = 'email' THEN
    INSERT INTO cross_references (profile_id, reference_type, reference_value, normalized_value, source, confidence, user_id)
    VALUES (NEW.profile_id, 'email', NEW.value, lower(NEW.value), 'contact_methods', 0.95, NEW.user_id)
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for auto cross-referencing (drop first if exists)
DROP TRIGGER IF EXISTS auto_cross_reference_contact_methods ON contact_methods;
CREATE TRIGGER auto_cross_reference_contact_methods
AFTER INSERT OR UPDATE ON contact_methods
FOR EACH ROW EXECUTE FUNCTION populate_cross_references();