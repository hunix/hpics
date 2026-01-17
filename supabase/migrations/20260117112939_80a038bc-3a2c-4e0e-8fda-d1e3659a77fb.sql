-- Add country column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country TEXT;

-- Drop old broken functions
DROP FUNCTION IF EXISTS public.search_contacts_v3(uuid, text, text, text, text, boolean, boolean, text, text, text, integer, integer);
DROP FUNCTION IF EXISTS public.search_contacts_v3(uuid, text, text, text, text, boolean, text, boolean, text, text, integer, integer);
DROP FUNCTION IF EXISTS public.search_contacts_v3;
DROP FUNCTION IF EXISTS public.search_contacts_v4;

-- Create clean search_contacts_v5 function
CREATE OR REPLACE FUNCTION public.search_contacts_v5(
  p_user_id UUID,
  p_search_query TEXT DEFAULT NULL,
  p_relationship_type TEXT DEFAULT NULL,
  p_relationship_subtype TEXT DEFAULT NULL,
  p_tag TEXT DEFAULT NULL,
  p_is_favorite BOOLEAN DEFAULT NULL,
  p_is_active BOOLEAN DEFAULT NULL,
  p_first_letter TEXT DEFAULT NULL,
  p_sort_by TEXT DEFAULT 'name',
  p_sort_order TEXT DEFAULT 'asc',
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  first_name TEXT,
  last_name TEXT,
  organization TEXT,
  job_title TEXT,
  relationship_type TEXT,
  relationship_subtype TEXT,
  hierarchy_level TEXT,
  avatar_url TEXT,
  is_favorite BOOLEAN,
  is_active BOOLEAN,
  tags TEXT[],
  created_at TIMESTAMPTZ,
  country TEXT,
  last_interaction_at TIMESTAMPTZ,
  engagement_score INTEGER,
  total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_count BIGINT;
BEGIN
  -- Get total count for pagination
  SELECT COUNT(*)
  INTO v_total_count
  FROM profiles p
  WHERE p.user_id = p_user_id
    AND (p_search_query IS NULL OR p_search_query = '' OR 
         p.first_name ILIKE '%' || p_search_query || '%' OR 
         p.last_name ILIKE '%' || p_search_query || '%' OR
         p.organization ILIKE '%' || p_search_query || '%' OR
         p.job_title ILIKE '%' || p_search_query || '%')
    AND (p_relationship_type IS NULL OR p.relationship_type::text = p_relationship_type)
    AND (p_relationship_subtype IS NULL OR p.relationship_subtype = p_relationship_subtype)
    AND (p_tag IS NULL OR p_tag = ANY(p.tags))
    AND (p_is_favorite IS NULL OR p.is_favorite = p_is_favorite)
    AND (p_is_active IS NULL OR COALESCE(p.is_active, false) = p_is_active)
    AND (p_first_letter IS NULL OR UPPER(LEFT(p.first_name, 1)) = UPPER(p_first_letter));

  RETURN QUERY
  SELECT 
    p.id,
    p.first_name,
    p.last_name,
    p.organization,
    p.job_title,
    p.relationship_type::text AS relationship_type,
    p.relationship_subtype,
    p.hierarchy_level,
    p.avatar_url,
    COALESCE(p.is_favorite, false) AS is_favorite,
    COALESCE(p.is_active, false) AS is_active,
    p.tags,
    p.created_at,
    p.country,
    p.last_interaction_at,
    COALESCE(p.engagement_score, 0) AS engagement_score,
    v_total_count AS total_count
  FROM profiles p
  WHERE p.user_id = p_user_id
    AND (p_search_query IS NULL OR p_search_query = '' OR 
         p.first_name ILIKE '%' || p_search_query || '%' OR 
         p.last_name ILIKE '%' || p_search_query || '%' OR
         p.organization ILIKE '%' || p_search_query || '%' OR
         p.job_title ILIKE '%' || p_search_query || '%')
    AND (p_relationship_type IS NULL OR p.relationship_type::text = p_relationship_type)
    AND (p_relationship_subtype IS NULL OR p.relationship_subtype = p_relationship_subtype)
    AND (p_tag IS NULL OR p_tag = ANY(p.tags))
    AND (p_is_favorite IS NULL OR p.is_favorite = p_is_favorite)
    AND (p_is_active IS NULL OR COALESCE(p.is_active, false) = p_is_active)
    AND (p_first_letter IS NULL OR UPPER(LEFT(p.first_name, 1)) = UPPER(p_first_letter))
  ORDER BY
    CASE WHEN p_sort_by = 'name' AND p_sort_order = 'asc' THEN p.first_name END ASC,
    CASE WHEN p_sort_by = 'name' AND p_sort_order = 'desc' THEN p.first_name END DESC,
    CASE WHEN p_sort_by = 'recent' AND p_sort_order = 'asc' THEN p.updated_at END ASC,
    CASE WHEN p_sort_by = 'recent' AND p_sort_order = 'desc' THEN p.updated_at END DESC,
    CASE WHEN p_sort_by = 'oldest' AND p_sort_order = 'asc' THEN p.created_at END ASC,
    CASE WHEN p_sort_by = 'oldest' AND p_sort_order = 'desc' THEN p.created_at END DESC,
    CASE WHEN p_sort_by = 'organization' AND p_sort_order = 'asc' THEN p.organization END ASC NULLS LAST,
    CASE WHEN p_sort_by = 'organization' AND p_sort_order = 'desc' THEN p.organization END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'relationship' AND p_sort_order = 'asc' THEN p.relationship_type::text END ASC NULLS LAST,
    CASE WHEN p_sort_by = 'relationship' AND p_sort_order = 'desc' THEN p.relationship_type::text END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'engagement' AND p_sort_order = 'asc' THEN COALESCE(p.engagement_score, 0) END ASC,
    CASE WHEN p_sort_by = 'engagement' AND p_sort_order = 'desc' THEN COALESCE(p.engagement_score, 0) END DESC,
    p.first_name ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;