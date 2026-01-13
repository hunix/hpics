-- Fix search_path for trigger function
CREATE OR REPLACE FUNCTION activate_contact_on_interaction()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    IF NEW.source_type = 'profile' THEN
      v_profile_id := NEW.source_id::uuid;
      v_user_id := NEW.user_id;
    ELSE
      RETURN NEW;
    END IF;
  ELSIF TG_TABLE_NAME = 'media_contact_tags' THEN
    v_profile_id := NEW.profile_id;
    SELECT user_id INTO v_user_id FROM media WHERE id = NEW.media_id;
  ELSE
    v_profile_id := NEW.profile_id;
    v_user_id := NEW.user_id;
  END IF;
  
  IF v_profile_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  UPDATE profiles 
  SET 
    is_active = true,
    activation_date = COALESCE(activation_date, now()),
    last_interaction_at = now(),
    engagement_score = COALESCE(engagement_score, 0) + v_weight
  WHERE id = v_profile_id;
  
  IF v_user_id IS NOT NULL THEN
    INSERT INTO contact_engagement_log (user_id, profile_id, interaction_type, interaction_weight)
    VALUES (v_user_id, v_profile_id, v_interaction_type, v_weight);
  END IF;
  
  RETURN NEW;
END;
$$;