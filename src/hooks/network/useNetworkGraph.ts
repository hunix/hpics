import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type SamplingStrategy = 'favorites' | 'recent' | 'connected';

export interface NetworkNode {
  id: string;
  name: string;
  group: string;
  organization?: string;
  isFavorite: boolean;
}

export interface NetworkLink {
  source: string;
  target: string;
  type: string;
  strength: number;
}

export interface NetworkGraphResult {
  nodes: NetworkNode[];
  links: NetworkLink[];
  totalNodes: number;
  sampled: boolean;
}

export interface NetworkGraphOptions {
  maxNodes: number;
  strategy: SamplingStrategy;
}

export function useNetworkGraph({ maxNodes, strategy }: NetworkGraphOptions) {
  const { user } = useAuth();
  return useQuery<NetworkGraphResult>({
    queryKey: ['network-graph', user?.id, strategy, maxNodes],
    enabled: !!user,
    staleTime: 60000,
    queryFn: async () => {
      const { count: totalCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id);

      const needsSampling = (totalCount ?? 0) > maxNodes;

      let query = supabase
        .from('profiles')
        .select('id, first_name, last_name, organization, relationship_type, is_favorite, tags, created_at, updated_at')
        .eq('user_id', user!.id);

      if (needsSampling) {
        switch (strategy) {
          case 'favorites':
            query = query.order('is_favorite', { ascending: false }).order('created_at', { ascending: false });
            break;
          case 'recent':
            query = query.order('updated_at', { ascending: false });
            break;
          case 'connected':
          default:
            query = query.order('is_favorite', { ascending: false }).order('updated_at', { ascending: false });
            break;
        }
        query = query.limit(maxNodes);
      }

      const { data: profiles } = await query;
      const profileRows = profiles ?? [];
      const profileIds = profileRows.map((p) => p.id);

      const { data: relationships } = await supabase
        .from('contact_relationships')
        .select('from_profile_id, to_profile_id, relationship_type')
        .eq('user_id', user!.id)
        .in('from_profile_id', profileIds)
        .in('to_profile_id', profileIds);

      const { data: interests } = await supabase
        .from('contact_interests')
        .select('profile_id, name')
        .eq('user_id', user!.id)
        .in('profile_id', profileIds);

      const { data: skills } = await supabase
        .from('contact_skills')
        .select('profile_id, skill_name')
        .eq('user_id', user!.id)
        .in('profile_id', profileIds);

      const nodes: NetworkNode[] = profileRows.map((p) => ({
        id: p.id,
        name: `${p.first_name} ${p.last_name || ''}`.trim() || 'Unknown',
        group: p.relationship_type || 'other',
        organization: p.organization || undefined,
        isFavorite: p.is_favorite || false,
      }));

      const links: NetworkLink[] = [];
      const interestsMap = new Map<string, string[]>();
      const skillsMap = new Map<string, string[]>();
      const orgsMap = new Map<string, string[]>();

      (interests ?? []).forEach((i) => {
        const existing = interestsMap.get(i.name.toLowerCase()) || [];
        existing.push(i.profile_id);
        interestsMap.set(i.name.toLowerCase(), existing);
      });

      (skills ?? []).forEach((s) => {
        const existing = skillsMap.get(s.skill_name.toLowerCase()) || [];
        existing.push(s.profile_id);
        skillsMap.set(s.skill_name.toLowerCase(), existing);
      });

      profileRows.forEach((p) => {
        if (p.organization) {
          const existing = orgsMap.get(p.organization.toLowerCase()) || [];
          existing.push(p.id);
          orgsMap.set(p.organization.toLowerCase(), existing);
        }
      });

      (relationships ?? []).forEach((r) => {
        const existing = links.find((l) =>
          (l.source === r.from_profile_id && l.target === r.to_profile_id) ||
          (l.source === r.to_profile_id && l.target === r.from_profile_id)
        );
        if (existing) {
          existing.strength += 3;
        } else {
          links.push({
            source: r.from_profile_id,
            target: r.to_profile_id,
            type: r.relationship_type || 'relationship',
            strength: 3,
          });
        }
      });

      const linkSharedAttribute = (pIds: string[], type: string, strength: number) => {
        if (pIds.length <= 1) return;
        for (let i = 0; i < pIds.length; i++) {
          for (let j = i + 1; j < pIds.length; j++) {
            const existing = links.find((l) =>
              (l.source === pIds[i] && l.target === pIds[j]) ||
              (l.source === pIds[j] && l.target === pIds[i])
            );
            if (existing) {
              existing.strength += strength;
            } else {
              links.push({ source: pIds[i], target: pIds[j], type, strength });
            }
          }
        }
      };

      interestsMap.forEach((pIds) => linkSharedAttribute(pIds, 'interest', 1));
      skillsMap.forEach((pIds) => linkSharedAttribute(pIds, 'skill', 1));
      orgsMap.forEach((pIds) => linkSharedAttribute(pIds, 'organization', 2));

      return { nodes, links, totalNodes: totalCount ?? 0, sampled: needsSampling };
    },
  });
}
