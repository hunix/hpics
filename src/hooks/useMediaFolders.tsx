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
      // Use server-side aggregation to avoid 1000-row limit
      const { data, error } = await supabase.rpc('get_media_folders', {
        p_user_id: user!.id
      });

      if (error) throw error;

      return (data || []).map((f: {
        profile_id: string;
        first_name: string;
        last_name: string | null;
        total_files: number;
        image_count: number;
        audio_count: number;
        video_count: number;
      }) => ({
        profileId: f.profile_id,
        firstName: f.first_name,
        lastName: f.last_name,
        totalFiles: Number(f.total_files),
        imageCount: Number(f.image_count),
        audioCount: Number(f.audio_count),
        videoCount: Number(f.video_count),
      }));
    },
    enabled: !!user,
  });
}
