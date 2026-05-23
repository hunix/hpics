import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ContactForAnalysis {
  id: string;
  first_name: string;
  last_name: string | null;
  organization: string | null;
  job_title: string | null;
}

export interface MediaFileRow {
  id: string;
  file_url: string;
  caption: string | null;
  mime_type: string | null;
  created_at: string;
}

export function useContactsForAnalysis() {
  const { user } = useAuth();
  return useQuery<ContactForAnalysis[]>({
    queryKey: ['contacts-for-analysis', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, organization, job_title')
        .order('first_name');
      if (error) throw error;
      return (data ?? []) as ContactForAnalysis[];
    },
  });
}

export function useContactVideos(selectedContact: string | null) {
  return useQuery<MediaFileRow[]>({
    queryKey: ['contact-videos', selectedContact],
    enabled: !!selectedContact,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('media')
        .select('id, file_url, caption, mime_type, created_at')
        .eq('profile_id', selectedContact!)
        .or('mime_type.ilike.video/%,mime_type.ilike.audio/%')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as MediaFileRow[];
    },
  });
}

export function useRecentAnalysisFanout() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['recent-analyses', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [behavioral, facial, bodyLanguage, vocal] = await Promise.all([
        supabase.from('behavioral_analyses').select('*, profiles(first_name, last_name)').order('created_at', { ascending: false }).limit(5),
        supabase.from('facial_analyses').select('*, profiles(first_name, last_name)').order('created_at', { ascending: false }).limit(5),
        supabase.from('body_language_analyses').select('*, profiles(first_name, last_name)').order('created_at', { ascending: false }).limit(5),
        supabase.from('vocal_analyses').select('*, profiles(first_name, last_name)').order('created_at', { ascending: false }).limit(5),
      ]);
      return {
        behavioral: behavioral.data ?? [],
        facial: facial.data ?? [],
        bodyLanguage: bodyLanguage.data ?? [],
        vocal: vocal.data ?? [],
      };
    },
  });
}
