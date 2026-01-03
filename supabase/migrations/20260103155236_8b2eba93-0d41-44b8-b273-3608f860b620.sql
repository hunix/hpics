-- Table for tracking relationship health trends over time
CREATE TABLE public.relationship_trends (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  health_score INTEGER NOT NULL CHECK (health_score >= 0 AND health_score <= 100),
  communication_count INTEGER DEFAULT 0,
  sentiment_avg NUMERIC(3,2),
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for contact interests and preferences
CREATE TABLE public.contact_interests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  interest_type TEXT NOT NULL CHECK (interest_type IN ('hobby', 'topic', 'brand', 'food', 'travel', 'sport', 'music', 'other')),
  name TEXT NOT NULL,
  notes TEXT,
  source TEXT CHECK (source IN ('manual', 'ai_detected', 'enrichment')),
  confidence_score NUMERIC(3,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for relationship goals and streaks
CREATE TABLE public.relationship_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('contact_frequency', 'meeting', 'call', 'message', 'gift', 'custom')),
  title TEXT NOT NULL,
  description TEXT,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly')),
  target_count INTEGER DEFAULT 1,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_completed_at TIMESTAMP WITH TIME ZONE,
  next_due_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for shared experiences with contacts
CREATE TABLE public.shared_experiences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  experience_type TEXT NOT NULL CHECK (experience_type IN ('trip', 'event', 'project', 'celebration', 'meal', 'activity', 'other')),
  title TEXT NOT NULL,
  description TEXT,
  experience_date DATE,
  location TEXT,
  media_urls TEXT[],
  tags TEXT[],
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for gift ideas and suggestions
CREATE TABLE public.gift_ideas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  price_range TEXT CHECK (price_range IN ('budget', 'moderate', 'premium', 'luxury')),
  category TEXT,
  occasion TEXT,
  url TEXT,
  is_given BOOLEAN DEFAULT false,
  given_date DATE,
  source TEXT CHECK (source IN ('manual', 'ai_suggested')),
  ai_reasoning TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for weekly summaries
CREATE TABLE public.weekly_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  summary_data JSONB NOT NULL,
  highlights TEXT[],
  recommendations TEXT[],
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start)
);

-- Enable RLS on all new tables
ALTER TABLE public.relationship_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationship_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_summaries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for relationship_trends
CREATE POLICY "Users can view their own trends" ON public.relationship_trends FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own trends" ON public.relationship_trends FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own trends" ON public.relationship_trends FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for contact_interests
CREATE POLICY "Users can view their own interests" ON public.contact_interests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own interests" ON public.contact_interests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own interests" ON public.contact_interests FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own interests" ON public.contact_interests FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for relationship_goals
CREATE POLICY "Users can view their own goals" ON public.relationship_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own goals" ON public.relationship_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own goals" ON public.relationship_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own goals" ON public.relationship_goals FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for shared_experiences
CREATE POLICY "Users can view their own experiences" ON public.shared_experiences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own experiences" ON public.shared_experiences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own experiences" ON public.shared_experiences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own experiences" ON public.shared_experiences FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for gift_ideas
CREATE POLICY "Users can view their own gift ideas" ON public.gift_ideas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own gift ideas" ON public.gift_ideas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own gift ideas" ON public.gift_ideas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own gift ideas" ON public.gift_ideas FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for weekly_summaries
CREATE POLICY "Users can view their own summaries" ON public.weekly_summaries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own summaries" ON public.weekly_summaries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own summaries" ON public.weekly_summaries FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_relationship_trends_user_profile ON public.relationship_trends(user_id, profile_id);
CREATE INDEX idx_relationship_trends_recorded_at ON public.relationship_trends(recorded_at);
CREATE INDEX idx_contact_interests_profile ON public.contact_interests(profile_id);
CREATE INDEX idx_relationship_goals_user ON public.relationship_goals(user_id);
CREATE INDEX idx_relationship_goals_next_due ON public.relationship_goals(next_due_at);
CREATE INDEX idx_shared_experiences_profile ON public.shared_experiences(profile_id);
CREATE INDEX idx_gift_ideas_profile ON public.gift_ideas(profile_id);
CREATE INDEX idx_weekly_summaries_user_week ON public.weekly_summaries(user_id, week_start);

-- Trigger for updating updated_at columns
CREATE TRIGGER update_contact_interests_updated_at BEFORE UPDATE ON public.contact_interests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_relationship_goals_updated_at BEFORE UPDATE ON public.relationship_goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_shared_experiences_updated_at BEFORE UPDATE ON public.shared_experiences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();