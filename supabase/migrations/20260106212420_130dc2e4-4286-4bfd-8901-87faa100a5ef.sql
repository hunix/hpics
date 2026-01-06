-- Phase B: Notification Preferences Table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  push_enabled BOOLEAN DEFAULT false,
  email_enabled BOOLEAN DEFAULT true,
  push_subscription JSONB,
  alert_types_enabled TEXT[] DEFAULT ARRAY['relationship_decay', 'anomaly_detected', 'action_required', 'opportunity_identified'],
  min_severity TEXT DEFAULT 'medium',
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  digest_frequency TEXT DEFAULT 'daily',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own notification preferences"
  ON public.notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences"
  ON public.notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences"
  ON public.notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Update trigger
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Phase D: Enable pg_cron extension and schedule
-- Note: pg_cron extension setup requires special permissions, creating as reference
COMMENT ON TABLE public.notification_preferences IS 'User notification preferences for intelligence alerts. pg_cron should be configured to call process-scheduled-intelligence edge function daily at 2 AM.';