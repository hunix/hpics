import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { subDays } from 'date-fns';

export interface VelocityData {
  profileId: string;
  profileName: string;
  currentRate: number;
  previousRate: number;
  velocityChange: number;
  trend: 'accelerating' | 'decelerating' | 'stable';
  lastContact: Date | null;
  totalMessages: number;
}

interface ProfileStats {
  recentCount: number;
  previousCount: number;
  lastContact: Date | null;
  totalMessages: number;
}

export function useCommunicationVelocity() {
  const { user } = useAuth();
  return useQuery<VelocityData[]>({
    queryKey: ['communication-velocity', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const now = new Date();
      const fourWeeksAgo = subDays(now, 28);
      const eightWeeksAgo = subDays(now, 56);

      const { data: comms, error } = await supabase
        .from('communications')
        .select('profile_id, occurred_at')
        .eq('user_id', user!.id)
        .gte('occurred_at', eightWeeksAgo.toISOString())
        .order('occurred_at', { ascending: false });
      if (error) throw error;

      const profileIds = [...new Set((comms ?? []).map((c) => c.profile_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', profileIds);

      const profileMap = new Map(
        (profiles ?? []).map((p) => [p.id, `${p.first_name} ${p.last_name || ''}`.trim()])
      );

      const profileStats = new Map<string, ProfileStats>();

      (comms ?? []).forEach((c) => {
        if (!c.profile_id || !c.occurred_at) return;
        const date = new Date(c.occurred_at);
        const current: ProfileStats = profileStats.get(c.profile_id) ?? {
          recentCount: 0,
          previousCount: 0,
          lastContact: null,
          totalMessages: 0,
        };

        current.totalMessages++;
        if (!current.lastContact || date > current.lastContact) {
          current.lastContact = date;
        }
        if (date >= fourWeeksAgo) current.recentCount++;
        else current.previousCount++;

        profileStats.set(c.profile_id, current);
      });

      const velocities: VelocityData[] = [];
      profileStats.forEach((stats, profileId) => {
        const currentRate = stats.recentCount / 4;
        const previousRate = stats.previousCount / 4;

        let velocityChange = 0;
        if (previousRate > 0) {
          velocityChange = ((currentRate - previousRate) / previousRate) * 100;
        } else if (currentRate > 0) {
          velocityChange = 100;
        }

        let trend: VelocityData['trend'] = 'stable';
        if (velocityChange > 20) trend = 'accelerating';
        else if (velocityChange < -20) trend = 'decelerating';

        velocities.push({
          profileId,
          profileName: profileMap.get(profileId) || 'Unknown',
          currentRate,
          previousRate,
          velocityChange,
          trend,
          lastContact: stats.lastContact,
          totalMessages: stats.totalMessages,
        });
      });

      return velocities.sort((a, b) => Math.abs(b.velocityChange) - Math.abs(a.velocityChange));
    },
  });
}
