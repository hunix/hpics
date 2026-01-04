-- Table for contact-to-contact relationships (for family trees, professional networks, etc.)
CREATE TABLE public.contact_relationships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  from_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL, -- family, professional, social, custom
  relationship_label TEXT NOT NULL, -- father, mother, spouse, manager, friend, etc.
  is_bidirectional BOOLEAN DEFAULT false, -- e.g., spouse is bidirectional, parent-child is not
  inverse_label TEXT, -- for non-bidirectional: if A is "father" of B, B is "child" of A
  notes TEXT,
  start_date DATE, -- when the relationship started
  end_date DATE, -- for past relationships (e.g., ex-spouse)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, from_profile_id, to_profile_id, relationship_label)
);

-- Enable RLS
ALTER TABLE public.contact_relationships ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own contact relationships"
ON public.contact_relationships FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own contact relationships"
ON public.contact_relationships FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contact relationships"
ON public.contact_relationships FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contact relationships"
ON public.contact_relationships FOR DELETE
USING (auth.uid() = user_id);

-- Table for kids' schools (can be on parent or child contact)
CREATE TABLE public.contact_kids_schools (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  child_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- if child is a contact
  child_name TEXT, -- if child is not a separate contact
  school_name TEXT NOT NULL,
  school_type TEXT, -- kindergarten, elementary, middle, high, university
  grade_or_year TEXT,
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN DEFAULT true,
  school_address TEXT,
  school_city TEXT,
  school_country TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_kids_schools ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own contact kids schools"
ON public.contact_kids_schools FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own contact kids schools"
ON public.contact_kids_schools FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contact kids schools"
ON public.contact_kids_schools FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contact kids schools"
ON public.contact_kids_schools FOR DELETE
USING (auth.uid() = user_id);

-- Add location columns to contact_properties for Google Maps integration
ALTER TABLE public.contact_properties 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS google_maps_url TEXT,
ADD COLUMN IF NOT EXISTS place_name TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT;

-- Add location columns to contact_residences for Google Maps integration
ALTER TABLE public.contact_residences
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS google_maps_url TEXT,
ADD COLUMN IF NOT EXISTS place_name TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT;

-- Create trigger for updated_at on contact_relationships
CREATE TRIGGER update_contact_relationships_updated_at
BEFORE UPDATE ON public.contact_relationships
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on contact_kids_schools
CREATE TRIGGER update_contact_kids_schools_updated_at
BEFORE UPDATE ON public.contact_kids_schools
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();