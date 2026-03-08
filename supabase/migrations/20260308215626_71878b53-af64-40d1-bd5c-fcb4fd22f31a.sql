
CREATE OR REPLACE FUNCTION public.increment_automation_counters(
  p_rule_id uuid,
  p_field text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF p_field = 'success_count' THEN
    UPDATE automation_rules
    SET success_count = COALESCE(success_count, 0) + 1
    WHERE id = p_rule_id;
  ELSIF p_field = 'failure_count' THEN
    UPDATE automation_rules
    SET failure_count = COALESCE(failure_count, 0) + 1
    WHERE id = p_rule_id;
  END IF;
END;
$$;
