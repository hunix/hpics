import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { invokeFunction } from '@/lib/api';

export function useContactRecordings(profileId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['contact-recordings', profileId],
    enabled: !!user,
    queryFn: async () => {
      let query = supabase
        .from('meeting_recordings')
        .select('*')
        .order('created_at', { ascending: false });
      if (profileId) query = query.eq('profile_id', profileId);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useDeleteRecording(profileId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('meeting_recordings')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-recordings', profileId] });
    },
  });
}

export interface RetryTranscriptionInput {
  id: string;
  file_url: string;
}

export function useRetryTranscription(profileId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (recording: RetryTranscriptionInput) => {
      await supabase
        .from('meeting_recordings')
        .update({ status: 'processing' })
        .eq('id', recording.id);
      const { error } = await invokeFunction('transcribe-audio', {
        recordingId: recording.id,
        fileUrl: recording.file_url,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-recordings', profileId] });
    },
  });
}
