-- Fix merge_duplicate_profiles function: remove invalid user_id filters
-- for tables that don't have a user_id column (contact_methods, social_profiles, life_events, recordings)
-- Must drop first since return type differs

DROP FUNCTION IF EXISTS public.merge_duplicate_profiles(UUID, UUID, UUID);

CREATE FUNCTION public.merge_duplicate_profiles(
  p_primary_id UUID,
  p_duplicate_id UUID,
  p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
  merged_data JSONB := '{}';
  primary_profile RECORD;
  duplicate_profile RECORD;
BEGIN
  -- Ownership validation: verify both profiles belong to the user
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_primary_id AND user_id = p_user_id) THEN
    RAISE EXCEPTION 'Primary profile not found or access denied';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_duplicate_id AND user_id = p_user_id) THEN
    RAISE EXCEPTION 'Duplicate profile not found or access denied';
  END IF;
  
  -- Get both profiles
  SELECT * INTO primary_profile FROM profiles WHERE id = p_primary_id;
  SELECT * INTO duplicate_profile FROM profiles WHERE id = p_duplicate_id;
  
  -- Merge profile fields (keep primary values, fill nulls from duplicate)
  UPDATE profiles SET
    last_name = COALESCE(primary_profile.last_name, duplicate_profile.last_name),
    organization = COALESCE(primary_profile.organization, duplicate_profile.organization),
    job_title = COALESCE(primary_profile.job_title, duplicate_profile.job_title),
    bio = COALESCE(primary_profile.bio, duplicate_profile.bio),
    relationship_type = COALESCE(primary_profile.relationship_type, duplicate_profile.relationship_type),
    avatar_url = COALESCE(primary_profile.avatar_url, duplicate_profile.avatar_url),
    updated_at = NOW()
  WHERE id = p_primary_id;
  
  -- === Tables WITHOUT user_id column - filter by profile_id only ===
  -- (Security: profile ownership already validated above)
  
  UPDATE contact_methods SET profile_id = p_primary_id WHERE profile_id = p_duplicate_id;
  UPDATE social_profiles SET profile_id = p_primary_id WHERE profile_id = p_duplicate_id;
  UPDATE life_events SET profile_id = p_primary_id WHERE profile_id = p_duplicate_id;
  UPDATE recordings SET profile_id = p_primary_id WHERE profile_id = p_duplicate_id;
  
  -- === Tables WITH user_id column - keep the user_id filter ===
  
  UPDATE media SET profile_id = p_primary_id WHERE profile_id = p_duplicate_id AND user_id = p_user_id;
  UPDATE documents SET profile_id = p_primary_id WHERE profile_id = p_duplicate_id AND user_id = p_user_id;
  UPDATE conversations SET profile_id = p_primary_id WHERE profile_id = p_duplicate_id AND user_id = p_user_id;
  UPDATE contact_relationships SET profile_id = p_primary_id WHERE profile_id = p_duplicate_id AND user_id = p_user_id;
  UPDATE contact_relationships SET related_profile_id = p_primary_id WHERE related_profile_id = p_duplicate_id AND user_id = p_user_id;
  UPDATE ai_analyses SET profile_id = p_primary_id WHERE profile_id = p_duplicate_id AND user_id = p_user_id;
  UPDATE contact_interaction_notes SET profile_id = p_primary_id WHERE profile_id = p_duplicate_id AND user_id = p_user_id;
  UPDATE contact_observations SET profile_id = p_primary_id WHERE profile_id = p_duplicate_id AND user_id = p_user_id;
  UPDATE action_recommendations SET profile_id = p_primary_id WHERE profile_id = p_duplicate_id AND user_id = p_user_id;
  
  -- Delete the duplicate profile
  DELETE FROM profiles WHERE id = p_duplicate_id AND user_id = p_user_id;
  
  merged_data := jsonb_build_object(
    'primary_id', p_primary_id,
    'duplicate_id', p_duplicate_id,
    'merged_at', NOW()
  );
  
  RETURN merged_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;