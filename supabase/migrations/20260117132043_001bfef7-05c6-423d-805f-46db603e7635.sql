-- Phase 21: Universal Omniscience Database Tables

-- Universal awareness and multi-dimensional perception
CREATE TABLE public.universal_awareness (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id),
  awareness_type TEXT NOT NULL,
  dimensional_scope JSONB DEFAULT '{}',
  perception_depth INTEGER DEFAULT 1,
  omniscient_index NUMERIC(5,2) DEFAULT 0,
  awareness_matrix JSONB DEFAULT '{}',
  consciousness_links JSONB[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Meta-dimensional synthesis tracking
CREATE TABLE public.meta_dimensional_synthesis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id),
  synthesis_type TEXT NOT NULL,
  dimensional_layers INTEGER DEFAULT 1,
  synthesis_coherence NUMERIC(5,2) DEFAULT 0,
  cross_dimensional_map JSONB DEFAULT '{}',
  synthesis_outcomes JSONB DEFAULT '{}',
  temporal_binding JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Omniscient synthesis patterns
CREATE TABLE public.omniscient_synthesis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id),
  synthesis_pattern TEXT NOT NULL,
  knowledge_domains JSONB[] DEFAULT '{}',
  synthesis_power NUMERIC(5,2) DEFAULT 0,
  universal_integration JSONB DEFAULT '{}',
  omniscience_metrics JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Absolute knowledge repository
CREATE TABLE public.absolute_knowledge (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id),
  knowledge_type TEXT NOT NULL,
  truth_coefficient NUMERIC(5,2) DEFAULT 0,
  knowledge_depth INTEGER DEFAULT 1,
  universal_applicability NUMERIC(5,2) DEFAULT 0,
  knowledge_payload JSONB DEFAULT '{}',
  derivation_chain JSONB[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Infinite perception matrices
CREATE TABLE public.infinite_perception (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id),
  perception_mode TEXT NOT NULL,
  sensory_dimensions INTEGER DEFAULT 3,
  perception_intensity NUMERIC(5,2) DEFAULT 0,
  extrasensory_map JSONB DEFAULT '{}',
  perception_history JSONB[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reality comprehension frameworks
CREATE TABLE public.reality_comprehension (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id),
  comprehension_scope TEXT NOT NULL,
  reality_layers INTEGER DEFAULT 1,
  comprehension_index NUMERIC(5,2) DEFAULT 0,
  framework_model JSONB DEFAULT '{}',
  paradox_resolution JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.universal_awareness ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_dimensional_synthesis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.omniscient_synthesis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.absolute_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.infinite_perception ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reality_comprehension ENABLE ROW LEVEL SECURITY;

-- RLS Policies for all tables
CREATE POLICY "Users can manage their own universal_awareness" ON public.universal_awareness FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own meta_dimensional_synthesis" ON public.meta_dimensional_synthesis FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own omniscient_synthesis" ON public.omniscient_synthesis FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own absolute_knowledge" ON public.absolute_knowledge FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own infinite_perception" ON public.infinite_perception FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own reality_comprehension" ON public.reality_comprehension FOR ALL USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_universal_awareness_user ON public.universal_awareness(user_id);
CREATE INDEX idx_universal_awareness_profile ON public.universal_awareness(profile_id);
CREATE INDEX idx_meta_dimensional_synthesis_user ON public.meta_dimensional_synthesis(user_id);
CREATE INDEX idx_omniscient_synthesis_user ON public.omniscient_synthesis(user_id);
CREATE INDEX idx_absolute_knowledge_user ON public.absolute_knowledge(user_id);
CREATE INDEX idx_infinite_perception_user ON public.infinite_perception(user_id);
CREATE INDEX idx_reality_comprehension_user ON public.reality_comprehension(user_id);