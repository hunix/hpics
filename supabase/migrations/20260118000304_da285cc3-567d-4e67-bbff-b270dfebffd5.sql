-- Fix search_path security warnings for the new functions
CREATE OR REPLACE FUNCTION public.modes_all_completed(completed_modes TEXT[], requested_modes TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
  -- Returns true if all requested modes are already in completed_modes
  RETURN requested_modes <@ completed_modes;
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_remaining_modes(completed_modes TEXT[], requested_modes TEXT[])
RETURNS TEXT[] AS $$
BEGIN
  -- Returns requested modes that are NOT in completed_modes
  RETURN ARRAY(SELECT unnest(requested_modes) EXCEPT SELECT unnest(completed_modes));
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;