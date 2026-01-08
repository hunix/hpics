-- Create function to queue observation for enrichment (using correct table name)
CREATE OR REPLACE FUNCTION queue_observation_enrichment()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO enrichment_queue (user_id, profile_id, item_type, item_id, priority, metadata)
  VALUES (
    NEW.user_id,
    NEW.profile_id,
    'observation',
    NEW.id,
    CASE WHEN NEW.significance = 'high' THEN 15 ELSE 5 END,
    jsonb_build_object('observation_type', NEW.observation_type, 'significance', NEW.significance)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on correct table
DROP TRIGGER IF EXISTS trg_queue_observation_enrichment ON contact_observations;
CREATE TRIGGER trg_queue_observation_enrichment
  AFTER INSERT ON contact_observations
  FOR EACH ROW EXECUTE FUNCTION queue_observation_enrichment();