import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { profileKeys } from '@/domains/profile';

// Tables that key a profile by `profile_id` and should be cascade-deleted
// when a contact is removed. Kept inline because the underlying schema
// doesn't yet enforce ON DELETE CASCADE for all of them.
const CASCADE_TABLES_BY_PROFILE = [
  'ai_analyses',
  'behavioral_analyses',
  'body_language_analyses',
  'facial_analyses',
  'certifications',
  'communications',
  'contact_bank_accounts',
  'contact_devices',
  'contact_financial_history',
  'contact_graduations',
  'contact_group_members',
  'contact_identity_documents',
  'contact_interests',
  'contact_languages',
  'contact_methods',
  'contact_observations',
  'contact_payment_accounts',
  'contact_personal_info',
  'contact_properties',
  'contact_residences',
  'contact_skills',
  'contact_travel_history',
  'contact_vehicles',
  'conversations',
  'documents',
  'education',
  'events',
  'gift_ideas',
  'media',
  'meeting_recordings',
  'relationship_goals',
  'analysis_sessions',
  'contact_kids_schools',
] as const;

export function useBulkDeleteContacts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      for (const table of CASCADE_TABLES_BY_PROFILE) {
        await supabase.from(table).delete().in('profile_id', ids);
      }
      await supabase.from('contact_relationships').delete().in('from_profile_id', ids);
      await supabase.from('contact_relationships').delete().in('to_profile_id', ids);

      const { error } = await supabase.from('profiles').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}
