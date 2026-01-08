-- Phase 3: Prediction Accuracy Tracking

-- Create churn predictions tracking table
CREATE TABLE IF NOT EXISTS public.churn_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  prediction_date TIMESTAMPTZ DEFAULT now(),
  predicted_churn_probability NUMERIC(5,4) CHECK (predicted_churn_probability >= 0 AND predicted_churn_probability <= 1),
  predicted_days_to_churn INTEGER,
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
  contributing_factors JSONB DEFAULT '[]'::jsonb,
  model_used TEXT,
  intervention_recommended TEXT,
  -- Outcome tracking (filled in later)
  actual_outcome TEXT CHECK (actual_outcome IS NULL OR actual_outcome IN ('churned', 'retained', 'reengaged', 'pending')),
  outcome_date TIMESTAMPTZ,
  outcome_verified BOOLEAN DEFAULT false,
  accuracy_score NUMERIC(5,4),
  verification_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_churn_predictions_user ON public.churn_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_churn_predictions_profile ON public.churn_predictions(profile_id);
CREATE INDEX IF NOT EXISTS idx_churn_predictions_date ON public.churn_predictions(prediction_date DESC);
CREATE INDEX IF NOT EXISTS idx_churn_predictions_outcome ON public.churn_predictions(actual_outcome) WHERE actual_outcome IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_churn_predictions_unverified ON public.churn_predictions(user_id, prediction_date) WHERE outcome_verified = false;

-- Enable RLS
ALTER TABLE public.churn_predictions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own predictions"
  ON public.churn_predictions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own predictions"
  ON public.churn_predictions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own predictions"
  ON public.churn_predictions FOR UPDATE
  USING (auth.uid() = user_id);

-- Create prediction accuracy stats view
CREATE OR REPLACE VIEW public.prediction_accuracy_stats AS
SELECT 
  user_id,
  model_used,
  risk_level,
  COUNT(*) as total_predictions,
  COUNT(*) FILTER (WHERE actual_outcome IS NOT NULL) as verified_predictions,
  ROUND(AVG(accuracy_score) FILTER (WHERE accuracy_score IS NOT NULL), 4) as avg_accuracy,
  COUNT(*) FILTER (WHERE risk_score >= 70 AND actual_outcome = 'churned') as true_positives,
  COUNT(*) FILTER (WHERE risk_score < 30 AND actual_outcome = 'retained') as true_negatives,
  COUNT(*) FILTER (WHERE risk_score >= 70 AND actual_outcome = 'retained') as false_positives,
  COUNT(*) FILTER (WHERE risk_score < 30 AND actual_outcome = 'churned') as false_negatives,
  ROUND(
    CASE 
      WHEN COUNT(*) FILTER (WHERE actual_outcome IS NOT NULL) > 0 
      THEN 100.0 * (
        COUNT(*) FILTER (WHERE (risk_score >= 70 AND actual_outcome = 'churned') OR (risk_score < 30 AND actual_outcome = 'retained'))
      ) / NULLIF(COUNT(*) FILTER (WHERE actual_outcome IS NOT NULL), 0)
      ELSE NULL
    END, 2
  ) as accuracy_percentage
FROM churn_predictions
GROUP BY user_id, model_used, risk_level;

-- Grant access to the view
GRANT SELECT ON public.prediction_accuracy_stats TO authenticated;

-- Add prompt_key and prompt_version tracking to ai_usage_logs if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'ai_usage_logs' AND column_name = 'prompt_key') THEN
    ALTER TABLE public.ai_usage_logs ADD COLUMN prompt_key TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'ai_usage_logs' AND column_name = 'prompt_version') THEN
    ALTER TABLE public.ai_usage_logs ADD COLUMN prompt_version INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'ai_usage_logs' AND column_name = 'outcome_success') THEN
    ALTER TABLE public.ai_usage_logs ADD COLUMN outcome_success BOOLEAN;
  END IF;
END $$;