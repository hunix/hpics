-- Fix merge_duplicate_profiles to remove references to non-existent tables
-- Tables that DON'T exist: social_profiles, life_events, recordings
-- This is a cleanup migration to ensure the function doesn't silently fail

DROP FUNCTION IF EXISTS public.merge_duplicate_profiles(uuid, uuid, uuid);

CREATE OR REPLACE FUNCTION public.merge_duplicate_profiles(
  p_primary_id uuid,
  p_duplicate_id uuid,
  p_user_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb := '{"success": false}'::jsonb;
  v_merged_count int := 0;
BEGIN
  -- Ownership validation: ensure both profiles belong to the caller
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_primary_id AND user_id = p_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Primary profile not found or not owned by user');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_duplicate_id AND user_id = p_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Duplicate profile not found or not owned by user');
  END IF;
  
  -- Prevent self-merge
  IF p_primary_id = p_duplicate_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot merge a profile with itself');
  END IF;

  -- Tables WITH user_id column - keep AND user_id filter for extra safety
  UPDATE messages SET conversation_id = (
    SELECT id FROM conversations WHERE profile_id = p_primary_id AND user_id = p_user_id LIMIT 1
  ) WHERE conversation_id IN (
    SELECT id FROM conversations WHERE profile_id = p_duplicate_id AND user_id = p_user_id
  );
  v_merged_count := v_merged_count + 1;
  
  UPDATE media SET profile_id = p_primary_id WHERE profile_id = p_duplicate_id AND user_id = p_user_id;
  v_merged_count := v_merged_count + 1;
  
  UPDATE documents SET profile_id = p_primary_id WHERE profile_id = p_duplicate_id AND user_id = p_user_id;
  v_merged_count := v_merged_count + 1;
  
  UPDATE conversations SET profile_id = p_primary_id WHERE profile_id = p_duplicate_id AND user_id = p_user_id;
  v_merged_count := v_merged_count + 1;
  
  UPDATE contact_relationships SET profile_id = p_primary_id WHERE profile_id = p_duplicate_id AND user_id = p_user_id;
  v_merged_count := v_merged_count + 1;
  
  UPDATE contact_relationships SET related_profile_id = p_primary_id WHERE related_profile_id = p_duplicate_id AND user_id = p_user_id;
  v_merged_count := v_merged_count + 1;
  
  UPDATE events SET profile_id = p_primary_id WHERE profile_id = p_duplicate_id AND user_id = p_user_id;
  v_merged_count := v_merged_count + 1;
  
  UPDATE communications SET profile_id = p_primary_id WHERE profile_id = p_duplicate_id AND user_id = p_user_id;
  v_merged_count := v_merged_count + 1;
  
  UPDATE ai_analyses SET profile_id = p_primary_id WHERE profile_id = p_duplicate_id AND user_id = p_user_id;
  v_merged_count := v_merged_count + 1;
  
  UPDATE behavioral_analyses SET profile_id = p_primary_id WHERE profile_id = p_duplicate_id AND user_id = p_user_id;
  v_merged_count := v_merged_count + 1;
  
  UPDATE contact_influence_profiles SET profile_id = p_primary_id WHERE profile_id = p_duplicate_id AND user_id = p_user_id;
  v_merged_count := v_merged_count + 1;
  
  UPDATE relationship_scores SET profile_id = p_primary_id WHERE profile_id = p_duplicate_id AND user_id = p_user_id;
  v_merged_count := v_merged_count + 1;
  
  UPDATE contact_interaction_notes SET profile_id = p_primary_id WHERE profile_id = p_duplicate_id AND user_id = p_user_id;
  v_merged_count := v_merged_count + 1;
  
  UPDATE meeting_recordings SET profile_id = p_primary_id WHERE profile_id = p_duplicate_id AND user_id = p_user_id;
  v_merged_count := v_merged_count + 1;
  
  -- Tables WITHOUT user_id column - filter by profile_id only (safe due to ownership validation above)
  -- Schema note: contact_methods, contact_observations have no user_id column
  UPDATE contact_methods SET profile_id = p_primary_id WHERE profile_id = p_duplicate_id;
  v_merged_count := v_merged_count + 1;
  
  UPDATE contact_observations SET profile_id = p_primary_id WHERE profile_id = p_duplicate_id;
  v_merged_count := v_merged_count + 1;
  
  -- Mark the duplicate profile as inactive instead of deleting
  UPDATE profiles SET is_active = false, updated_at = now() WHERE id = p_duplicate_id AND user_id = p_user_id;
  
  v_result := jsonb_build_object(
    'success', true,
    'primary_id', p_primary_id,
    'duplicate_id', p_duplicate_id,
    'tables_processed', v_merged_count,
    'merged_at', now()
  );
  
  RETURN v_result;
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;