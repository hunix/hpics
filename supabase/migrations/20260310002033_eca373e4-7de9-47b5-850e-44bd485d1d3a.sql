
-- Intelligence Convergence table
CREATE TABLE public.intelligence_convergence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  overall_score NUMERIC DEFAULT 0,
  financial_depth NUMERIC DEFAULT 0,
  family_network NUMERIC DEFAULT 0,
  psychological_profile NUMERIC DEFAULT 0,
  behavioral_patterns NUMERIC DEFAULT 0,
  communication_analysis NUMERIC DEFAULT 0,
  social_dynamics NUMERIC DEFAULT 0,
  vulnerability_mapping NUMERIC DEFAULT 0,
  predictive_accuracy NUMERIC DEFAULT 0,
  data_sources_count INTEGER DEFAULT 0,
  last_updated_dimensions JSONB DEFAULT '{}'::jsonb,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.intelligence_convergence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own convergence data"
  ON public.intelligence_convergence FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Biometric Embeddings table
CREATE TABLE public.biometric_embeddings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  modality TEXT NOT NULL DEFAULT 'face',
  embedding_vector JSONB,
  quality_score NUMERIC DEFAULT 0,
  confidence NUMERIC DEFAULT 0,
  source_type TEXT DEFAULT 'upload',
  source_id UUID,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  update_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.biometric_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own biometric embeddings"
  ON public.biometric_embeddings FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Semantic Memory Facts table
CREATE TABLE public.semantic_memory_facts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  fact_category TEXT NOT NULL DEFAULT 'general',
  fact_statement TEXT NOT NULL,
  confidence NUMERIC DEFAULT 0.5,
  evidence_count INTEGER DEFAULT 1,
  source_ids UUID[] DEFAULT '{}',
  last_confirmed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.semantic_memory_facts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own semantic facts"
  ON public.semantic_memory_facts FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Intelligence Contradictions table
CREATE TABLE public.intelligence_contradictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  contradiction_type TEXT NOT NULL DEFAULT 'factual',
  existing_fact TEXT,
  conflicting_fact TEXT,
  conflict_score NUMERIC DEFAULT 0.5,
  resolution_status TEXT NOT NULL DEFAULT 'unresolved',
  resolution_notes TEXT,
  source_a_id UUID,
  source_b_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

ALTER TABLE public.intelligence_contradictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own contradictions"
  ON public.intelligence_contradictions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
