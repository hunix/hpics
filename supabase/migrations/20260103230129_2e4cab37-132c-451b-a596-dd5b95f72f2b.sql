-- Add AI budget settings to user_preferences
ALTER TABLE public.user_preferences 
ADD COLUMN ai_budget_daily_cents INTEGER DEFAULT NULL,
ADD COLUMN ai_budget_weekly_cents INTEGER DEFAULT NULL,
ADD COLUMN ai_budget_monthly_cents INTEGER DEFAULT NULL,
ADD COLUMN ai_budget_alerts_enabled BOOLEAN DEFAULT true;