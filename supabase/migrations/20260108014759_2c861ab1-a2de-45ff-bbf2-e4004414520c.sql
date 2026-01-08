-- Add prediction outcome verification function
CREATE OR REPLACE FUNCTION public.verify_churn_prediction_outcomes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  prediction_record RECORD;
  days_since_prediction INT;
  has_recent_communication BOOLEAN;
  outcome TEXT;
  accuracy NUMERIC;
BEGIN
  -- Process predictions that are old enough to verify (at least 30 days)
  FOR prediction_record IN
    SELECT cp.*, p.last_contact_date
    FROM churn_predictions cp
    JOIN profiles p ON p.id = cp.profile_id
    WHERE cp.outcome_verified = false
      AND cp.prediction_date < NOW() - INTERVAL '30 days'
    LIMIT 100
  LOOP
    days_since_prediction := EXTRACT(EPOCH FROM (NOW() - prediction_record.prediction_date)) / 86400;
    
    -- Check if there was communication after prediction
    SELECT EXISTS (
      SELECT 1 FROM communications c
      WHERE c.profile_id = prediction_record.profile_id
        AND c.user_id = prediction_record.user_id
        AND c.occurred_at > prediction_record.prediction_date
    ) INTO has_recent_communication;
    
    -- Determine actual outcome
    IF has_recent_communication THEN
      IF prediction_record.predicted_churn_probability > 0.5 THEN
        -- Predicted churn but relationship continued (may have been due to intervention)
        outcome := 'reengaged';
        accuracy := 0.5; -- Partial credit - intervention may have worked
      ELSE
        outcome := 'retained';
        accuracy := 1.0 - prediction_record.predicted_churn_probability;
      END IF;
    ELSE
      IF prediction_record.predicted_churn_probability > 0.5 THEN
        outcome := 'churned';
        accuracy := prediction_record.predicted_churn_probability;
      ELSE
        -- Predicted low churn but relationship ended
        outcome := 'churned';
        accuracy := prediction_record.predicted_churn_probability; -- Low accuracy
      END IF;
    END IF;
    
    -- Update the prediction record
    UPDATE churn_predictions
    SET actual_outcome = outcome,
        outcome_date = NOW(),
        outcome_verified = true,
        accuracy_score = accuracy
    WHERE id = prediction_record.id;
  END LOOP;
END;
$$;

-- Add index for faster outcome verification queries
CREATE INDEX IF NOT EXISTS idx_churn_predictions_unverified 
ON churn_predictions(prediction_date) 
WHERE outcome_verified = false;

-- Add index for communication lookups during verification
CREATE INDEX IF NOT EXISTS idx_communications_occurred_at 
ON communications(profile_id, occurred_at);

-- Schedule the verification to run nightly at 3 AM
SELECT cron.schedule(
  'verify-churn-predictions',
  '0 3 * * *',
  $$SELECT public.verify_churn_prediction_outcomes()$$
);

-- Update prompt_versions table with metrics aggregation function
CREATE OR REPLACE FUNCTION public.update_prompt_version_metrics()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update the prompt_versions table with aggregated metrics from ai_usage_logs
  IF NEW.prompt_key IS NOT NULL AND NEW.status = 'completed' THEN
    UPDATE prompt_versions pv
    SET 
      usage_count = usage_count + 1,
      avg_cost_cents = (
        SELECT COALESCE(AVG(actual_cost_cents), 0)
        FROM ai_usage_logs
        WHERE prompt_key = NEW.prompt_key
          AND prompt_version = pv.version
          AND status = 'completed'
      ),
      success_rate = (
        SELECT COALESCE(
          COUNT(*) FILTER (WHERE outcome_success = true)::numeric / 
          NULLIF(COUNT(*) FILTER (WHERE outcome_success IS NOT NULL), 0),
          NULL
        )
        FROM ai_usage_logs
        WHERE prompt_key = NEW.prompt_key
          AND prompt_version = pv.version
      ),
      updated_at = NOW()
    WHERE pv.prompt_key = NEW.prompt_key
      AND pv.version = COALESCE(NEW.prompt_version, 1);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for automatic metrics update
DROP TRIGGER IF EXISTS trg_update_prompt_metrics ON ai_usage_logs;
CREATE TRIGGER trg_update_prompt_metrics
  AFTER INSERT ON ai_usage_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_prompt_version_metrics();