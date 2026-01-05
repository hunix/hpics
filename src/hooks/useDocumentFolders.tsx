import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface DocumentFolder {
  profileId: string;
  firstName: string;
  lastName: string | null;
  totalFiles: number;
  typeCounts: Record<string, number>;
}

export function useDocumentFolders() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['document-folders', user?.id],
    queryFn: async () => {
      // Fetch documents with profile info
      const { data, error } = await supabase
        .from('documents')
        .select('profile_id, document_type, profiles!inner(first_name, last_name)')
        .not('profile_id', 'is', null);

      if (error) throw error;

      // Aggregate counts by profile
      const folderMap = new Map<string, DocumentFolder>();

      for (const item of data || []) {
        const profileId = item.profile_id!;
        const profile = item.profiles as { first_name: string; last_name: string | null };
        
        if (!folderMap.has(profileId)) {
          folderMap.set(profileId, {
            profileId,
            firstName: profile.first_name,
            lastName: profile.last_name,
            totalFiles: 0,
            typeCounts: {},
          });
        }

        const folder = folderMap.get(profileId)!;
        folder.totalFiles++;
        folder.typeCounts[item.document_type] = (folder.typeCounts[item.document_type] || 0) + 1;
      }

      return Array.from(folderMap.values()).sort((a, b) => b.totalFiles - a.totalFiles);
    },
    enabled: !!user,
  });
}
