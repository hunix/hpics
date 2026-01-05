import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface MediaFolder {
  profileId: string;
  firstName: string;
  lastName: string | null;
  totalFiles: number;
  imageCount: number;
  audioCount: number;
  videoCount: number;
}

export function useMediaFolders() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['media-folders', user?.id],
    queryFn: async () => {
      // Fetch media with profile info, grouped by profile
      const { data, error } = await supabase
        .from('media')
        .select('profile_id, mime_type, profiles!inner(first_name, last_name)')
        .not('profile_id', 'is', null);

      if (error) throw error;

      // Aggregate counts by profile
      const folderMap = new Map<string, MediaFolder>();

      for (const item of data || []) {
        const profileId = item.profile_id!;
        const profile = item.profiles as { first_name: string; last_name: string | null };
        
        if (!folderMap.has(profileId)) {
          folderMap.set(profileId, {
            profileId,
            firstName: profile.first_name,
            lastName: profile.last_name,
            totalFiles: 0,
            imageCount: 0,
            audioCount: 0,
            videoCount: 0,
          });
        }

        const folder = folderMap.get(profileId)!;
        folder.totalFiles++;

        const mimeType = item.mime_type || '';
        if (mimeType.startsWith('image/')) folder.imageCount++;
        else if (mimeType.startsWith('audio/')) folder.audioCount++;
        else if (mimeType.startsWith('video/')) folder.videoCount++;
      }

      // Sort by total files descending
      return Array.from(folderMap.values()).sort((a, b) => b.totalFiles - a.totalFiles);
    },
    enabled: !!user,
  });
}
