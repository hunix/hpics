-- Fix the populate_cross_references trigger function to properly lookup user_id from profiles table
CREATE OR REPLACE FUNCTION populate_cross_references()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get user_id from the parent profile since contact_methods doesn't have user_id
  SELECT user_id INTO v_user_id
  FROM profiles
  WHERE id = NEW.profile_id;
  
  -- Skip if no profile found or no user_id
  IF v_user_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- For phone numbers
  IF NEW.contact_type = 'phone' THEN
    INSERT INTO cross_references (profile_id, reference_type, reference_value, normalized_value, source, confidence, user_id)
    VALUES (NEW.profile_id, 'phone', NEW.value, regexp_replace(NEW.value, '[^0-9+]', '', 'g'), 'contact_methods', 0.95, v_user_id)
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- For emails
  IF NEW.contact_type = 'email' THEN
    INSERT INTO cross_references (profile_id, reference_type, reference_value, normalized_value, source, confidence, user_id)
    VALUES (NEW.profile_id, 'email', NEW.value, lower(NEW.value), 'contact_methods', 0.95, v_user_id)
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;