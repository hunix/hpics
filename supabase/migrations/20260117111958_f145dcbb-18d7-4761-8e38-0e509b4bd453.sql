-- Drop ALL existing search_contacts_v3 overloads by their full signatures
DROP FUNCTION IF EXISTS public.search_contacts_v3(uuid, text, text, text, text, boolean, text, boolean, text, text, integer, integer);
DROP FUNCTION IF EXISTS public.search_contacts_v3(uuid, text, text, text, text, boolean, boolean, text, text, text, integer, integer);

-- Also drop by just name to catch any other signatures
DROP FUNCTION IF EXISTS public.search_contacts_v3(uuid, text, text, text, text, boolean, boolean, text, text, text, int, int);
DROP FUNCTION IF EXISTS public.search_contacts_v3(uuid, text, text, text, text, boolean, text, boolean, text, text, int, int);

-- Create a single canonical search_contacts_v3 that matches v4 signature exactly
-- This ensures stale cached clients calling v3 will still work
CREATE OR REPLACE FUNCTION public.search_contacts_v3(
  p_user_id uuid,
  p_search_query text DEFAULT NULL,
  p_relationship_type text DEFAULT NULL,
  p_relationship_subtype text DEFAULT NULL,
  p_tag text DEFAULT NULL,
  p_is_favorite boolean DEFAULT NULL,
  p_is_active boolean DEFAULT NULL,
  p_first_letter text DEFAULT NULL,
  p_sort_by text DEFAULT 'name',
  p_sort_order text DEFAULT 'asc',
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
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
  engagement_score integer,
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
         p.organization ILIKE '%' || p_search_query || '%')
    AND (p_relationship_type IS NULL OR p.relationship_type::text = p_relationship_type)
    AND (p_relationship_subtype IS NULL OR p.relationship_subtype = p_relationship_subtype)
    AND (p_tag IS NULL OR p_tag = ANY(p.tags))
    AND (p_is_favorite IS NULL OR p.is_favorite = p_is_favorite)
    AND (p_is_active IS NULL OR p.is_active = p_is_active)
    AND (p_first_letter IS NULL OR UPPER(LEFT(p.first_name, 1)) = UPPER(p_first_letter));

  RETURN QUERY
  SELECT
    p.id,
    p.first_name,
    p.last_name,
    p.organization,
    p.job_title,
    p.relationship_type::text,
    p.relationship_subtype,
    p.hierarchy_level,
    p.avatar_url,
    p.is_favorite,
    p.is_active,
    p.tags,
    p.created_at,
    p.country,
    p.last_interaction_at,
    COALESCE(p.engagement_score, 0)::integer,
    v_total
  FROM profiles p
  WHERE p.user_id = p_user_id
    AND (p_search_query IS NULL OR p_search_query = '' OR 
         p.first_name ILIKE '%' || p_search_query || '%' OR 
         p.last_name ILIKE '%' || p_search_query || '%' OR
         p.organization ILIKE '%' || p_search_query || '%')
    AND (p_relationship_type IS NULL OR p.relationship_type::text = p_relationship_type)
    AND (p_relationship_subtype IS NULL OR p.relationship_subtype = p_relationship_subtype)
    AND (p_tag IS NULL OR p_tag = ANY(p.tags))
    AND (p_is_favorite IS NULL OR p.is_favorite = p_is_favorite)
    AND (p_is_active IS NULL OR p.is_active = p_is_active)
    AND (p_first_letter IS NULL OR UPPER(LEFT(p.first_name, 1)) = UPPER(p_first_letter))
  ORDER BY
    CASE WHEN p_sort_by = 'name' AND p_sort_order = 'asc' THEN p.first_name END ASC,
    CASE WHEN p_sort_by = 'name' AND p_sort_order = 'desc' THEN p.first_name END DESC,
    CASE WHEN p_sort_by = 'recent' AND p_sort_order = 'asc' THEN p.created_at END ASC,
    CASE WHEN p_sort_by = 'recent' AND p_sort_order = 'desc' THEN p.created_at END DESC,
    CASE WHEN p_sort_by = 'oldest' AND p_sort_order = 'asc' THEN p.created_at END ASC,
    CASE WHEN p_sort_by = 'oldest' AND p_sort_order = 'desc' THEN p.created_at END DESC,
    CASE WHEN p_sort_by = 'organization' AND p_sort_order = 'asc' THEN p.organization END ASC,
    CASE WHEN p_sort_by = 'organization' AND p_sort_order = 'desc' THEN p.organization END DESC,
    CASE WHEN p_sort_by = 'relationship' AND p_sort_order = 'asc' THEN p.relationship_type::text END ASC,
    CASE WHEN p_sort_by = 'relationship' AND p_sort_order = 'desc' THEN p.relationship_type::text END DESC,
    CASE WHEN p_sort_by = 'engagement' AND p_sort_order = 'asc' THEN p.engagement_score END ASC,
    CASE WHEN p_sort_by = 'engagement' AND p_sort_order = 'desc' THEN p.engagement_score END DESC,
    p.first_name ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;