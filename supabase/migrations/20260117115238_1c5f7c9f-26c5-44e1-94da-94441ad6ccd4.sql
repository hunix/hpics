-- Fix remaining RLS infinite recursion for workspace_members
-- Create SECURITY DEFINER function to check admin status without triggering RLS

CREATE OR REPLACE FUNCTION public.is_workspace_admin(ws_id UUID, uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspaces w
    WHERE w.id = ws_id AND w.owner_id = uid
  ) OR EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = ws_id 
    AND wm.user_id = uid
    AND wm.role IN ('owner', 'admin')
  );
$$;

-- Drop all recursive INSERT policies
DROP POLICY IF EXISTS "Owners and admins can insert workspace members" ON public.workspace_members;
DROP POLICY IF EXISTS "Workspace owners can add members" ON public.workspace_members;

-- Drop all recursive UPDATE policies
DROP POLICY IF EXISTS "Owners and admins can update workspace members" ON public.workspace_members;

-- Drop all recursive DELETE policies
DROP POLICY IF EXISTS "Owners and admins can delete workspace members" ON public.workspace_members;
DROP POLICY IF EXISTS "Workspace owners can remove members" ON public.workspace_members;

-- Create non-recursive INSERT policy
CREATE POLICY "Admins can add workspace members"
ON public.workspace_members
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_workspace_admin(workspace_id, auth.uid())
);

-- Create non-recursive UPDATE policy
CREATE POLICY "Admins can update workspace members"
ON public.workspace_members
FOR UPDATE
TO authenticated
USING (
  public.is_workspace_admin(workspace_id, auth.uid())
);

-- Create non-recursive DELETE policy
CREATE POLICY "Admins can remove workspace members"
ON public.workspace_members
FOR DELETE
TO authenticated
USING (
  public.is_workspace_admin(workspace_id, auth.uid())
);