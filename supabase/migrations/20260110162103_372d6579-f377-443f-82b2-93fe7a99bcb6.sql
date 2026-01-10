-- Cross-Contact Patterns table (if not exists)
CREATE TABLE IF NOT EXISTS public.cross_contact_patterns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pattern_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  confidence_score NUMERIC DEFAULT 0.5,
  profiles_involved UUID[] DEFAULT '{}',
  evidence JSONB DEFAULT '{}',
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Proactive Insights table (if not exists)
CREATE TABLE IF NOT EXISTS public.proactive_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  insight_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium',
  category TEXT DEFAULT 'general',
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  action_type TEXT,
  action_data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending',
  snoozed_until TIMESTAMPTZ,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Intelligence processing queue (if not exists)
CREATE TABLE IF NOT EXISTS public.intelligence_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  job_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  priority INTEGER DEFAULT 5,
  status TEXT DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  error_message TEXT,
  error_details JSONB,
  scheduled_for TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cross_contact_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proactive_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intelligence_queue ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Users can view their own patterns" ON public.cross_contact_patterns;
DROP POLICY IF EXISTS "Users can create their own patterns" ON public.cross_contact_patterns;
DROP POLICY IF EXISTS "Users can update their own patterns" ON public.cross_contact_patterns;
DROP POLICY IF EXISTS "Users can delete their own patterns" ON public.cross_contact_patterns;

CREATE POLICY "Users can view their own patterns" ON public.cross_contact_patterns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own patterns" ON public.cross_contact_patterns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own patterns" ON public.cross_contact_patterns FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own patterns" ON public.cross_contact_patterns FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own insights" ON public.proactive_insights;
DROP POLICY IF EXISTS "Users can create their own insights" ON public.proactive_insights;
DROP POLICY IF EXISTS "Users can update their own insights" ON public.proactive_insights;
DROP POLICY IF EXISTS "Users can delete their own insights" ON public.proactive_insights;

CREATE POLICY "Users can view their own insights" ON public.proactive_insights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own insights" ON public.proactive_insights FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own insights" ON public.proactive_insights FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own insights" ON public.proactive_insights FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own queue items" ON public.intelligence_queue;
DROP POLICY IF EXISTS "Users can create their own queue items" ON public.intelligence_queue;
DROP POLICY IF EXISTS "Users can update their own queue items" ON public.intelligence_queue;

CREATE POLICY "Users can view their own queue items" ON public.intelligence_queue FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own queue items" ON public.intelligence_queue FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own queue items" ON public.intelligence_queue FOR UPDATE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cross_contact_patterns_user ON public.cross_contact_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_proactive_insights_user ON public.proactive_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_proactive_insights_status ON public.proactive_insights(status);
CREATE INDEX IF NOT EXISTS idx_intelligence_queue_status ON public.intelligence_queue(status, scheduled_for);