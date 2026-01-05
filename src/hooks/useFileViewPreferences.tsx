import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type ViewMode = 'grid' | 'list' | 'detail';
export type MainViewMode = 'folders' | 'grid' | 'list' | 'detail';

interface FileViewPreferences {
  media_view_mode: ViewMode;
  media_items_per_page: number;
  documents_view_mode: ViewMode;
  documents_items_per_page: number;
  main_media_view_mode: MainViewMode;
  main_media_items_per_page: number;
  main_documents_view_mode: MainViewMode;
  main_documents_items_per_page: number;
}

const DEFAULT_PREFERENCES: FileViewPreferences = {
  media_view_mode: 'grid',
  media_items_per_page: 12,
  documents_view_mode: 'list',
  documents_items_per_page: 10,
  main_media_view_mode: 'folders',
  main_media_items_per_page: 24,
  main_documents_view_mode: 'folders',
  main_documents_items_per_page: 20,
};

export function useFileViewPreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: preferences, isLoading } = useQuery({
    queryKey: ['file-view-preferences', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('media_view_mode, media_items_per_page, documents_view_mode, documents_items_per_page, main_media_view_mode, main_media_items_per_page, main_documents_view_mode, main_documents_items_per_page')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error) throw error;
      return data as FileViewPreferences | null;
    },
    enabled: !!user,
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<FileViewPreferences>) => {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user!.id,
          ...updates,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) throw error;
    },
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: ['file-view-preferences', user?.id] });
      const previous = queryClient.getQueryData(['file-view-preferences', user?.id]);
      queryClient.setQueryData(['file-view-preferences', user?.id], (old: FileViewPreferences | null) => ({
        ...DEFAULT_PREFERENCES,
        ...old,
        ...updates,
      }));
      return { previous };
    },
    onError: (_err, _updates, context) => {
      queryClient.setQueryData(['file-view-preferences', user?.id], context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['file-view-preferences', user?.id] });
    },
  });

  const currentPreferences = { ...DEFAULT_PREFERENCES, ...preferences };

  return {
    preferences: currentPreferences,
    isLoading,
    updateMediaViewMode: (mode: ViewMode) => updateMutation.mutate({ media_view_mode: mode }),
    updateMediaItemsPerPage: (count: number) => updateMutation.mutate({ media_items_per_page: count }),
    updateDocumentsViewMode: (mode: ViewMode) => updateMutation.mutate({ documents_view_mode: mode }),
    updateDocumentsItemsPerPage: (count: number) => updateMutation.mutate({ documents_items_per_page: count }),
    updateMainMediaViewMode: (mode: MainViewMode) => updateMutation.mutate({ main_media_view_mode: mode }),
    updateMainMediaItemsPerPage: (count: number) => updateMutation.mutate({ main_media_items_per_page: count }),
    updateMainDocumentsViewMode: (mode: MainViewMode) => updateMutation.mutate({ main_documents_view_mode: mode }),
    updateMainDocumentsItemsPerPage: (count: number) => updateMutation.mutate({ main_documents_items_per_page: count }),
  };
}
