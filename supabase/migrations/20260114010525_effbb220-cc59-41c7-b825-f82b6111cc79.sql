
-- Add enhanced contact-news correlation fields
ALTER TABLE public.contact_news_correlations 
ADD COLUMN IF NOT EXISTS prediction_type TEXT,
ADD COLUMN IF NOT EXISTS predicted_behavior TEXT,
ADD COLUMN IF NOT EXISTS predicted_timeline TEXT,
ADD COLUMN IF NOT EXISTS opportunity_type TEXT,
ADD COLUMN IF NOT EXISTS action_recommendations JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS historical_accuracy NUMERIC,
ADD COLUMN IF NOT EXISTS validated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS actual_outcome TEXT;

-- Create contact news alerts table
CREATE TABLE IF NOT EXISTS public.contact_news_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  news_item_id UUID REFERENCES public.news_intelligence_items(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL, -- 'company_news', 'industry_shift', 'competitor_move', 'opportunity', 'risk', 'layoff_warning', 'funding_announcement'
  severity TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  title TEXT NOT NULL,
  description TEXT,
  predicted_impact JSONB, -- {type, magnitude, timeframe, confidence}
  recommended_actions JSONB DEFAULT '[]'::jsonb,
  conversation_starters TEXT[],
  is_read BOOLEAN DEFAULT false,
  is_actioned BOOLEAN DEFAULT false,
  actioned_at TIMESTAMPTZ,
  action_outcome TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create contact behavior predictions table
CREATE TABLE IF NOT EXISTS public.contact_behavior_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  prediction_type TEXT NOT NULL, -- 'job_change', 'financial_stress', 'opportunity_window', 'travel', 'mood_shift', 'decision_timing'
  trigger_source TEXT NOT NULL, -- 'news', 'pattern', 'network', 'behavior'
  trigger_details JSONB,
  prediction_value JSONB NOT NULL, -- The actual prediction
  confidence_score NUMERIC NOT NULL,
  evidence JSONB DEFAULT '[]'::jsonb,
  time_horizon TEXT, -- 'immediate', 'days', 'weeks', 'months'
  predicted_date_range TSTZRANGE,
  is_validated BOOLEAN DEFAULT false,
  validation_date TIMESTAMPTZ,
  actual_outcome JSONB,
  accuracy_score NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create industry tracking table
CREATE TABLE IF NOT EXISTS public.tracked_industries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  industry_name TEXT NOT NULL,
  keywords TEXT[] DEFAULT '{}',
  sentiment_baseline NUMERIC DEFAULT 0,
  current_sentiment NUMERIC DEFAULT 0,
  sentiment_trend TEXT DEFAULT 'stable', -- 'rising', 'falling', 'stable', 'volatile'
  risk_level TEXT DEFAULT 'low',
  opportunity_score NUMERIC DEFAULT 0,
  last_major_event TIMESTAMPTZ,
  event_summary TEXT,
  contacts_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, industry_name)
);

-- Enable RLS
ALTER TABLE public.contact_news_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_behavior_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracked_industries ENABLE ROW LEVEL SECURITY;

-- RLS policies for contact_news_alerts
CREATE POLICY "Users can view their own contact news alerts"
  ON public.contact_news_alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own contact news alerts"
  ON public.contact_news_alerts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own contact news alerts"
  ON public.contact_news_alerts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own contact news alerts"
  ON public.contact_news_alerts FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for contact_behavior_predictions
CREATE POLICY "Users can view their own contact behavior predictions"
  ON public.contact_behavior_predictions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own contact behavior predictions"
  ON public.contact_behavior_predictions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own contact behavior predictions"
  ON public.contact_behavior_predictions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own contact behavior predictions"
  ON public.contact_behavior_predictions FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for tracked_industries
CREATE POLICY "Users can view their own tracked industries"
  ON public.tracked_industries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own tracked industries"
  ON public.tracked_industries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tracked industries"
  ON public.tracked_industries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tracked industries"
  ON public.tracked_industries FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_contact_news_alerts_profile ON public.contact_news_alerts(profile_id);
CREATE INDEX IF NOT EXISTS idx_contact_news_alerts_user ON public.contact_news_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_news_alerts_type ON public.contact_news_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_contact_news_alerts_unread ON public.contact_news_alerts(user_id, is_read) WHERE NOT is_read;
CREATE INDEX IF NOT EXISTS idx_contact_behavior_predictions_profile ON public.contact_behavior_predictions(profile_id);
CREATE INDEX IF NOT EXISTS idx_contact_behavior_predictions_type ON public.contact_behavior_predictions(prediction_type);
CREATE INDEX IF NOT EXISTS idx_tracked_industries_user ON public.tracked_industries(user_id);

-- Trigger for updated_at
CREATE TRIGGER update_contact_news_alerts_updated_at
  BEFORE UPDATE ON public.contact_news_alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contact_behavior_predictions_updated_at
  BEFORE UPDATE ON public.contact_behavior_predictions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tracked_industries_updated_at
  BEFORE UPDATE ON public.tracked_industries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
