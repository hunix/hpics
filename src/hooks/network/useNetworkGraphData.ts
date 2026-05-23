import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface NetworkProfileRow {
  id: string;
  first_name: string;
  last_name: string | null;
  organization: string | null;
  is_favorite: boolean | null;
}

export interface NetworkRelationshipRow {
  from_profile_id: string;
  to_profile_id: string;
  relationship_type: string;
}

export interface NetworkGraphRawData {
  profiles: NetworkProfileRow[];
  relationships: NetworkRelationshipRow[];
}

export function useAdvancedNetworkGraphData(limit = 500) {
  const { user } = useAuth();
  return useQuery<NetworkGraphRawData>({
    queryKey: ['advanced-network-data', user?.id, limit],
    enabled: !!user,
    queryFn: async () => {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, organization, is_favorite')
        .eq('user_id', user!.id)
        .eq('is_active', true)
        .limit(limit);

      const profileRows = (profiles ?? []) as NetworkProfileRow[];
      const profileIds = profileRows.map((p) => p.id);

      const { data: relationships } = await supabase
        .from('contact_relationships')
        .select('from_profile_id, to_profile_id, relationship_type')
        .eq('user_id', user!.id)
        .in('from_profile_id', profileIds)
        .in('to_profile_id', profileIds);

      return {
        profiles: profileRows,
        relationships: (relationships ?? []) as NetworkRelationshipRow[],
      };
    },
  });
}
