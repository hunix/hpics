-- =============================================
-- PHASE 1: Core Security Infrastructure
-- =============================================

-- 1.1 Clearance levels enum
CREATE TYPE public.clearance_level AS ENUM ('uncleared', 'confidential', 'secret', 'top_secret', 'sci');

-- 1.2 App roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'supervisor', 'analyst', 'viewer');

-- 1.3 User roles table with clearance system
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'viewer',
  clearance clearance_level NOT NULL DEFAULT 'uncleared',
  clearance_granted_at timestamptz,
  clearance_expires_at timestamptz,
  granted_by uuid,
  compartments text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 1.4 Security Definer Functions (bypass RLS to prevent recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.has_clearance(_user_id uuid, _required clearance_level)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND clearance >= _required
      AND (clearance_expires_at IS NULL OR clearance_expires_at > NOW())
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_clearance(_user_id uuid)
RETURNS clearance_level
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT clearance FROM public.user_roles WHERE user_id = _user_id),
    'uncleared'::clearance_level
  )
$$;

CREATE OR REPLACE FUNCTION public.has_compartment(_user_id uuid, _compartment text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND _compartment = ANY(compartments)
  )
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own role"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Auto-create role for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role, clearance)
  VALUES (NEW.id, 'viewer', 'uncleared')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_role
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- =============================================
-- PHASE 2: Field-Level Encryption System
-- =============================================

-- 2.1 Encryption Key Management
CREATE TABLE public.encryption_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name text UNIQUE NOT NULL,
  key_version integer DEFAULT 1,
  algorithm text DEFAULT 'AES-256-GCM',
  key_hash text NOT NULL, -- Hash of actual key (key stored in secrets)
  created_at timestamptz DEFAULT now(),
  rotated_at timestamptz,
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  user_id uuid REFERENCES auth.users(id) NOT NULL
);

ALTER TABLE public.encryption_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their encryption keys"
ON public.encryption_keys FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage encryption keys"
ON public.encryption_keys FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- 2.2 Encrypted Fields Registry
CREATE TABLE public.encrypted_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  column_name text NOT NULL,
  encryption_key_id uuid REFERENCES encryption_keys(id),
  data_classification clearance_level NOT NULL,
  encryption_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  UNIQUE(table_name, column_name, user_id)
);

ALTER TABLE public.encrypted_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their encrypted fields"
ON public.encrypted_fields FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage encrypted fields"
ON public.encrypted_fields FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- PHASE 3: Immutable Audit System
-- =============================================

-- 3.1 Tamper-Proof Audit Log
CREATE TABLE public.immutable_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_number bigserial UNIQUE,
  previous_hash text NOT NULL,
  current_hash text NOT NULL,
  user_id uuid NOT NULL,
  action_type text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  data_classification clearance_level,
  clearance_used clearance_level,
  ip_address inet,
  user_agent text,
  request_metadata jsonb,
  response_status text,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.immutable_audit_logs ENABLE ROW LEVEL SECURITY;

-- Prevent modifications
CREATE RULE no_update_immutable_audit AS ON UPDATE TO immutable_audit_logs DO INSTEAD NOTHING;
CREATE RULE no_delete_immutable_audit AS ON DELETE TO immutable_audit_logs DO INSTEAD NOTHING;

-- RLS: Only users with SECRET+ can view audit logs
CREATE POLICY "Users with SECRET clearance can view audit logs"
ON public.immutable_audit_logs FOR SELECT
USING (public.has_clearance(auth.uid(), 'secret'));

CREATE POLICY "System can insert audit logs"
ON public.immutable_audit_logs FOR INSERT
WITH CHECK (true);

-- =============================================
-- PHASE 4: Cross-Reference Intelligence Engine
-- =============================================

-- 4.1 Entity Links Table
CREATE TABLE public.entity_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type text NOT NULL,
  source_id text NOT NULL,
  target_type text NOT NULL,
  target_id text NOT NULL,
  link_type text NOT NULL,
  confidence_score numeric(4,3) DEFAULT 0,
  evidence jsonb,
  discovered_at timestamptz DEFAULT now(),
  verified_by uuid REFERENCES auth.users(id),
  verified_at timestamptz,
  is_confirmed boolean DEFAULT false,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(source_type, source_id, target_type, target_id, user_id)
);

ALTER TABLE public.entity_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their entity links"
ON public.entity_links FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their entity links"
ON public.entity_links FOR ALL
USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_entity_links_source ON public.entity_links(source_type, source_id, user_id);
CREATE INDEX idx_entity_links_target ON public.entity_links(target_type, target_id, user_id);

-- 4.2 Cross-References Table
CREATE TABLE public.cross_references (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  reference_type text NOT NULL,
  reference_value text NOT NULL,
  normalized_value text,
  source text,
  confidence numeric(4,3) DEFAULT 0,
  metadata jsonb,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.cross_references ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their cross references"
ON public.cross_references FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their cross references"
ON public.cross_references FOR ALL
USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_cross_refs_normalized ON public.cross_references(normalized_value, reference_type, user_id);
CREATE INDEX idx_cross_refs_profile ON public.cross_references(profile_id, user_id);

-- 4.3 Function to find matching cross-references
CREATE OR REPLACE FUNCTION public.find_cross_reference_matches(
  p_user_id uuid,
  p_reference_type text,
  p_normalized_value text
)
RETURNS TABLE(
  profile_id uuid,
  confidence numeric,
  source text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cr.profile_id, cr.confidence, cr.source
  FROM public.cross_references cr
  WHERE cr.user_id = p_user_id
    AND cr.reference_type = p_reference_type
    AND cr.normalized_value = p_normalized_value
  ORDER BY cr.confidence DESC;
$$;

-- =============================================
-- PHASE 5: Sensitive Data Access Logging
-- =============================================

CREATE TABLE public.sensitive_data_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  access_type text NOT NULL,
  data_classification clearance_level NOT NULL,
  user_clearance clearance_level,
  access_granted boolean NOT NULL,
  denial_reason text,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.sensitive_data_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users with SECRET clearance can view access logs"
ON public.sensitive_data_access_log FOR SELECT
USING (public.has_clearance(auth.uid(), 'secret'));

CREATE POLICY "System can insert access logs"
ON public.sensitive_data_access_log FOR INSERT
WITH CHECK (true);

-- Index for analytics
CREATE INDEX idx_sensitive_access_user ON public.sensitive_data_access_log(user_id, created_at);
CREATE INDEX idx_sensitive_access_table ON public.sensitive_data_access_log(table_name, created_at);

-- =============================================
-- PHASE 6: Update existing sensitive tables RLS
-- =============================================

-- Update RLS for oauth_tokens (TOP SECRET)
DROP POLICY IF EXISTS "Users can access their own tokens" ON public.oauth_tokens;
CREATE POLICY "Users with clearance can access tokens"
ON public.oauth_tokens FOR SELECT
USING (
  auth.uid() = user_id 
  AND public.has_clearance(auth.uid(), 'top_secret')
);

-- Update RLS for contact_bank_accounts (SECRET)
DROP POLICY IF EXISTS "Users can view their own bank accounts" ON public.contact_bank_accounts;
CREATE POLICY "Users with SECRET clearance can view bank accounts"
ON public.contact_bank_accounts FOR SELECT
USING (
  auth.uid() = user_id 
  AND public.has_clearance(auth.uid(), 'secret')
);

DROP POLICY IF EXISTS "Users can manage their own bank accounts" ON public.contact_bank_accounts;
CREATE POLICY "Users with SECRET clearance can manage bank accounts"
ON public.contact_bank_accounts FOR ALL
USING (
  auth.uid() = user_id 
  AND public.has_clearance(auth.uid(), 'secret')
);

-- Update RLS for contact_payment_accounts (SECRET)
DROP POLICY IF EXISTS "Users can view their own payment accounts" ON public.contact_payment_accounts;
CREATE POLICY "Users with SECRET clearance can view payment accounts"
ON public.contact_payment_accounts FOR SELECT
USING (
  auth.uid() = user_id 
  AND public.has_clearance(auth.uid(), 'secret')
);

DROP POLICY IF EXISTS "Users can manage their own payment accounts" ON public.contact_payment_accounts;
CREATE POLICY "Users with SECRET clearance can manage payment accounts"
ON public.contact_payment_accounts FOR ALL
USING (
  auth.uid() = user_id 
  AND public.has_clearance(auth.uid(), 'secret')
);

-- Update RLS for contact_identity_documents (SECRET)
DROP POLICY IF EXISTS "Users can view their own identity documents" ON public.contact_identity_documents;
CREATE POLICY "Users with SECRET clearance can view identity documents"
ON public.contact_identity_documents FOR SELECT
USING (
  auth.uid() = user_id 
  AND public.has_clearance(auth.uid(), 'secret')
);

DROP POLICY IF EXISTS "Users can manage their own identity documents" ON public.contact_identity_documents;
CREATE POLICY "Users with SECRET clearance can manage identity documents"
ON public.contact_identity_documents FOR ALL
USING (
  auth.uid() = user_id 
  AND public.has_clearance(auth.uid(), 'secret')
);

-- Update RLS for psychological_profiles (TOP SECRET)
DROP POLICY IF EXISTS "Users can view their own psychological profiles" ON public.psychological_profiles;
CREATE POLICY "Users with TOP SECRET clearance can view psychological profiles"
ON public.psychological_profiles FOR SELECT
USING (
  auth.uid() = user_id 
  AND public.has_clearance(auth.uid(), 'top_secret')
);

DROP POLICY IF EXISTS "Users can manage their own psychological profiles" ON public.psychological_profiles;
CREATE POLICY "Users with TOP SECRET clearance can manage psychological profiles"
ON public.psychological_profiles FOR ALL
USING (
  auth.uid() = user_id 
  AND public.has_clearance(auth.uid(), 'top_secret')
);

-- Update RLS for contact_biometrics (TOP SECRET)
DROP POLICY IF EXISTS "Users can view their own biometrics" ON public.contact_biometrics;
CREATE POLICY "Users with TOP SECRET clearance can view biometrics"
ON public.contact_biometrics FOR SELECT
USING (
  auth.uid() = user_id 
  AND public.has_clearance(auth.uid(), 'top_secret')
);

DROP POLICY IF EXISTS "Users can manage their own biometrics" ON public.contact_biometrics;
CREATE POLICY "Users with TOP SECRET clearance can manage biometrics"
ON public.contact_biometrics FOR ALL
USING (
  auth.uid() = user_id 
  AND public.has_clearance(auth.uid(), 'top_secret')
);

-- Update RLS for trust_assessments (SECRET)
DROP POLICY IF EXISTS "Users can view their own trust assessments" ON public.trust_assessments;
CREATE POLICY "Users with SECRET clearance can view trust assessments"
ON public.trust_assessments FOR SELECT
USING (
  auth.uid() = user_id 
  AND public.has_clearance(auth.uid(), 'secret')
);

DROP POLICY IF EXISTS "Users can manage their own trust assessments" ON public.trust_assessments;
CREATE POLICY "Users with SECRET clearance can manage trust assessments"
ON public.trust_assessments FOR ALL
USING (
  auth.uid() = user_id 
  AND public.has_clearance(auth.uid(), 'secret')
);

-- Trigger for updated_at on new tables
CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cross_references_updated_at
BEFORE UPDATE ON public.cross_references
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();