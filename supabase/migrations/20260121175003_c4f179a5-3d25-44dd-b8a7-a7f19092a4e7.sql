-- Fix security warning: Set search_path for claim_pending_tasks function
CREATE OR REPLACE FUNCTION claim_pending_tasks(
  p_session_id UUID, 
  p_limit INT DEFAULT 3
)
RETURNS SETOF intelligence_session_tasks AS $$
DECLARE
  claimed_tasks intelligence_session_tasks[];
BEGIN
  -- Atomically claim tasks using FOR UPDATE SKIP LOCKED
  -- This ensures only one request can claim a specific task
  WITH claimed AS (
    UPDATE intelligence_session_tasks 
    SET 
      status = 'running', 
      started_at = NOW(),
      attempts = attempts + 1
    WHERE id IN (
      SELECT id FROM intelligence_session_tasks
      WHERE session_id = p_session_id 
        AND status = 'pending'
      ORDER BY priority ASC, created_at ASC
      LIMIT p_limit
      FOR UPDATE SKIP LOCKED
    )
    RETURNING *
  )
  SELECT ARRAY_AGG(claimed.*) INTO claimed_tasks FROM claimed;
  
  RETURN QUERY SELECT * FROM unnest(claimed_tasks);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;