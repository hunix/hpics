import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface DocumentFolder {
  profileId: string;
  firstName: string;
  lastName: string | null;
  totalFiles: number;
  totalBytes: number;
}

export function useDocumentFolders() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['document-folders', user?.id],
    queryFn: async () => {
      // Use server-side aggregation to avoid 1000-row limit
      const { data, error } = await supabase.rpc('get_document_folders', {
        p_user_id: user!.id
      });

      if (error) throw error;

      return (data || []).map((f: {
        profile_id: string;
        first_name: string;
        last_name: string | null;
        total_files: number;
        total_bytes: number;
      }) => ({
        profileId: f.profile_id,
        firstName: f.first_name,
        lastName: f.last_name,
        totalFiles: Number(f.total_files),
        totalBytes: Number(f.total_bytes),
      }));
    },
    enabled: !!user,
  });
}
