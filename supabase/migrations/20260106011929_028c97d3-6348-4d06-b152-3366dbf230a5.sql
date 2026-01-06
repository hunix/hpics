-- Create function to atomically increment bulk session progress
CREATE OR REPLACE FUNCTION public.increment_bulk_session_progress(
  p_session_id UUID,
  p_cost_cents INTEGER DEFAULT 0,
  p_is_completed BOOLEAN DEFAULT false,
  p_is_failed BOOLEAN DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE bulk_analysis_sessions
  SET
    completed_items = CASE WHEN p_is_completed THEN completed_items + 1 ELSE completed_items END,
    failed_items = CASE WHEN p_is_failed THEN failed_items + 1 ELSE failed_items END,
    current_cost_cents = current_cost_cents + p_cost_cents,
    current_item_index = current_item_index + 1,
    updated_at = NOW()
  WHERE id = p_session_id;
END;
$$;