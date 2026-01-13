-- =============================================
-- ACTIVE CONTACT SYSTEM
-- Separates meaningful contacts from address book entries
-- =============================================

-- Phase 1: Add engagement tracking columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS activation_date TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_interaction_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS engagement_score INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS data_richness_score INTEGER DEFAULT 0;

-- Create index for fast active contact lookups
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_last_interaction ON profiles(user_id, last_interaction_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_profiles_engagement ON profiles(user_id, engagement_score DESC);

-- Phase 2: Create engagement log table
CREATE TABLE IF NOT EXISTS contact_engagement_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL,
  interaction_weight INTEGER DEFAULT 1,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE contact_engagement_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own engagement logs" ON contact_engagement_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own engagement logs" ON contact_engagement_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_engagement_log_profile ON contact_engagement_log(profile_id, created_at DESC);

-- Phase 3: Create the auto-activation trigger function
CREATE OR REPLACE FUNCTION activate_contact_on_interaction()
RETURNS TRIGGER AS $$
DECLARE
  v_weight INTEGER;
  v_interaction_type TEXT;
  v_profile_id UUID;
  v_user_id UUID;
BEGIN
  -- Get weight and type from trigger args
  v_weight := TG_ARGV[0]::integer;
  v_interaction_type := TG_ARGV[1];
  
  -- Get profile_id based on table structure
  IF TG_TABLE_NAME = 'entity_links' THEN
    -- For entity_links, only activate if it's a profile link
    IF NEW.source_type = 'profile' THEN
      v_profile_id := NEW.source_id::uuid;
      v_user_id := NEW.user_id;
    ELSE
      RETURN NEW;
    END IF;
  ELSIF TG_TABLE_NAME = 'media_contact_tags' THEN
    v_profile_id := NEW.profile_id;
    -- Get user_id from the media table
    SELECT user_id INTO v_user_id FROM media WHERE id = NEW.media_id;
  ELSE
    v_profile_id := NEW.profile_id;
    v_user_id := NEW.user_id;
  END IF;
  
  -- Skip if no profile_id
  IF v_profile_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Activate the contact
  UPDATE profiles 
  SET 
    is_active = true,
    activation_date = COALESCE(activation_date, now()),
    last_interaction_at = now(),
    engagement_score = COALESCE(engagement_score, 0) + v_weight
  WHERE id = v_profile_id;
  
  -- Log the interaction (only if we have user_id)
  IF v_user_id IS NOT NULL THEN
    INSERT INTO contact_engagement_log (user_id, profile_id, interaction_type, interaction_weight)
    VALUES (v_user_id, v_profile_id, v_interaction_type, v_weight);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Phase 4: Apply triggers to all relevant tables

-- Conversations (weight: 10)
DROP TRIGGER IF EXISTS activate_contact_on_conversation ON conversations;
CREATE TRIGGER activate_contact_on_conversation
  AFTER INSERT ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION activate_contact_on_interaction(10, 'conversation_added');

-- Documents (weight: 8)
DROP TRIGGER IF EXISTS activate_contact_on_document ON documents;
CREATE TRIGGER activate_contact_on_document
  AFTER INSERT ON documents
  FOR EACH ROW
  EXECUTE FUNCTION activate_contact_on_interaction(8, 'document_added');

-- Media tags (weight: 8)
DROP TRIGGER IF EXISTS activate_contact_on_media_tag ON media_contact_tags;
CREATE TRIGGER activate_contact_on_media_tag
  AFTER INSERT ON media_contact_tags
  FOR EACH ROW
  EXECUTE FUNCTION activate_contact_on_interaction(8, 'media_tagged');

-- Entity links/connections (weight: 7)
DROP TRIGGER IF EXISTS activate_contact_on_connection ON entity_links;
CREATE TRIGGER activate_contact_on_connection
  AFTER INSERT ON entity_links
  FOR EACH ROW
  EXECUTE FUNCTION activate_contact_on_interaction(7, 'connection_added');

-- Observations (weight: 6)
DROP TRIGGER IF EXISTS activate_contact_on_observation ON contact_observations;
CREATE TRIGGER activate_contact_on_observation
  AFTER INSERT ON contact_observations
  FOR EACH ROW
  EXECUTE FUNCTION activate_contact_on_interaction(6, 'observation_added');

-- Life milestones (weight: 6)
DROP TRIGGER IF EXISTS activate_contact_on_milestone ON contact_life_milestones;
CREATE TRIGGER activate_contact_on_milestone
  AFTER INSERT ON contact_life_milestones
  FOR EACH ROW
  EXECUTE FUNCTION activate_contact_on_interaction(6, 'milestone_added');

-- Financial history (weight: 5)
DROP TRIGGER IF EXISTS activate_contact_on_financial ON contact_financial_history;
CREATE TRIGGER activate_contact_on_financial
  AFTER INSERT ON contact_financial_history
  FOR EACH ROW
  EXECUTE FUNCTION activate_contact_on_interaction(5, 'financial_added');

-- Events (weight: 4)
DROP TRIGGER IF EXISTS activate_contact_on_event ON events;
CREATE TRIGGER activate_contact_on_event
  AFTER INSERT ON events
  FOR EACH ROW
  EXECUTE FUNCTION activate_contact_on_interaction(4, 'event_added');

-- Communications (weight: 3)
DROP TRIGGER IF EXISTS activate_contact_on_communication ON communications;
CREATE TRIGGER activate_contact_on_communication
  AFTER INSERT ON communications
  FOR EACH ROW
  EXECUTE FUNCTION activate_contact_on_interaction(3, 'communication_logged');

-- Phase 5: Backfill existing active contacts
-- Mark contacts with existing meaningful data as active
UPDATE profiles p SET 
  is_active = true, 
  activation_date = COALESCE(p.activation_date, now()),
  last_interaction_at = COALESCE(p.last_interaction_at, now())
WHERE p.id IN (
  SELECT DISTINCT profile_id FROM conversations WHERE profile_id IS NOT NULL
  UNION
  SELECT DISTINCT profile_id FROM documents WHERE profile_id IS NOT NULL
  UNION
  SELECT DISTINCT profile_id FROM media_contact_tags
  UNION
  SELECT DISTINCT source_id::uuid FROM entity_links WHERE source_type = 'profile' AND source_id IS NOT NULL
  UNION
  SELECT DISTINCT profile_id FROM contact_observations WHERE profile_id IS NOT NULL
  UNION
  SELECT DISTINCT profile_id FROM contact_life_milestones WHERE profile_id IS NOT NULL
  UNION
  SELECT DISTINCT profile_id FROM contact_financial_history WHERE profile_id IS NOT NULL
);

-- Also mark favorites as active
UPDATE profiles SET 
  is_active = true, 
  activation_date = COALESCE(activation_date, now())
WHERE is_favorite = true;

-- Calculate initial engagement scores for active contacts
UPDATE profiles p SET engagement_score = (
  COALESCE((SELECT COUNT(*) * 10 FROM conversations WHERE profile_id = p.id), 0) +
  COALESCE((SELECT COUNT(*) * 8 FROM documents WHERE profile_id = p.id), 0) +
  COALESCE((SELECT COUNT(*) * 8 FROM media_contact_tags WHERE profile_id = p.id), 0) +
  COALESCE((SELECT COUNT(*) * 7 FROM entity_links WHERE source_id = p.id::text AND source_type = 'profile'), 0) +
  COALESCE((SELECT COUNT(*) * 6 FROM contact_observations WHERE profile_id = p.id), 0) +
  COALESCE((SELECT COUNT(*) * 6 FROM contact_life_milestones WHERE profile_id = p.id), 0) +
  COALESCE((SELECT COUNT(*) * 5 FROM contact_financial_history WHERE profile_id = p.id), 0)
)
WHERE p.is_active = true;

-- Phase 6: Update search_contacts_v3 to include is_active filter
CREATE OR REPLACE FUNCTION search_contacts_v3(
  p_user_id uuid,
  p_search_query text DEFAULT NULL,
  p_relationship_type text DEFAULT NULL,
  p_relationship_subtype text DEFAULT NULL,
  p_tag text DEFAULT NULL,
  p_is_favorite boolean DEFAULT NULL,
  p_first_letter text DEFAULT NULL,
  p_is_active boolean DEFAULT NULL,
  p_sort_by text DEFAULT 'name',
  p_sort_order text DEFAULT 'asc',
  p_limit int DEFAULT 50,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  first_name text,
  last_name text,
  organization text,
  job_title text,
  relationship_type text,
  relationship_subtype text,
  hierarchy_level text,
  avatar_url text,
  is_favorite boolean,
  is_active boolean,
  tags text[],
  created_at timestamptz,
  country text,
  last_interaction_at timestamptz,
  engagement_score int,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total bigint;
BEGIN
  -- Get total count first
  SELECT COUNT(*) INTO v_total
  FROM profiles p
  WHERE p.user_id = p_user_id
    AND (p_search_query IS NULL OR p_search_query = '' OR 
         p.first_name ILIKE '%' || p_search_query || '%' OR
         p.last_name ILIKE '%' || p_search_query || '%' OR
         p.organization ILIKE '%' || p_search_query || '%' OR
         p.job_title ILIKE '%' || p_search_query || '%' OR
         (p.first_name || ' ' || COALESCE(p.last_name, '')) ILIKE '%' || p_search_query || '%')
    AND (p_relationship_type IS NULL OR p.relationship_type = p_relationship_type)
    AND (p_relationship_subtype IS NULL OR p.relationship_subtype = p_relationship_subtype)
    AND (p_tag IS NULL OR p.tags @> ARRAY[p_tag])
    AND (p_is_favorite IS NULL OR p.is_favorite = p_is_favorite)
    AND (p_first_letter IS NULL OR UPPER(LEFT(p.first_name, 1)) = UPPER(p_first_letter))
    AND (p_is_active IS NULL OR p.is_active = p_is_active);

  RETURN QUERY
  SELECT 
    p.id,
    p.first_name,
    p.last_name,
    p.organization,
    p.job_title,
    p.relationship_type,
    p.relationship_subtype,
    p.hierarchy_level,
    p.avatar_url,
    p.is_favorite,
    p.is_active,
    p.tags,
    p.created_at,
    p.country,
    p.last_interaction_at,
    p.engagement_score,
    v_total
  FROM profiles p
  WHERE p.user_id = p_user_id
    AND (p_search_query IS NULL OR p_search_query = '' OR 
         p.first_name ILIKE '%' || p_search_query || '%' OR
         p.last_name ILIKE '%' || p_search_query || '%' OR
         p.organization ILIKE '%' || p_search_query || '%' OR
         p.job_title ILIKE '%' || p_search_query || '%' OR
         (p.first_name || ' ' || COALESCE(p.last_name, '')) ILIKE '%' || p_search_query || '%')
    AND (p_relationship_type IS NULL OR p.relationship_type = p_relationship_type)
    AND (p_relationship_subtype IS NULL OR p.relationship_subtype = p_relationship_subtype)
    AND (p_tag IS NULL OR p.tags @> ARRAY[p_tag])
    AND (p_is_favorite IS NULL OR p.is_favorite = p_is_favorite)
    AND (p_first_letter IS NULL OR UPPER(LEFT(p.first_name, 1)) = UPPER(p_first_letter))
    AND (p_is_active IS NULL OR p.is_active = p_is_active)
  ORDER BY
    CASE WHEN p_sort_by = 'name' AND p_sort_order = 'asc' THEN p.first_name END ASC,
    CASE WHEN p_sort_by = 'name' AND p_sort_order = 'desc' THEN p.first_name END DESC,
    CASE WHEN p_sort_by = 'recent' THEN p.created_at END DESC,
    CASE WHEN p_sort_by = 'oldest' THEN p.created_at END ASC,
    CASE WHEN p_sort_by = 'organization' AND p_sort_order = 'asc' THEN p.organization END ASC,
    CASE WHEN p_sort_by = 'organization' AND p_sort_order = 'desc' THEN p.organization END DESC,
    CASE WHEN p_sort_by = 'relationship' AND p_sort_order = 'asc' THEN p.relationship_type END ASC,
    CASE WHEN p_sort_by = 'relationship' AND p_sort_order = 'desc' THEN p.relationship_type END DESC,
    CASE WHEN p_sort_by = 'engagement' THEN p.engagement_score END DESC,
    p.first_name ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Phase 7: Create smart contact selection function for pickers
CREATE OR REPLACE FUNCTION get_contacts_for_selection(
  p_user_id uuid,
  p_search_query text DEFAULT NULL,
  p_recent_ids uuid[] DEFAULT NULL,
  p_limit int DEFAULT 30
)
RETURNS TABLE (
  id uuid,
  first_name text,
  last_name text,
  avatar_url text,
  organization text,
  is_favorite boolean,
  is_active boolean,
  last_interaction_at timestamptz,
  selection_priority int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH prioritized AS (
    SELECT 
      p.id,
      p.first_name,
      p.last_name,
      p.avatar_url,
      p.organization,
      p.is_favorite,
      p.is_active,
      p.last_interaction_at,
      CASE 
        -- Priority 1: Recently used (from client)
        WHEN p.id = ANY(COALESCE(p_recent_ids, ARRAY[]::uuid[])) THEN 1
        -- Priority 2: Favorites
        WHEN p.is_favorite = true THEN 2
        -- Priority 3: Active contacts by interaction
        WHEN p.is_active = true THEN 3
        -- Priority 4: Address book (inactive)
        ELSE 4
      END as selection_priority
    FROM profiles p
    WHERE p.user_id = p_user_id
      AND (
        p_search_query IS NULL 
        OR p_search_query = '' 
        OR p.first_name ILIKE '%' || p_search_query || '%'
        OR p.last_name ILIKE '%' || p_search_query || '%'
        OR p.organization ILIKE '%' || p_search_query || '%'
        OR (p.first_name || ' ' || COALESCE(p.last_name, '')) ILIKE '%' || p_search_query || '%'
      )
  )
  SELECT 
    prioritized.id,
    prioritized.first_name,
    prioritized.last_name,
    prioritized.avatar_url,
    prioritized.organization,
    prioritized.is_favorite,
    prioritized.is_active,
    prioritized.last_interaction_at,
    prioritized.selection_priority
  FROM prioritized
  ORDER BY 
    prioritized.selection_priority ASC,
    prioritized.last_interaction_at DESC NULLS LAST,
    prioritized.first_name ASC
  LIMIT p_limit;
END;
$$;

-- Phase 8: Create function to manually toggle contact active status
CREATE OR REPLACE FUNCTION toggle_contact_active_status(
  p_profile_id uuid,
  p_is_active boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles 
  SET 
    is_active = p_is_active,
    activation_date = CASE WHEN p_is_active AND activation_date IS NULL THEN now() ELSE activation_date END,
    last_interaction_at = CASE WHEN p_is_active THEN now() ELSE last_interaction_at END
  WHERE id = p_profile_id 
    AND user_id = auth.uid();
    
  -- Log the manual toggle
  INSERT INTO contact_engagement_log (user_id, profile_id, interaction_type, interaction_weight, metadata)
  VALUES (
    auth.uid(), 
    p_profile_id, 
    CASE WHEN p_is_active THEN 'manually_activated' ELSE 'manually_deactivated' END,
    0,
    jsonb_build_object('manual', true)
  );
END;
$$;