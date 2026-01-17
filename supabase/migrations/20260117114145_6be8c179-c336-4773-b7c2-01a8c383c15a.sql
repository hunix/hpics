-- Fix Critical RLS Recursion on workspace_members
-- Drop BOTH problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Users can view members of their workspaces" ON public.workspace_members;
DROP POLICY IF EXISTS "Members can view workspace members" ON public.workspace_members;

-- Create a SINGLE non-recursive SELECT policy
-- Uses the SECURITY DEFINER function which bypasses RLS internally
CREATE POLICY "Workspace members can view their workspaces"
ON public.workspace_members
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.check_workspace_membership(workspace_id, auth.uid())
);

-- Clean up any remaining legacy search_contacts_v2 overloads
DROP FUNCTION IF EXISTS public.search_contacts_v2(uuid, text, text, boolean, integer, integer);
DROP FUNCTION IF EXISTS public.search_contacts_v2(uuid, text, text, text, integer, integer);
DROP FUNCTION IF EXISTS public.search_contacts_v2(uuid, text, text, text, text, boolean, boolean, text, integer, integer);