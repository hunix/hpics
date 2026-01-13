import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useToggleContactActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ profileId, isActive }: { profileId: string; isActive: boolean }) => {
      const { error } = await supabase.rpc('toggle_contact_active_status', {
        p_profile_id: profileId,
        p_is_active: isActive,
      });
      if (error) throw error;
    },
    onSuccess: (_, { isActive }) => {
      toast.success(isActive ? 'Contact marked as active' : 'Contact moved to address book');
      queryClient.invalidateQueries({ queryKey: ['enhanced-contacts'] });
      queryClient.invalidateQueries({ queryKey: ['active-contact-counts'] });
      queryClient.invalidateQueries({ queryKey: ['contacts-for-selection'] });
    },
    onError: (error) => {
      toast.error('Failed to update contact: ' + (error as Error).message);
    },
  });
}
