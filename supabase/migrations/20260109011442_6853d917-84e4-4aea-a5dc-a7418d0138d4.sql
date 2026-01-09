-- Create navigation_preferences table for user customization
CREATE TABLE public.navigation_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  collapsed_groups TEXT[] DEFAULT '{}',
  pinned_items TEXT[] DEFAULT '{}',
  hidden_items TEXT[] DEFAULT '{}',
  group_order JSONB DEFAULT '[]',
  color_overrides JSONB DEFAULT '{}',
  layout_mode TEXT DEFAULT 'comfortable' CHECK (layout_mode IN ('compact', 'comfortable', 'spacious')),
  show_badges BOOLEAN DEFAULT true,
  show_descriptions BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create navigation_quick_access table for tracking frequently used items
CREATE TABLE public.navigation_quick_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  route TEXT NOT NULL,
  access_count INTEGER DEFAULT 1,
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, route)
);

-- Enable RLS
ALTER TABLE public.navigation_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.navigation_quick_access ENABLE ROW LEVEL SECURITY;

-- RLS policies for navigation_preferences
CREATE POLICY "Users can view own navigation preferences"
ON public.navigation_preferences FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own navigation preferences"
ON public.navigation_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own navigation preferences"
ON public.navigation_preferences FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own navigation preferences"
ON public.navigation_preferences FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for navigation_quick_access
CREATE POLICY "Users can view own quick access"
ON public.navigation_quick_access FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quick access"
ON public.navigation_quick_access FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quick access"
ON public.navigation_quick_access FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own quick access"
ON public.navigation_quick_access FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_navigation_preferences_updated_at
BEFORE UPDATE ON public.navigation_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to upsert navigation access tracking
CREATE OR REPLACE FUNCTION public.track_navigation_access(p_route TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO navigation_quick_access (user_id, route, access_count, last_accessed)
  VALUES (auth.uid(), p_route, 1, NOW())
  ON CONFLICT (user_id, route)
  DO UPDATE SET 
    access_count = navigation_quick_access.access_count + 1,
    last_accessed = NOW();
END;
$$;