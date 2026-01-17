-- Phase 1: Fix RLS recursion on workspace_members
-- Drop the problematic policy first
DROP POLICY IF EXISTS "Users can view members of their workspaces" ON public.workspace_members;

-- Recreate check_workspace_membership as SECURITY DEFINER to prevent recursion
CREATE OR REPLACE FUNCTION public.check_workspace_membership(ws_id UUID, uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = ws_id AND wm.user_id = uid
  );
$$;

-- Recreate policy using direct check instead of recursive function call
CREATE POLICY "Users can view members of their workspaces"
ON public.workspace_members
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR workspace_id IN (
  SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
));

-- Phase 2: Add reminder_sent column to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_events_reminder_sent 
ON public.events(reminder_sent) WHERE reminder_sent = false;

-- Phase 3: Clean up legacy search_contacts functions
DROP FUNCTION IF EXISTS public.search_contacts_v2(uuid, text, text, integer, integer, text);
DROP FUNCTION IF EXISTS public.search_contacts_v2(uuid, text, text, text, integer, integer, text);
DROP FUNCTION IF EXISTS public.search_contacts_v2(uuid, text, text, text, text, boolean, boolean, text, integer, integer, text);