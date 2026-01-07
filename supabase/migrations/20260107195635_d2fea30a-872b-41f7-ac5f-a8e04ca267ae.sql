-- Fix search_contacts_v3 with proper enum type casting
CREATE OR REPLACE FUNCTION public.search_contacts_v3(
  p_user_id uuid,
  p_search_query text DEFAULT NULL,
  p_relationship_type text DEFAULT NULL,
  p_relationship_subtype text DEFAULT NULL,
  p_tag text DEFAULT NULL,
  p_is_favorite boolean DEFAULT NULL,
  p_first_letter char(1) DEFAULT NULL,
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
  tags text[],
  created_at timestamptz,
  country text,
  total_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH filtered AS (
    SELECT 
      p.id,
      p.first_name,
      p.last_name,
      p.organization,
      p.job_title,
      p.relationship_type::text as relationship_type,
      p.relationship_subtype,
      p.hierarchy_level,
      p.avatar_url,
      p.is_favorite,
      p.tags,
      p.created_at,
      cpi.main_residence_country as country,
      COUNT(*) OVER() AS total_count
    FROM profiles p
    LEFT JOIN contact_personal_info cpi ON cpi.profile_id = p.id AND cpi.user_id = p_user_id
    WHERE p.user_id = p_user_id
      AND (p_search_query IS NULL OR 
           to_tsvector('english', 
             COALESCE(p.first_name,'') || ' ' || 
             COALESCE(p.last_name,'') || ' ' || 
             COALESCE(p.organization,'') || ' ' ||
             COALESCE(p.job_title,'')
           ) @@ plainto_tsquery('english', p_search_query)
           OR p.first_name ILIKE '%' || p_search_query || '%'
           OR p.last_name ILIKE '%' || p_search_query || '%'
           OR p.organization ILIKE '%' || p_search_query || '%'
      )
      AND (p_relationship_type IS NULL OR p.relationship_type::text = p_relationship_type)
      AND (p_relationship_subtype IS NULL OR p.relationship_subtype = p_relationship_subtype)
      AND (p_tag IS NULL OR p_tag = ANY(p.tags))
      AND (p_is_favorite IS NULL OR p.is_favorite = p_is_favorite)
      AND (p_first_letter IS NULL OR UPPER(LEFT(p.first_name, 1)) = UPPER(p_first_letter))
  )
  SELECT f.id, f.first_name, f.last_name, f.organization, f.job_title,
         f.relationship_type, f.relationship_subtype, f.hierarchy_level,
         f.avatar_url, f.is_favorite, f.tags, f.created_at, f.country, f.total_count
  FROM filtered f
  ORDER BY 
    CASE WHEN p_sort_by = 'name' AND p_sort_order = 'asc' THEN f.is_favorite END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'name' AND p_sort_order = 'asc' THEN f.first_name END ASC NULLS LAST,
    CASE WHEN p_sort_by = 'name' AND p_sort_order = 'desc' THEN f.is_favorite END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'name' AND p_sort_order = 'desc' THEN f.first_name END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'recent' THEN f.created_at END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'oldest' THEN f.created_at END ASC NULLS LAST,
    CASE WHEN p_sort_by = 'organization' THEN f.organization END ASC NULLS LAST,
    CASE WHEN p_sort_by = 'relationship' THEN f.relationship_type END ASC NULLS LAST
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- Fix get_contact_filter_options with proper enum casting
CREATE OR REPLACE FUNCTION public.get_contact_filter_options(p_user_id uuid)
RETURNS TABLE (
  relationships text[],
  subtypes text[],
  tags text[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    ARRAY(SELECT DISTINCT relationship_type::text FROM profiles WHERE user_id = p_user_id AND relationship_type IS NOT NULL ORDER BY relationship_type::text),
    ARRAY(SELECT DISTINCT relationship_subtype FROM profiles WHERE user_id = p_user_id AND relationship_subtype IS NOT NULL ORDER BY relationship_subtype),
    ARRAY(SELECT DISTINCT unnest(tags) FROM profiles WHERE user_id = p_user_id AND tags IS NOT NULL ORDER BY 1)
$$;