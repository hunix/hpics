import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { differenceInDays } from 'date-fns';

export interface DecayContact {
  id: string;
  name: string;
  relationshipType: string;
  lastContactDate: Date | null;
  decayDays: number;
  isFavorite: boolean;
  email?: string;
  phone?: string;
}

interface ContactMethodLite {
  contact_type: string;
  value: string;
  is_primary: boolean | null;
}

interface ProfileWithMethods {
  id: string;
  first_name: string;
  last_name: string | null;
  relationship_type: string | null;
  is_favorite: boolean | null;
  last_contact_date: string | null;
  contact_methods: ContactMethodLite[] | null;
}

interface CommunicationRow { profile_id: string | null; occurred_at: string | null }
interface MessageRow { sent_at: string | null; conversations: { profile_id: string | null } | null }

export function useDecayContacts() {
  const { user } = useAuth();
  return useQuery<DecayContact[]>({
    queryKey: ['decay-contacts', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: profiles } = await supabase
        .from('profiles')
        .select(`
          id, first_name, last_name, relationship_type, is_favorite, last_contact_date,
          contact_methods(contact_type, value, is_primary)
        `)
        .eq('user_id', user!.id)
        .eq('is_active', true);
      if (!profiles) return [];

      const { data: comms } = await supabase
        .from('communications')
        .select('profile_id, occurred_at')
        .eq('user_id', user!.id)
        .order('occurred_at', { ascending: false });

      const { data: msgs } = await supabase
        .from('messages')
        .select('sent_at, conversations!inner(profile_id)')
        .eq('user_id', user!.id)
        .order('sent_at', { ascending: false });

      const now = new Date();
      const contacts: DecayContact[] = [];
      const commRows = (comms ?? []) as unknown as CommunicationRow[];
      const msgRows = (msgs ?? []) as unknown as MessageRow[];

      for (const raw of profiles as unknown as ProfileWithMethods[]) {
        const lastComm = commRows.find((c) => c.profile_id === raw.id);
        const lastMsg = msgRows.find((m) => m.conversations?.profile_id === raw.id);

        const dates = [
          lastComm?.occurred_at ? new Date(lastComm.occurred_at) : null,
          lastMsg?.sent_at ? new Date(lastMsg.sent_at) : null,
          raw.last_contact_date ? new Date(raw.last_contact_date) : null,
        ].filter(Boolean) as Date[];

        const lastContactDate = dates.length > 0 ? new Date(Math.max(...dates.map((d) => d.getTime()))) : null;
        const decayDays = lastContactDate ? differenceInDays(now, lastContactDate) : 999;

        const threshold = raw.is_favorite ? 30 : 60;
        if (decayDays >= threshold) {
          const methods = raw.contact_methods ?? [];
          const primaryEmail = methods.find((m) => m.contact_type === 'email' && m.is_primary)?.value
            ?? methods.find((m) => m.contact_type === 'email')?.value;
          const primaryPhone = methods.find((m) => m.contact_type === 'phone' && m.is_primary)?.value
            ?? methods.find((m) => m.contact_type === 'phone')?.value;

          contacts.push({
            id: raw.id,
            name: `${raw.first_name} ${raw.last_name || ''}`.trim(),
            relationshipType: raw.relationship_type || 'other',
            lastContactDate,
            decayDays,
            isFavorite: raw.is_favorite || false,
            email: primaryEmail,
            phone: primaryPhone,
          });
        }
      }

      return contacts
        .sort((a, b) => {
          if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
          return b.decayDays - a.decayDays;
        })
        .slice(0, 5);
    },
  });
}
