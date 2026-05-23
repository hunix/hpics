import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface SharedExperience {
  id: string;
  title: string;
  milestone_type: string;
  event_date: string | null;
  related_contacts: string[];
  participantNames?: string[];
}

export function useSharedExperiences() {
  const { user } = useAuth();
  return useQuery<SharedExperience[]>({
    queryKey: ['shared-experiences-map', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: milestones, error } = await supabase
        .from('contact_life_milestones')
        .select('id, title, milestone_type, event_date, related_contacts')
        .eq('user_id', user!.id)
        .not('related_contacts', 'is', null)
        .order('event_date', { ascending: false })
        .limit(50);
      if (error) throw error;

      const sharedEvents = ((milestones ?? []) as SharedExperience[]).filter(
        (e) => e.related_contacts && e.related_contacts.length >= 2
      );

      const allParticipantIds = [
        ...new Set(sharedEvents.flatMap((e) => e.related_contacts || [])),
      ];

      if (allParticipantIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', allParticipantIds);

        const profileMap = new Map(
          (profiles ?? []).map((p) => [p.id, `${p.first_name} ${p.last_name || ''}`.trim()])
        );

        return sharedEvents.map((e) => ({
          ...e,
          participantNames: (e.related_contacts || []).map(
            (id) => profileMap.get(id) || 'Unknown'
          ),
        }));
      }

      return sharedEvents;
    },
  });
}
