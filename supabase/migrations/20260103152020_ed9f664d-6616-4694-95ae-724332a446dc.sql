-- Create education/academic background table
CREATE TABLE public.education (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  institution_name TEXT NOT NULL,
  degree_type TEXT, -- e.g., Bachelor's, Master's, PhD, Certificate
  field_of_study TEXT,
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN DEFAULT false,
  grade_or_gpa TEXT,
  activities TEXT,
  description TEXT,
  linkedin_id TEXT, -- For future LinkedIn sync
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create certifications table
CREATE TABLE public.certifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  issuing_organization TEXT,
  issue_date DATE,
  expiration_date DATE,
  credential_id TEXT,
  credential_url TEXT,
  linkedin_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create skills table for contacts
CREATE TABLE public.contact_skills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  skill_name TEXT NOT NULL,
  proficiency_level TEXT, -- beginner, intermediate, advanced, expert
  endorsement_count INTEGER DEFAULT 0,
  linkedin_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_skills ENABLE ROW LEVEL SECURITY;

-- RLS policies for education
CREATE POLICY "Users can view education of their profiles" ON public.education
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create education for their profiles" ON public.education
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update education of their profiles" ON public.education
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete education of their profiles" ON public.education
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for certifications
CREATE POLICY "Users can view certifications of their profiles" ON public.certifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create certifications for their profiles" ON public.certifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update certifications of their profiles" ON public.certifications
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete certifications of their profiles" ON public.certifications
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for contact_skills
CREATE POLICY "Users can view skills of their profiles" ON public.contact_skills
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create skills for their profiles" ON public.contact_skills
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update skills of their profiles" ON public.contact_skills
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete skills of their profiles" ON public.contact_skills
  FOR DELETE USING (auth.uid() = user_id);

-- Add linkedin_profile_url to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS linkedin_url TEXT;

-- Create indexes
CREATE INDEX idx_education_profile_id ON public.education(profile_id);
CREATE INDEX idx_certifications_profile_id ON public.certifications(profile_id);
CREATE INDEX idx_contact_skills_profile_id ON public.contact_skills(profile_id);

-- Trigger for updated_at
CREATE TRIGGER update_education_updated_at
  BEFORE UPDATE ON public.education
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();