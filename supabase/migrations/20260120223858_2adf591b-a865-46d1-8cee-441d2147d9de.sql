-- v3.9.14: Schema Alignment - Unique Constraints & Missing Tables (Phase 2)

-- 1. Add unique constraint on ai_analyses for upsert operations
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_analyses_profile_type 
ON public.ai_analyses (profile_id, analysis_type);

-- 2. Add unique constraint on trauma_exploitation_windows
CREATE UNIQUE INDEX IF NOT EXISTS idx_trauma_profile_user 
ON public.trauma_exploitation_windows (profile_id, user_id);

-- 3. Add unique constraint on breaking_point_predictions
CREATE UNIQUE INDEX IF NOT EXISTS idx_breaking_point_profile_user 
ON public.breaking_point_predictions (profile_id, user_id);

-- 4. Add unique constraint on phobia_mappings
CREATE UNIQUE INDEX IF NOT EXISTS idx_phobia_profile_user 
ON public.phobia_mappings (profile_id, user_id);

-- 5. Create primordial_origins table
CREATE TABLE IF NOT EXISTS public.primordial_origins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  origin_type TEXT NOT NULL,
  genesis_power_level NUMERIC DEFAULT 1,
  origin_narrative TEXT,
  foundational_patterns JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.primordial_origins ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'primordial_origins' AND policyname = 'Users can view their own primordial_origins') THEN
    CREATE POLICY "Users can view their own primordial_origins"
    ON public.primordial_origins FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'primordial_origins' AND policyname = 'Users can create their own primordial_origins') THEN
    CREATE POLICY "Users can create their own primordial_origins"
    ON public.primordial_origins FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'primordial_origins' AND policyname = 'Users can update their own primordial_origins') THEN
    CREATE POLICY "Users can update their own primordial_origins"
    ON public.primordial_origins FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'primordial_origins' AND policyname = 'Users can delete their own primordial_origins') THEN
    CREATE POLICY "Users can delete their own primordial_origins"
    ON public.primordial_origins FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- 6. Create genesis_synthesis table
CREATE TABLE IF NOT EXISTS public.genesis_synthesis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  synthesis_type TEXT NOT NULL,
  creation_potential NUMERIC DEFAULT 0,
  synthesis_output JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.genesis_synthesis ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'genesis_synthesis' AND policyname = 'Users can view their own genesis_synthesis') THEN
    CREATE POLICY "Users can view their own genesis_synthesis"
    ON public.genesis_synthesis FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'genesis_synthesis' AND policyname = 'Users can create their own genesis_synthesis') THEN
    CREATE POLICY "Users can create their own genesis_synthesis"
    ON public.genesis_synthesis FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'genesis_synthesis' AND policyname = 'Users can update their own genesis_synthesis') THEN
    CREATE POLICY "Users can update their own genesis_synthesis"
    ON public.genesis_synthesis FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'genesis_synthesis' AND policyname = 'Users can delete their own genesis_synthesis') THEN
    CREATE POLICY "Users can delete their own genesis_synthesis"
    ON public.genesis_synthesis FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- 7. Create trust_trajectory_forecasts table
CREATE TABLE IF NOT EXISTS public.trust_trajectory_forecasts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  forecast_data JSONB DEFAULT '{}'::jsonb,
  confidence_score NUMERIC DEFAULT 0,
  trajectory_points JSONB DEFAULT '[]'::jsonb,
  prediction_horizon_days INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.trust_trajectory_forecasts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'trust_trajectory_forecasts' AND policyname = 'Users can view their own trust_trajectory_forecasts') THEN
    CREATE POLICY "Users can view their own trust_trajectory_forecasts"
    ON public.trust_trajectory_forecasts FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'trust_trajectory_forecasts' AND policyname = 'Users can create their own trust_trajectory_forecasts') THEN
    CREATE POLICY "Users can create their own trust_trajectory_forecasts"
    ON public.trust_trajectory_forecasts FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'trust_trajectory_forecasts' AND policyname = 'Users can update their own trust_trajectory_forecasts') THEN
    CREATE POLICY "Users can update their own trust_trajectory_forecasts"
    ON public.trust_trajectory_forecasts FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'trust_trajectory_forecasts' AND policyname = 'Users can delete their own trust_trajectory_forecasts') THEN
    CREATE POLICY "Users can delete their own trust_trajectory_forecasts"
    ON public.trust_trajectory_forecasts FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- 8. Create prediction_accuracy_logs table
CREATE TABLE IF NOT EXISTS public.prediction_accuracy_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  prediction_id UUID,
  prediction_type TEXT NOT NULL,
  predicted_value JSONB,
  actual_value JSONB,
  was_accurate BOOLEAN,
  accuracy_score NUMERIC,
  evaluated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.prediction_accuracy_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prediction_accuracy_logs' AND policyname = 'Users can view their own prediction_accuracy_logs') THEN
    CREATE POLICY "Users can view their own prediction_accuracy_logs"
    ON public.prediction_accuracy_logs FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prediction_accuracy_logs' AND policyname = 'Users can create their own prediction_accuracy_logs') THEN
    CREATE POLICY "Users can create their own prediction_accuracy_logs"
    ON public.prediction_accuracy_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prediction_accuracy_logs' AND policyname = 'Users can update their own prediction_accuracy_logs') THEN
    CREATE POLICY "Users can update their own prediction_accuracy_logs"
    ON public.prediction_accuracy_logs FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prediction_accuracy_logs' AND policyname = 'Users can delete their own prediction_accuracy_logs') THEN
    CREATE POLICY "Users can delete their own prediction_accuracy_logs"
    ON public.prediction_accuracy_logs FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;