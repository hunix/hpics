import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface WorkspaceWithMembers {
  id: string;
  name: string;
  owner_id: string;
  workspace_members: Array<{
    id: string;
    user_id: string;
    role: string;
    accepted_at: string | null;
  }>;
}

export interface SharedContact {
  id: string;
  first_name: string;
  last_name: string | null;
  organization: string | null;
  workspace_id: string | null;
}

export interface TeamActivity {
  id: string;
  title: string;
  description: string | null;
  occurred_at: string;
}

export function useTeamWorkspaces() {
  const { user } = useAuth();
  return useQuery<WorkspaceWithMembers[]>({
    queryKey: ['team-workspaces', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspaces')
        .select(`
          *,
          workspace_members (id, user_id, role, accepted_at)
        `)
        .or(`owner_id.eq.${user!.id},workspace_members.user_id.eq.${user!.id}`);
      if (error) throw error;
      return ((data ?? []) as unknown) as WorkspaceWithMembers[];
    },
  });
}

export function useSharedContacts(workspaceIds: string[]) {
  return useQuery<SharedContact[]>({
    queryKey: ['shared-contacts', workspaceIds],
    enabled: workspaceIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, organization, workspace_id')
        .in('workspace_id', workspaceIds)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data ?? []) as SharedContact[];
    },
  });
}

export function useTeamActivity() {
  const { user } = useAuth();
  return useQuery<TeamActivity[]>({
    queryKey: ['team-activity', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_activity_feed')
        .select('*')
        .eq('user_id', user!.id)
        .order('occurred_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return ((data ?? []) as unknown) as TeamActivity[];
    },
  });
}

export function useCreateWorkspace() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      if (!name.trim()) throw new Error('Name required');

      const { data: workspace, error } = await supabase
        .from('workspaces')
        .insert({ name: name.trim(), owner_id: user.id })
        .select()
        .single();
      if (error) throw error;

      await supabase.from('workspace_members').insert({
        workspace_id: workspace.id,
        user_id: user.id,
        role: 'owner',
        accepted_at: new Date().toISOString(),
      });

      return workspace;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-workspaces'] });
    },
  });
}
