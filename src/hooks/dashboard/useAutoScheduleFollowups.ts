import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { addDays } from 'date-fns';

export interface PendingFollowupSchedule {
  contactId: string;
  contactName: string;
  relationshipType: string;
  daysSinceContact: number;
  suggestedDate: Date;
  priority: 'overdue' | 'upcoming';
}

const SUGGESTED_INTERVAL_DAYS: Record<string, number> = {
  family: 7,
  friend: 14,
  mentor: 21,
  mentee: 21,
  colleague: 30,
  client: 30,
};

export function usePendingFollowupSchedules() {
  const { user } = useAuth();
  return useQuery<PendingFollowupSchedule[]>({
    queryKey: ['pending-schedules', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, relationship_type, last_contact_date')
        .eq('user_id', user!.id)
        .eq('is_active', true);

      const { data: existingEvents } = await supabase
        .from('events')
        .select('profile_id')
        .eq('user_id', user!.id)
        .eq('event_type', 'follow_up')
        .gte('event_date', new Date().toISOString());

      const scheduledProfileIds = new Set((existingEvents ?? []).map((e) => e.profile_id));
      const now = new Date();

      return (profiles ?? [])
        .filter((p) => !scheduledProfileIds.has(p.id))
        .map((p) => {
          const lastContact = p.last_contact_date ? new Date(p.last_contact_date) : null;
          const daysSince = lastContact
            ? Math.floor((now.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24))
            : 999;
          const suggestedDays = SUGGESTED_INTERVAL_DAYS[p.relationship_type ?? ''] ?? 45;

          return {
            contactId: p.id,
            contactName: `${p.first_name} ${p.last_name || ''}`.trim(),
            relationshipType: p.relationship_type || 'other',
            daysSinceContact: daysSince,
            suggestedDate: addDays(now, Math.max(1, suggestedDays - Math.min(daysSince, suggestedDays))),
            priority: (daysSince > suggestedDays ? 'overdue' : 'upcoming') as 'overdue' | 'upcoming',
          };
        })
        .filter((p) => p.daysSinceContact > 7)
        .sort((a, b) => b.daysSinceContact - a.daysSinceContact)
        .slice(0, 10);
    },
  });
}

export function useScheduleFollowup() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (contact: { contactId: string; contactName: string; suggestedDate: Date }) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase.from('events').insert({
        user_id: user.id,
        profile_id: contact.contactId,
        title: `Follow up with ${contact.contactName}`,
        event_type: 'follow_up',
        event_date: contact.suggestedDate.toISOString(),
        reminder_days_before: 1,
        reminder_frequency: 'once',
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

export function useScheduleAllFollowups() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (contacts: PendingFollowupSchedule[]) => {
      if (!user?.id) throw new Error('Not authenticated');
      if (contacts.length === 0) return;

      const inserts = contacts.map((c) => ({
        user_id: user.id,
        profile_id: c.contactId,
        title: `Follow up with ${c.contactName}`,
        event_type: 'follow_up' as const,
        event_date: c.suggestedDate.toISOString(),
        reminder_days_before: 1,
        reminder_frequency: 'once' as const,
        is_active: true,
      }));

      const { error } = await supabase.from('events').insert(inserts);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}
