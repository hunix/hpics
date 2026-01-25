-- v6.0 Advanced Intelligence Schema Updates
-- Add new columns to trust_trajectories for half-life calculations
ALTER TABLE trust_trajectories ADD COLUMN IF NOT EXISTS half_life_days numeric;
ALTER TABLE trust_trajectories ADD COLUMN IF NOT EXISTS decay_rate numeric;
ALTER TABLE trust_trajectories ADD COLUMN IF NOT EXISTS projected_critical_date date;
ALTER TABLE trust_trajectories ADD COLUMN IF NOT EXISTS reinforcement_urgency text;

-- Add new columns to behavioral_anomalies for zero-day detection
ALTER TABLE behavioral_anomalies ADD COLUMN IF NOT EXISTS is_zero_day boolean DEFAULT false;
ALTER TABLE behavioral_anomalies ADD COLUMN IF NOT EXISTS novelty_score numeric;
ALTER TABLE behavioral_anomalies ADD COLUMN IF NOT EXISTS matched_known_patterns jsonb DEFAULT '[]'::jsonb;

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_trust_trajectories_half_life ON trust_trajectories(half_life_days) WHERE half_life_days IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_trust_trajectories_critical_date ON trust_trajectories(projected_critical_date) WHERE projected_critical_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_behavioral_anomalies_zero_day ON behavioral_anomalies(is_zero_day) WHERE is_zero_day = true;
CREATE INDEX IF NOT EXISTS idx_behavioral_anomalies_novelty ON behavioral_anomalies(novelty_score) WHERE novelty_score IS NOT NULL;