-- Add budget columns to user_preferences
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS ai_budget_daily_limit_cents integer DEFAULT 500,
ADD COLUMN IF NOT EXISTS ai_budget_weekly_limit_cents integer DEFAULT 2000,
ADD COLUMN IF NOT EXISTS ai_budget_monthly_limit_cents integer DEFAULT 5000,
ADD COLUMN IF NOT EXISTS ai_budget_alert_threshold integer DEFAULT 75,
ADD COLUMN IF NOT EXISTS ai_budget_enforce_limits boolean DEFAULT true;