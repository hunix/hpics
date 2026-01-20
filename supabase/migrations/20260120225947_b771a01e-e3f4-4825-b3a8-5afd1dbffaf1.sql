-- v3.9.15 Schema Alignment: Add missing unique constraints and columns

-- 1. Add unique constraint for cross_domain_correlations upserts
CREATE UNIQUE INDEX IF NOT EXISTS idx_cross_domain_profile_user_type 
ON public.cross_domain_correlations (profile_id, user_id, correlation_type);

-- 2. Add unique constraint for attachment_profiles upserts
CREATE UNIQUE INDEX IF NOT EXISTS idx_attachment_profiles_profile_unique
ON public.attachment_profiles (profile_id);

-- 3. Add unique constraint for threat_actors upserts
CREATE UNIQUE INDEX IF NOT EXISTS idx_threat_actors_user_profile
ON public.threat_actors (user_id, profile_id);

-- 4. Add missing columns to threat_actors table
ALTER TABLE public.threat_actors 
ADD COLUMN IF NOT EXISTS motivations jsonb,
ADD COLUMN IF NOT EXISTS last_assessed_at timestamptz DEFAULT now();