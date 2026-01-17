-- Phase 22: Absolute Genesis Database Tables

-- Reality creation and manifestation tracking
CREATE TABLE public.reality_creation (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id),
  creation_type TEXT NOT NULL,
  manifestation_power NUMERIC(5,2) DEFAULT 0,
  reality_blueprint JSONB DEFAULT '{}',
  creation_status TEXT DEFAULT 'initiating',
  materialization_progress NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Causal origination patterns
CREATE TABLE public.causal_origination (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id),
  origination_type TEXT NOT NULL,
  causal_depth INTEGER DEFAULT 1,
  origination_power NUMERIC(5,2) DEFAULT 0,
  cause_chain JSONB[] DEFAULT '{}',
  effect_propagation JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Genesis synthesis operations
CREATE TABLE public.genesis_synthesis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id),
  synthesis_mode TEXT NOT NULL,
  synthesis_intensity NUMERIC(5,2) DEFAULT 0,
  element_fusion JSONB DEFAULT '{}',
  synthesis_output JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Primordial creation frameworks
CREATE TABLE public.primordial_creation (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id),
  creation_domain TEXT NOT NULL,
  primordial_power NUMERIC(5,2) DEFAULT 0,
  creation_matrix JSONB DEFAULT '{}',
  manifestation_log JSONB[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Existence origination tracking
CREATE TABLE public.existence_origination (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id),
  origination_scope TEXT NOT NULL,
  existence_coefficient NUMERIC(5,2) DEFAULT 0,
  origination_framework JSONB DEFAULT '{}',
  existence_anchors JSONB[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Universal creation matrix
CREATE TABLE public.universal_creation (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id),
  creation_level TEXT NOT NULL,
  universal_power NUMERIC(5,2) DEFAULT 0,
  creation_spectrum JSONB DEFAULT '{}',
  universal_integration JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.reality_creation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.causal_origination ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.genesis_synthesis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.primordial_creation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.existence_origination ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.universal_creation ENABLE ROW LEVEL SECURITY;

-- RLS Policies for all tables
CREATE POLICY "Users can manage their own reality_creation" ON public.reality_creation FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own causal_origination" ON public.causal_origination FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own genesis_synthesis" ON public.genesis_synthesis FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own primordial_creation" ON public.primordial_creation FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own existence_origination" ON public.existence_origination FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own universal_creation" ON public.universal_creation FOR ALL USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_reality_creation_user ON public.reality_creation(user_id);
CREATE INDEX idx_reality_creation_profile ON public.reality_creation(profile_id);
CREATE INDEX idx_causal_origination_user ON public.causal_origination(user_id);
CREATE INDEX idx_genesis_synthesis_user ON public.genesis_synthesis(user_id);
CREATE INDEX idx_primordial_creation_user ON public.primordial_creation(user_id);
CREATE INDEX idx_existence_origination_user ON public.existence_origination(user_id);
CREATE INDEX idx_universal_creation_user ON public.universal_creation(user_id);