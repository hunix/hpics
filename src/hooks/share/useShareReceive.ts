import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ShareContact {
  id: string;
  first_name: string;
  last_name: string | null;
  avatar_url: string | null;
  organization: string | null;
}

export function useShareContacts() {
  const { user } = useAuth();
  return useQuery<ShareContact[]>({
    queryKey: ['share-contacts', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, organization')
        .eq('user_id', user!.id)
        .order('first_name');
      if (error) throw error;
      return (data ?? []) as ShareContact[];
    },
  });
}

export interface DeviceCaptureInsert {
  profileId: string;
  captureType: 'url' | 'text';
  sourceApp: string;
  rawContent: string;
  metadata?: Record<string, unknown>;
}

export function useCreateDeviceCapture() {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: DeviceCaptureInsert) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase.from('device_captures').insert({
        user_id: user.id,
        profile_id: input.profileId,
        capture_type: input.captureType,
        source_app: input.sourceApp,
        raw_content: input.rawContent,
        status: 'pending',
        metadata: (input.metadata ?? {}) as never,
      });
      if (error) throw error;
    },
  });
}
