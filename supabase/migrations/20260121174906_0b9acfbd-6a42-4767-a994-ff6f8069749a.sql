-- Fix Race Condition: Atomic task claiming with SKIP LOCKED pattern
-- This prevents duplicate task processing when multiple polling requests arrive simultaneously

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION claim_pending_tasks(UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION claim_pending_tasks(UUID, INT) TO service_role;

-- Add per-complexity timeout constants (stored in platform_config for easy tuning)
INSERT INTO platform_config (config_key, config_value, description, category, display_name, value_type, default_value) 
VALUES 
  ('task_timeout_light_ms', '180000', 'Timeout for light complexity tasks (3 min)', 'intelligence', 'Light Task Timeout', 'number', '180000'),
  ('task_timeout_standard_ms', '300000', 'Timeout for standard complexity tasks (5 min)', 'intelligence', 'Standard Task Timeout', 'number', '300000'),
  ('task_timeout_complex_ms', '600000', 'Timeout for complex complexity tasks (10 min)', 'intelligence', 'Complex Task Timeout', 'number', '600000'),
  ('task_timeout_extreme_ms', '900000', 'Timeout for extreme complexity tasks (15 min)', 'intelligence', 'Extreme Task Timeout', 'number', '900000')
ON CONFLICT (config_key) DO UPDATE SET 
  config_value = EXCLUDED.config_value,
  description = EXCLUDED.description;