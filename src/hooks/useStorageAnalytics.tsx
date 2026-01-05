import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface ContactStorageStats {
  profile_id: string;
  user_id: string;
  first_name: string;
  last_name: string | null;
  avatar_url: string | null;
  media_bytes: number;
  media_count: number;
  document_bytes: number;
  document_count: number;
  message_count: number;
  total_bytes: number;
}

export interface StorageSummary {
  total_bytes: number;
  total_media_bytes: number;
  total_document_bytes: number;
  total_media_files: number;
  total_document_files: number;
  total_messages: number;
  contact_count: number;
}

export interface SingleContactStorage {
  media_bytes: number;
  media_count: number;
  document_bytes: number;
  document_count: number;
  message_count: number;
  total_bytes: number;
  media_breakdown: {
    images: number;
    videos: number;
    audio: number;
    image_count: number;
    video_count: number;
    audio_count: number;
  };
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function useStorageSummary() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['storage-summary', user?.id],
    queryFn: async (): Promise<StorageSummary> => {
      if (!user?.id) throw new Error('No user');
      
      const { data, error } = await supabase
        .rpc('get_storage_summary', { p_user_id: user.id });
      
      if (error) throw error;
      
      // Handle empty result
      if (!data || data.length === 0) {
        return {
          total_bytes: 0,
          total_media_bytes: 0,
          total_document_bytes: 0,
          total_media_files: 0,
          total_document_files: 0,
          total_messages: 0,
          contact_count: 0,
        };
      }
      
      return data[0] as StorageSummary;
    },
    enabled: !!user?.id,
  });
}

export function useContactStorageStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['contact-storage-stats', user?.id],
    queryFn: async (): Promise<ContactStorageStats[]> => {
      if (!user?.id) throw new Error('No user');
      
      const { data, error } = await supabase
        .rpc('get_contact_storage_stats', { p_user_id: user.id });
      
      if (error) throw error;
      return (data || []) as ContactStorageStats[];
    },
    enabled: !!user?.id,
  });
}

export function useSingleContactStorage(profileId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['single-contact-storage', user?.id, profileId],
    queryFn: async (): Promise<SingleContactStorage | null> => {
      if (!user?.id || !profileId) return null;
      
      const { data, error } = await supabase
        .rpc('get_single_contact_storage', { 
          p_user_id: user.id, 
          p_profile_id: profileId 
        });
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        return {
          media_bytes: 0,
          media_count: 0,
          document_bytes: 0,
          document_count: 0,
          message_count: 0,
          total_bytes: 0,
          media_breakdown: {
            images: 0,
            videos: 0,
            audio: 0,
            image_count: 0,
            video_count: 0,
            audio_count: 0,
          },
        };
      }
      
      return data[0] as SingleContactStorage;
    },
    enabled: !!user?.id && !!profileId,
  });
}
