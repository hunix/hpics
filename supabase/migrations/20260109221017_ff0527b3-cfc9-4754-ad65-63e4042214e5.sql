-- ==============================================
-- PHASE 2: SCHEMA CLEANUP - Drop duplicate budget columns
-- ==============================================

-- Remove old duplicate columns (data was never populated in them)
ALTER TABLE public.user_preferences 
  DROP COLUMN IF EXISTS ai_budget_daily_cents,
  DROP COLUMN IF EXISTS ai_budget_weekly_cents,
  DROP COLUMN IF EXISTS ai_budget_monthly_cents;