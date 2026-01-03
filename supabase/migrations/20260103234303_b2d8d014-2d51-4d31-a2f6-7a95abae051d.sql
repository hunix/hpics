-- Extended Contact Information Tables

-- Personal Info (DOB, gender, blood group, allergies, etc.)
CREATE TABLE public.contact_personal_info (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  date_of_birth DATE,
  gender TEXT,
  blood_group TEXT,
  rh_type TEXT,
  allergies TEXT[],
  place_of_birth TEXT,
  mother_name TEXT,
  father_name TEXT,
  nationality TEXT,
  favorite_color TEXT,
  smoking_preference TEXT, -- none, cigarettes, vape, shisha, etc.
  main_residence_country TEXT,
  main_residence_city TEXT,
  usual_hangout_places TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profile_id)
);

ALTER TABLE public.contact_personal_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own contact personal info"
  ON public.contact_personal_info FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own contact personal info"
  ON public.contact_personal_info FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own contact personal info"
  ON public.contact_personal_info FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contact personal info"
  ON public.contact_personal_info FOR DELETE
  USING (auth.uid() = user_id);

-- Identity Documents (IDs, passports)
CREATE TABLE public.contact_identity_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  document_type TEXT NOT NULL, -- passport, national_id, driver_license, etc.
  document_number TEXT,
  issuing_country TEXT,
  issue_date DATE,
  expiry_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_identity_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own contact identity documents"
  ON public.contact_identity_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own contact identity documents"
  ON public.contact_identity_documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own contact identity documents"
  ON public.contact_identity_documents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contact identity documents"
  ON public.contact_identity_documents FOR DELETE
  USING (auth.uid() = user_id);

-- Languages spoken
CREATE TABLE public.contact_languages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  language_name TEXT NOT NULL,
  proficiency_level TEXT, -- native, fluent, intermediate, basic
  is_native BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_languages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own contact languages"
  ON public.contact_languages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own contact languages"
  ON public.contact_languages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own contact languages"
  ON public.contact_languages FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contact languages"
  ON public.contact_languages FOR DELETE
  USING (auth.uid() = user_id);

-- Residence history (where lived each period)
CREATE TABLE public.contact_residences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  country TEXT NOT NULL,
  city TEXT,
  address TEXT,
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN DEFAULT false,
  residence_type TEXT, -- home, apartment, villa, etc.
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_residences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own contact residences"
  ON public.contact_residences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own contact residences"
  ON public.contact_residences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own contact residences"
  ON public.contact_residences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contact residences"
  ON public.contact_residences FOR DELETE
  USING (auth.uid() = user_id);

-- Vehicles owned
CREATE TABLE public.contact_vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  vehicle_type TEXT NOT NULL, -- car, motorcycle, boat, etc.
  make TEXT,
  model TEXT,
  year INTEGER,
  color TEXT,
  license_plate TEXT,
  is_current BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own contact vehicles"
  ON public.contact_vehicles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own contact vehicles"
  ON public.contact_vehicles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own contact vehicles"
  ON public.contact_vehicles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contact vehicles"
  ON public.contact_vehicles FOR DELETE
  USING (auth.uid() = user_id);

-- Devices (phones, tablets, laptops, desktops)
CREATE TABLE public.contact_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  device_type TEXT NOT NULL, -- phone, tablet, laptop, desktop, watch, etc.
  brand TEXT,
  model TEXT,
  os TEXT, -- iOS, Android, Windows, macOS, etc.
  is_current BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own contact devices"
  ON public.contact_devices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own contact devices"
  ON public.contact_devices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own contact devices"
  ON public.contact_devices FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contact devices"
  ON public.contact_devices FOR DELETE
  USING (auth.uid() = user_id);

-- Travel history
CREATE TABLE public.contact_travel_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  destination_country TEXT NOT NULL,
  destination_city TEXT,
  travel_date DATE,
  return_date DATE,
  purpose TEXT, -- vacation, business, family visit, etc.
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_travel_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own contact travel history"
  ON public.contact_travel_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own contact travel history"
  ON public.contact_travel_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own contact travel history"
  ON public.contact_travel_history FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contact travel history"
  ON public.contact_travel_history FOR DELETE
  USING (auth.uid() = user_id);

-- Real estate / Properties
CREATE TABLE public.contact_properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  property_type TEXT NOT NULL, -- house, apartment, villa, land, commercial, etc.
  country TEXT,
  city TEXT,
  address TEXT,
  area_sqm NUMERIC,
  purchase_date DATE,
  estimated_value TEXT,
  is_primary_residence BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own contact properties"
  ON public.contact_properties FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own contact properties"
  ON public.contact_properties FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own contact properties"
  ON public.contact_properties FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contact properties"
  ON public.contact_properties FOR DELETE
  USING (auth.uid() = user_id);

-- Graduation / Academic milestones
CREATE TABLE public.contact_graduations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  education_level TEXT NOT NULL, -- primary, secondary, high_school, bachelor, master, phd, etc.
  institution_name TEXT,
  graduation_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_graduations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own contact graduations"
  ON public.contact_graduations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own contact graduations"
  ON public.contact_graduations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own contact graduations"
  ON public.contact_graduations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contact graduations"
  ON public.contact_graduations FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_contact_personal_info_profile ON public.contact_personal_info(profile_id);
CREATE INDEX idx_contact_identity_documents_profile ON public.contact_identity_documents(profile_id);
CREATE INDEX idx_contact_languages_profile ON public.contact_languages(profile_id);
CREATE INDEX idx_contact_residences_profile ON public.contact_residences(profile_id);
CREATE INDEX idx_contact_vehicles_profile ON public.contact_vehicles(profile_id);
CREATE INDEX idx_contact_devices_profile ON public.contact_devices(profile_id);
CREATE INDEX idx_contact_travel_history_profile ON public.contact_travel_history(profile_id);
CREATE INDEX idx_contact_properties_profile ON public.contact_properties(profile_id);
CREATE INDEX idx_contact_graduations_profile ON public.contact_graduations(profile_id);

-- Add triggers for updated_at
CREATE TRIGGER update_contact_personal_info_updated_at
  BEFORE UPDATE ON public.contact_personal_info
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();