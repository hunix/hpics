-- Enhanced populate_cross_references trigger that also re-links orphaned email threads
-- when a new email contact method is added

CREATE OR REPLACE FUNCTION populate_cross_references()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_threads_linked INT := 0;
BEGIN
  -- Get user_id from the parent profile since contact_methods doesn't have user_id
  SELECT user_id INTO v_user_id
  FROM public.profiles
  WHERE id = NEW.profile_id;
  
  -- Skip if no profile found or no user_id
  IF v_user_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- For phone numbers
  IF NEW.contact_type = 'phone' THEN
    INSERT INTO public.cross_references (profile_id, reference_type, reference_value, normalized_value, source, confidence, user_id)
    VALUES (NEW.profile_id, 'phone', NEW.value, regexp_replace(NEW.value, '[^0-9+]', '', 'g'), 'contact_methods', 0.95, v_user_id)
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- For emails
  IF NEW.contact_type = 'email' THEN
    -- Insert cross reference
    INSERT INTO public.cross_references (profile_id, reference_type, reference_value, normalized_value, source, confidence, user_id)
    VALUES (NEW.profile_id, 'email', NEW.value, lower(NEW.value), 'contact_methods', 0.95, v_user_id)
    ON CONFLICT DO NOTHING;
    
    -- Auto-link orphaned email threads that match this new email address
    -- This handles threads that were imported before the contact method was added
    WITH matched_threads AS (
      SELECT DISTINCT et.id
      FROM public.email_threads et
      JOIN public.email_messages em ON em.thread_id = et.id
      WHERE et.user_id = v_user_id
        AND et.profile_id IS NULL
        AND (
          -- Match sender email (handle malformed formats)
          lower(COALESCE(
            (regexp_match(em.sender_email, '<mailto:([^>]+)>'))[1],
            (regexp_match(em.sender_email, '<([^<>]+@[^<>]+)>'))[1],
            CASE WHEN em.sender_email ~ '@' THEN trim(lower(em.sender_email)) ELSE NULL END
          )) = lower(NEW.value)
          OR
          -- Also check if email appears in recipients array
          lower(NEW.value) = ANY(
            SELECT lower(unnest(em.recipients))
          )
        )
    )
    UPDATE public.email_threads
    SET profile_id = NEW.profile_id
    WHERE id IN (SELECT id FROM matched_threads);
    
    GET DIAGNOSTICS v_threads_linked = ROW_COUNT;
    
    IF v_threads_linked > 0 THEN
      RAISE NOTICE 'Auto-linked % orphaned email threads to profile %', v_threads_linked, NEW.profile_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;