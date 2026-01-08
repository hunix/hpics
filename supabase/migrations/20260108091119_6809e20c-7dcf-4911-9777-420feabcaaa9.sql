-- Create AI budget settings table
CREATE TABLE public.ai_budget_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  daily_limit_cents INTEGER,
  weekly_limit_cents INTEGER,
  monthly_limit_cents INTEGER,
  alert_threshold_percent INTEGER DEFAULT 75,
  enforce_limits BOOLEAN DEFAULT false,
  notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.ai_budget_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own budget settings"
ON public.ai_budget_settings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own budget settings"
ON public.ai_budget_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budget settings"
ON public.ai_budget_settings FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budget settings"
ON public.ai_budget_settings FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_ai_budget_settings_updated_at
BEFORE UPDATE ON public.ai_budget_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();