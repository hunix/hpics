-- Create email_accounts table for simulated email integration
CREATE TABLE public.email_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('gmail', 'outlook')),
  email TEXT NOT NULL,
  display_name TEXT,
  is_connected BOOLEAN NOT NULL DEFAULT false,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create push_subscriptions table for PWA push notifications
CREATE TABLE public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- Create relationship_scores table to cache calculated scores
CREATE TABLE public.relationship_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  overall_score INTEGER NOT NULL DEFAULT 50,
  frequency_score INTEGER NOT NULL DEFAULT 50,
  recency_score INTEGER NOT NULL DEFAULT 50,
  diversity_score INTEGER NOT NULL DEFAULT 50,
  sentiment_score INTEGER NOT NULL DEFAULT 50,
  decay_rate NUMERIC DEFAULT 0,
  last_calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profile_id, user_id)
);

-- Enable RLS
ALTER TABLE public.email_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationship_scores ENABLE ROW LEVEL SECURITY;

-- RLS policies for email_accounts
CREATE POLICY "Users can view their own email accounts" ON public.email_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own email accounts" ON public.email_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own email accounts" ON public.email_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own email accounts" ON public.email_accounts FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for push_subscriptions
CREATE POLICY "Users can view their own subscriptions" ON public.push_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own subscriptions" ON public.push_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own subscriptions" ON public.push_subscriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own subscriptions" ON public.push_subscriptions FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for relationship_scores
CREATE POLICY "Users can view their own scores" ON public.relationship_scores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own scores" ON public.relationship_scores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own scores" ON public.relationship_scores FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own scores" ON public.relationship_scores FOR DELETE USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_email_accounts_updated_at BEFORE UPDATE ON public.email_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_push_subscriptions_updated_at BEFORE UPDATE ON public.push_subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_relationship_scores_updated_at BEFORE UPDATE ON public.relationship_scores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();