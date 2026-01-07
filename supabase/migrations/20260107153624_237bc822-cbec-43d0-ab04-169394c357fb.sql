-- Fix workspace RLS policies with logic errors

-- Drop the broken policies
DROP POLICY IF EXISTS "Users can view workspaces they own or are members of" ON workspaces;
DROP POLICY IF EXISTS "Members can view workspace members" ON workspace_members;
DROP POLICY IF EXISTS "Owners and admins can insert workspace members" ON workspace_members;
DROP POLICY IF EXISTS "Owners and admins can update workspace members" ON workspace_members;
DROP POLICY IF EXISTS "Owners and admins can delete workspace members" ON workspace_members;

-- Recreate workspace SELECT policy (fixed: wm.workspace_id = workspaces.id)
CREATE POLICY "Users can view workspaces they own or are members of"
ON workspaces
FOR SELECT
USING (
  owner_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = workspaces.id AND wm.user_id = auth.uid()
  )
);

-- Recreate workspace_members SELECT policy (fixed: proper self-reference check)
CREATE POLICY "Members can view workspace members"
ON workspace_members
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workspaces w
    WHERE w.id = workspace_members.workspace_id
    AND (
      w.owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM workspace_members wm2
        WHERE wm2.workspace_id = workspace_members.workspace_id
        AND wm2.user_id = auth.uid()
      )
    )
  )
);

-- Recreate workspace_members INSERT policy (fixed)
CREATE POLICY "Owners and admins can insert workspace members"
ON workspace_members
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM workspaces w
    WHERE w.id = workspace_members.workspace_id AND w.owner_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = workspace_members.workspace_id
    AND wm.user_id = auth.uid()
    AND wm.role IN ('owner', 'admin')
  )
);

-- Recreate workspace_members UPDATE policy (fixed)
CREATE POLICY "Owners and admins can update workspace members"
ON workspace_members
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM workspaces w
    WHERE w.id = workspace_members.workspace_id AND w.owner_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = workspace_members.workspace_id
    AND wm.user_id = auth.uid()
    AND wm.role IN ('owner', 'admin')
  )
);

-- Recreate workspace_members DELETE policy (fixed)
CREATE POLICY "Owners and admins can delete workspace members"
ON workspace_members
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM workspaces w
    WHERE w.id = workspace_members.workspace_id AND w.owner_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = workspace_members.workspace_id
    AND wm.user_id = auth.uid()
    AND wm.role IN ('owner', 'admin')
  )
);

-- Add RLS to contact_storage_stats view
-- Note: Views inherit RLS from underlying tables, but we should also check
-- Since contact_storage_stats is a view based on profiles table which already has RLS,
-- we need to ensure proper security by recreating as security invoker

-- Drop and recreate the view with SECURITY INVOKER (respects caller's permissions)
DROP VIEW IF EXISTS contact_storage_stats;

CREATE VIEW contact_storage_stats WITH (security_invoker = true) AS
SELECT 
    id AS profile_id,
    user_id,
    first_name,
    last_name,
    avatar_url,
    COALESCE((SELECT sum(m.file_size) FROM media m WHERE m.profile_id = p.id), 0)::bigint AS media_bytes,
    COALESCE((SELECT count(*) FROM media m WHERE m.profile_id = p.id), 0)::integer AS media_count,
    COALESCE((SELECT sum(d.file_size) FROM documents d WHERE d.profile_id = p.id), 0)::bigint AS document_bytes,
    COALESCE((SELECT count(*) FROM documents d WHERE d.profile_id = p.id), 0)::integer AS document_count,
    COALESCE((SELECT count(*) FROM conversations c JOIN messages msg ON msg.conversation_id = c.id WHERE c.profile_id = p.id), 0)::integer AS message_count,
    (COALESCE((SELECT sum(m.file_size) FROM media m WHERE m.profile_id = p.id), 0) + 
     COALESCE((SELECT sum(d.file_size) FROM documents d WHERE d.profile_id = p.id), 0))::bigint AS total_bytes
FROM profiles p;