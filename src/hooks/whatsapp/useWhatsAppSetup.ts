import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface WhatsAppConfigInput {
  phoneNumberId: string;
  businessAccountId: string;
  displayPhoneNumber: string;
}

export function useSaveWhatsAppConfig(existingConfigId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (form: WhatsAppConfigInput) => {
      if (!user?.id) throw new Error('Not authenticated');
      const payload = {
        user_id: user.id,
        phone_number_id: form.phoneNumberId,
        business_account_id: form.businessAccountId || null,
        display_phone_number: form.displayPhoneNumber || null,
      };
      if (existingConfigId) {
        const { error } = await supabase
          .from('whatsapp_config')
          .update(payload)
          .eq('id', existingConfigId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('whatsapp_config').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-config'] });
    },
  });
}

export function useDeleteWhatsAppConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (configId: string) => {
      const { error } = await supabase
        .from('whatsapp_config')
        .delete()
        .eq('id', configId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-config'] });
    },
  });
}
