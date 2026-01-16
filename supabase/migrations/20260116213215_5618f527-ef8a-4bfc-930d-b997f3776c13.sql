-- Fix merge_duplicate_profiles function by removing invalid messages.profile_id reference
-- and adding all missing profile-linked tables

CREATE OR REPLACE FUNCTION public.merge_duplicate_profiles(
  p_primary_id UUID,
  p_duplicate_id UUID,
  p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify both profiles belong to the user
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_primary_id AND user_id = p_user_id) THEN
    RAISE EXCEPTION 'Primary profile not found or not owned by user';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_duplicate_id AND user_id = p_user_id) THEN
    RAISE EXCEPTION 'Duplicate profile not found or not owned by user';
  END IF;

  -- Update contact_relationships: replace duplicate with primary in from_profile_id
  UPDATE contact_relationships 
  SET from_profile_id = p_primary_id 
  WHERE from_profile_id = p_duplicate_id AND user_id = p_user_id
    AND NOT EXISTS (
      SELECT 1 FROM contact_relationships cr2 
      WHERE cr2.from_profile_id = p_primary_id 
        AND cr2.to_profile_id = contact_relationships.to_profile_id 
        AND cr2.user_id = p_user_id
    );
  
  -- Update contact_relationships: replace duplicate with primary in to_profile_id
  UPDATE contact_relationships 
  SET to_profile_id = p_primary_id 
  WHERE to_profile_id = p_duplicate_id AND user_id = p_user_id
    AND NOT EXISTS (
      SELECT 1 FROM contact_relationships cr2 
      WHERE cr2.to_profile_id = p_primary_id 
        AND cr2.from_profile_id = contact_relationships.from_profile_id 
        AND cr2.user_id = p_user_id
    );
  
  -- Delete remaining duplicate relationships
  DELETE FROM contact_relationships 
  WHERE (from_profile_id = p_duplicate_id OR to_profile_id = p_duplicate_id) 
    AND user_id = p_user_id;
  
  -- Update core assets
  UPDATE media SET profile_id = p_primary_id WHERE profile_id = p_duplicate_id AND user_id = p_user_id;
  UPDATE documents SET profile_id = p_primary_id WHERE profile_id = p_duplicate_id AND user_id = p_user_id;
  UPDATE conversations SET profile_id = p_primary_id WHERE profile_id = p_duplicate_id AND user_id = p_user_id;
  
  -- Update communications (but NOT messages - they link via conversations, not profiles)
  UPDATE communications SET profile_id = p_primary_id WHERE profile_id = p_duplicate_id AND user_id = p_user_id;
  
  -- Update events
  UPDATE events SET profile_id = p_primary_id WHERE profile_id = p_duplicate_id AND user_id = p_user_id;
  
  -- Update psychological profiles
  UPDATE psychological_profiles SET profile_id = p_primary_id WHERE profile_id = p_duplicate_id AND user_id = p_user_id;
  
  -- Update contact biometrics
  UPDATE contact_biometrics SET profile_id = p_primary_id WHERE profile_id = p_duplicate_id AND user_id = p_user_id;
  
  -- Update contact methods
  UPDATE contact_methods SET profile_id = p_primary_id WHERE profile_id = p_duplicate_id AND user_id = p_user_id;
  
  -- Update relationship scores
  UPDATE relationship_scores SET profile_id = p_primary_id WHERE profile_id = p_duplicate_id AND user_id = p_user_id;
  
  -- Update AI analyses
  UPDATE ai_analyses SET profile_id = p_primary_id WHERE profile_id = p_duplicate_id AND user_id = p_user_id;
  
  -- Update social profiles
  UPDATE social_profiles SET profile_id = p_primary_id WHERE profile_id = p_duplicate_id AND user_id = p_user_id;
  
  -- Update life events
  UPDATE life_events SET profile_id = p_primary_id WHERE profile_id = p_duplicate_id AND user_id = p_user_id;
  
  -- Update recordings
  UPDATE recordings SET profile_id = p_primary_id WHERE profile_id = p_duplicate_id AND user_id = p_user_id;
  
  -- Update analysis sessions
  UPDATE analysis_sessions SET profile_id = p_primary_id WHERE profile_id = p_duplicate_id AND user_id = p_user_id;
  
  -- Update action recommendations
  UPDATE action_recommendations SET profile_id = p_primary_id WHERE profile_id = p_duplicate_id AND user_id = p_user_id;
  
  -- Update AI guided interviews
  UPDATE ai_guided_interviews SET profile_id = p_primary_id WHERE profile_id = p_duplicate_id AND user_id = p_user_id;
  
  -- Update analysis aggregates
  UPDATE analysis_aggregates SET profile_id = p_primary_id WHERE profile_id = p_duplicate_id AND user_id = p_user_id;
  
  -- Update analysis events
  UPDATE analysis_events SET profile_id = p_primary_id WHERE profile_id = p_duplicate_id AND user_id = p_user_id;
  
  -- Update analysis snapshots
  UPDATE analysis_snapshots SET profile_id = p_primary_id WHERE profile_id = p_duplicate_id AND user_id = p_user_id;
  
  -- Update AGIS objective tracking
  UPDATE agis_objective_tracking SET profile_id = p_primary_id WHERE profile_id = p_duplicate_id AND user_id = p_user_id;
  
  -- Update attachment profiles
  UPDATE attachment_profiles SET profile_id = p_primary_id WHERE profile_id = p_duplicate_id AND user_id = p_user_id;
  
  -- Update addiction protocols
  UPDATE addiction_protocols SET profile_id = p_primary_id WHERE profile_id = p_duplicate_id AND user_id = p_user_id;
  
  -- Delete the duplicate profile
  DELETE FROM profiles WHERE id = p_duplicate_id AND user_id = p_user_id;
  
  RETURN json_build_object(
    'success', true,
    'primary_id', p_primary_id,
    'deleted_id', p_duplicate_id,
    'message', 'Successfully merged profiles'
  );
END;
$$;