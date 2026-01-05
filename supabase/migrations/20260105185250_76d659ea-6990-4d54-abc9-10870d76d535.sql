-- Add is_self_profile column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_self_profile BOOLEAN DEFAULT FALSE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_is_self_profile 
ON public.profiles(user_id, is_self_profile) 
WHERE is_self_profile = TRUE;

-- Create function to merge duplicate profiles (simplified)
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
  
  -- Update media
  UPDATE media SET profile_id = p_primary_id WHERE profile_id = p_duplicate_id AND user_id = p_user_id;
  
  -- Update documents
  UPDATE documents SET profile_id = p_primary_id WHERE profile_id = p_duplicate_id AND user_id = p_user_id;
  
  -- Update conversations
  UPDATE conversations SET profile_id = p_primary_id WHERE profile_id = p_duplicate_id AND user_id = p_user_id;
  
  -- Update messages
  UPDATE messages SET profile_id = p_primary_id WHERE profile_id = p_duplicate_id AND user_id = p_user_id;
  
  -- Update communications
  UPDATE communications SET profile_id = p_primary_id WHERE profile_id = p_duplicate_id AND user_id = p_user_id;
  
  -- Update events
  UPDATE events SET profile_id = p_primary_id WHERE profile_id = p_duplicate_id AND user_id = p_user_id;
  
  -- Delete the duplicate profile
  DELETE FROM profiles WHERE id = p_duplicate_id AND user_id = p_user_id;
  
  RETURN json_build_object(
    'success', true,
    'primary_id', p_primary_id,
    'deleted_id', p_duplicate_id
  );
END;
$$;