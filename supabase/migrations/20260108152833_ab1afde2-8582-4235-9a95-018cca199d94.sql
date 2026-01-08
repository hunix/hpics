-- Create shared_contacts table for explicit contact sharing
CREATE TABLE IF NOT EXISTS public.shared_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL,
  permission_level TEXT NOT NULL DEFAULT 'view' CHECK (permission_level IN ('view', 'edit', 'admin')),
  shared_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  UNIQUE(profile_id, workspace_id)
);

-- Create contact_comments table for collaborative notes
CREATE TABLE IF NOT EXISTS public.contact_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create team_presence table for real-time presence
CREATE TABLE IF NOT EXISTS public.team_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'online' CHECK (status IN ('online', 'away', 'busy', 'offline')),
  current_view TEXT,
  viewing_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, workspace_id)
);

-- Enable RLS
ALTER TABLE public.shared_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_presence ENABLE ROW LEVEL SECURITY;

-- RLS for shared_contacts - workspace members can see shared contacts
CREATE POLICY "Workspace members can view shared contacts"
ON public.shared_contacts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = shared_contacts.workspace_id
    AND wm.user_id = auth.uid()
  )
);

CREATE POLICY "Workspace admins can share contacts"
ON public.shared_contacts FOR INSERT
WITH CHECK (
  shared_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = shared_contacts.workspace_id
    AND wm.user_id = auth.uid()
    AND wm.role IN ('owner', 'admin', 'editor')
  )
);

CREATE POLICY "Workspace admins can update shared contacts"
ON public.shared_contacts FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = shared_contacts.workspace_id
    AND wm.user_id = auth.uid()
    AND wm.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Workspace admins can delete shared contacts"
ON public.shared_contacts FOR DELETE
USING (
  shared_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = shared_contacts.workspace_id
    AND wm.user_id = auth.uid()
    AND wm.role IN ('owner', 'admin')
  )
);

-- RLS for contact_comments
CREATE POLICY "Users can view their own comments"
ON public.contact_comments FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can view team comments on shared contacts"
ON public.contact_comments FOR SELECT
USING (
  is_private = false AND
  EXISTS (
    SELECT 1 FROM public.shared_contacts sc
    JOIN public.workspace_members wm ON wm.workspace_id = sc.workspace_id
    WHERE sc.profile_id = contact_comments.profile_id
    AND wm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create comments"
ON public.contact_comments FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own comments"
ON public.contact_comments FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own comments"
ON public.contact_comments FOR DELETE
USING (user_id = auth.uid());

-- RLS for team_presence
CREATE POLICY "Workspace members can view presence"
ON public.team_presence FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = team_presence.workspace_id
    AND wm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage own presence"
ON public.team_presence FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own presence"
ON public.team_presence FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own presence"
ON public.team_presence FOR DELETE
USING (user_id = auth.uid());

-- Enable realtime for collaboration tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.shared_contacts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.contact_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_presence;

-- Create indexes for performance
CREATE INDEX idx_shared_contacts_workspace ON public.shared_contacts(workspace_id);
CREATE INDEX idx_shared_contacts_profile ON public.shared_contacts(profile_id);
CREATE INDEX idx_contact_comments_profile ON public.contact_comments(profile_id);
CREATE INDEX idx_team_presence_workspace ON public.team_presence(workspace_id);
CREATE INDEX idx_team_presence_last_seen ON public.team_presence(last_seen);