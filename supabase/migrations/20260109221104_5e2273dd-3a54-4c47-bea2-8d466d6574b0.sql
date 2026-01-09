-- ==============================================
-- PHASE 3: WORKSPACE RLS HARDENING (with helper functions)
-- ==============================================

-- 1. Create security definer helper for workspace membership checks
CREATE OR REPLACE FUNCTION public.check_workspace_membership(ws_id uuid, uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members 
    WHERE workspace_id = ws_id AND user_id = uid
  );
$$;

GRANT EXECUTE ON FUNCTION public.check_workspace_membership TO authenticated;

-- 2. Create helper function to check profile ownership
CREATE OR REPLACE FUNCTION public.owns_profile(profile_uuid uuid, uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = profile_uuid AND user_id = uid
  );
$$;

GRANT EXECUTE ON FUNCTION public.owns_profile TO authenticated;

-- 3. Fix workspace_members RLS policies to prevent recursion
DROP POLICY IF EXISTS "Users can view members of their workspaces" ON public.workspace_members;
DROP POLICY IF EXISTS "Workspace owners can add members" ON public.workspace_members;
DROP POLICY IF EXISTS "Workspace owners can remove members" ON public.workspace_members;
DROP POLICY IF EXISTS "Users can leave workspaces" ON public.workspace_members;

-- Recreate policies using the security definer helper
CREATE POLICY "Users can view members of their workspaces" 
ON public.workspace_members FOR SELECT 
USING (public.check_workspace_membership(workspace_id, auth.uid()));

CREATE POLICY "Workspace owners can add members" 
ON public.workspace_members FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.workspaces 
    WHERE id = workspace_id AND owner_id = auth.uid()
  )
);

CREATE POLICY "Workspace owners can remove members" 
ON public.workspace_members FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.workspaces 
    WHERE id = workspace_id AND owner_id = auth.uid()
  )
);

CREATE POLICY "Users can leave workspaces" 
ON public.workspace_members FOR DELETE 
USING (user_id = auth.uid());

-- 4. Strengthen shared_contacts INSERT policy - ensure user owns the profile they're sharing
DROP POLICY IF EXISTS "Workspace admins can share contacts" ON public.shared_contacts;

CREATE POLICY "Workspace members can share own contacts" 
ON public.shared_contacts FOR INSERT 
WITH CHECK (
  shared_by = auth.uid() 
  AND public.owns_profile(profile_id, auth.uid())
  AND public.check_workspace_membership(workspace_id, auth.uid())
);

-- 5. Strengthen team_presence INSERT policy - validate viewing_profile_id is a shared contact
DROP POLICY IF EXISTS "Users can manage own presence" ON public.team_presence;

CREATE POLICY "Users can manage own presence"
ON public.team_presence FOR INSERT 
WITH CHECK (
  user_id = auth.uid()
  AND public.check_workspace_membership(workspace_id, auth.uid())
  AND (
    viewing_profile_id IS NULL 
    OR EXISTS (
      SELECT 1 FROM public.shared_contacts sc
      WHERE sc.workspace_id = team_presence.workspace_id 
      AND sc.profile_id = team_presence.viewing_profile_id
    )
  )
);

-- 6. Strengthen team_presence UPDATE policy
DROP POLICY IF EXISTS "Users can update own presence" ON public.team_presence;

CREATE POLICY "Users can update own presence"
ON public.team_presence FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid()
  AND (
    viewing_profile_id IS NULL 
    OR EXISTS (
      SELECT 1 FROM public.shared_contacts sc
      WHERE sc.workspace_id = team_presence.workspace_id 
      AND sc.profile_id = team_presence.viewing_profile_id
    )
  )
);