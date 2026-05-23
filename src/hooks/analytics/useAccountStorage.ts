import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface StorageSummary {
  total_bytes: number;
  media_bytes: number;
  document_bytes: number;
  recording_bytes: number;
  message_count: number;
  contact_count: number;
  ai_tokens_used: number;
  ai_cost_cents: number;
  storage_quota_bytes: number;
  usage_percentage: number;
}

export function useAccountStorageSummary() {
  const { user } = useAuth();
  return useQuery<StorageSummary | null>({
    queryKey: ['account-storage-summary', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_account_storage_summary', {
        p_user_id: user!.id,
      });
      if (error) throw error;
      return (data?.[0] as StorageSummary | null) ?? null;
    },
  });
}
