import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface GroupWithCount {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  memberCount: number;
}

export function useContactGroupsWithCounts() {
  const { user } = useAuth();
  return useQuery<GroupWithCount[]>({
    queryKey: ['contact-groups-with-counts', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: groupsData, error: groupsError } = await supabase
        .from('contact_groups')
        .select('*')
        .order('name');
      if (groupsError) throw groupsError;

      const { data: membersData, error: membersError } = await supabase
        .from('contact_group_members')
        .select('group_id');
      if (membersError) throw membersError;

      const counts = (membersData ?? []).reduce((acc, m) => {
        acc[m.group_id] = (acc[m.group_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return (groupsData ?? []).map((g) => ({
        id: g.id,
        name: g.name,
        description: g.description ?? null,
        color: g.color ?? null,
        memberCount: counts[g.id] || 0,
      }));
    },
  });
}
