import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { getConnectedMembers } from '@/lib/familyTreeEngine';
import type { ProfileInfo, RawRelationship } from '@/lib/familyTreeEngine';

export interface FamilyTreeData {
  relationships: RawRelationship[];
  profiles: Map<string, ProfileInfo>;
  selfProfileId: string | null;
}

export function useFamilyTreeData() {
  const { user } = useAuth();
  return useQuery<FamilyTreeData>({
    queryKey: ['family-relationships', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: relationships, error: relError } = await supabase
        .from('contact_relationships')
        .select('id, from_profile_id, to_profile_id, relationship_label, inverse_label, is_inferred')
        .eq('user_id', user!.id)
        .eq('relationship_type', 'family');
      if (relError) throw relError;

      const profileIds = new Set<string>();
      (relationships ?? []).forEach((r) => {
        profileIds.add(r.from_profile_id);
        profileIds.add(r.to_profile_id);
      });

      const { data: profiles, error: profError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, is_self_profile')
        .in('id', Array.from(profileIds));
      if (profError) throw profError;

      const profileMap = new Map(
        (profiles ?? []).map((p) => [p.id, p as unknown as ProfileInfo])
      );

      const selfProfile = (profiles ?? []).find((p) => p.is_self_profile);

      let filteredRelationships = (relationships ?? []) as unknown as RawRelationship[];
      if (selfProfile && filteredRelationships.length > 0) {
        const connectedIds = getConnectedMembers(filteredRelationships, selfProfile.id);
        filteredRelationships = filteredRelationships.filter(
          (r) => connectedIds.has(r.from_profile_id) && connectedIds.has(r.to_profile_id)
        );
      }

      return {
        relationships: filteredRelationships,
        profiles: profileMap,
        selfProfileId: selfProfile?.id ?? null,
      };
    },
  });
}
