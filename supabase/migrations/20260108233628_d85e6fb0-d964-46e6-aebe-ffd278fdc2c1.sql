-- Phase 2: Cost Dashboard - Create missing tables (cost_anomaly_alerts already exists)

-- AI Cost Alerts table for configurable alerts
CREATE TABLE IF NOT EXISTS public.ai_cost_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('daily', 'weekly', 'monthly', 'anomaly')),
  threshold_percent INTEGER NOT NULL DEFAULT 75 CHECK (threshold_percent >= 1 AND threshold_percent <= 100),
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  notification_channels TEXT[] DEFAULT ARRAY['in_app'],
  last_triggered_at TIMESTAMPTZ,
  trigger_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI Budget History for tracking budget changes over time
CREATE TABLE IF NOT EXISTS public.ai_budget_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  budget_type TEXT NOT NULL CHECK (budget_type IN ('daily', 'weekly', 'monthly')),
  old_value_cents INTEGER,
  new_value_cents INTEGER,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  change_reason TEXT
);

-- Per-Contact AI Spend Analysis
CREATE TABLE IF NOT EXISTS public.contact_ai_spend (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_cost_cents INTEGER NOT NULL DEFAULT 0,
  total_calls INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  breakdown_by_function JSONB DEFAULT '{}'::jsonb,
  breakdown_by_model JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, profile_id, period_start, period_end)
);

-- Enable RLS
ALTER TABLE public.ai_cost_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_budget_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_ai_spend ENABLE ROW LEVEL SECURITY;

-- RLS Policies (use IF NOT EXISTS pattern via DO block)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_cost_alerts' AND policyname = 'Users can manage their own cost alerts') THEN
    CREATE POLICY "Users can manage their own cost alerts"
      ON public.ai_cost_alerts FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_budget_history' AND policyname = 'Users can view their own budget history') THEN
    CREATE POLICY "Users can view their own budget history"
      ON public.ai_budget_history FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contact_ai_spend' AND policyname = 'Users can view their own contact AI spend') THEN
    CREATE POLICY "Users can view their own contact AI spend"
      ON public.contact_ai_spend FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END
$$;

-- Trigger to log budget changes
CREATE OR REPLACE FUNCTION public.log_budget_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.ai_budget_daily_cents IS DISTINCT FROM NEW.ai_budget_daily_cents THEN
    INSERT INTO public.ai_budget_history (user_id, budget_type, old_value_cents, new_value_cents)
    VALUES (NEW.user_id, 'daily', OLD.ai_budget_daily_cents, NEW.ai_budget_daily_cents);
  END IF;
  
  IF OLD.ai_budget_weekly_cents IS DISTINCT FROM NEW.ai_budget_weekly_cents THEN
    INSERT INTO public.ai_budget_history (user_id, budget_type, old_value_cents, new_value_cents)
    VALUES (NEW.user_id, 'weekly', OLD.ai_budget_weekly_cents, NEW.ai_budget_weekly_cents);
  END IF;
  
  IF OLD.ai_budget_monthly_cents IS DISTINCT FROM NEW.ai_budget_monthly_cents THEN
    INSERT INTO public.ai_budget_history (user_id, budget_type, old_value_cents, new_value_cents)
    VALUES (NEW.user_id, 'monthly', OLD.ai_budget_monthly_cents, NEW.ai_budget_monthly_cents);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS log_budget_changes ON public.user_preferences;
CREATE TRIGGER log_budget_changes
  AFTER UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.log_budget_change();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_cost_alerts_user ON public.ai_cost_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_budget_history_user ON public.ai_budget_history(user_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_ai_spend_user ON public.contact_ai_spend(user_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_contact_ai_spend_profile ON public.contact_ai_spend(profile_id);