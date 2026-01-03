-- Create contact_groups table
CREATE TABLE public.contact_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6366f1',
  icon TEXT DEFAULT 'users',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contact_group_members table
CREATE TABLE public.contact_group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.contact_groups(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, profile_id)
);

-- Enable RLS
ALTER TABLE public.contact_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_group_members ENABLE ROW LEVEL SECURITY;

-- RLS policies for contact_groups
CREATE POLICY "Users can view their own groups"
ON public.contact_groups FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own groups"
ON public.contact_groups FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own groups"
ON public.contact_groups FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own groups"
ON public.contact_groups FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for contact_group_members
CREATE POLICY "Users can view members of their groups"
ON public.contact_group_members FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.contact_groups
  WHERE contact_groups.id = contact_group_members.group_id
  AND contact_groups.user_id = auth.uid()
));

CREATE POLICY "Users can add members to their groups"
ON public.contact_group_members FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.contact_groups
  WHERE contact_groups.id = contact_group_members.group_id
  AND contact_groups.user_id = auth.uid()
));

CREATE POLICY "Users can remove members from their groups"
ON public.contact_group_members FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.contact_groups
  WHERE contact_groups.id = contact_group_members.group_id
  AND contact_groups.user_id = auth.uid()
));

-- Triggers for updated_at
CREATE TRIGGER update_contact_groups_updated_at
BEFORE UPDATE ON public.contact_groups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();