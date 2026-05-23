import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Profile } from '@/types/database-helpers';

export function useContactById(id: string | undefined) {
  return useQuery<Profile>({
    queryKey: ['contact', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data as Profile;
    },
  });
}

export function useContactMethods(id: string | undefined) {
  return useQuery({
    queryKey: ['contact-methods', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_methods')
        .select('*')
        .eq('profile_id', id!);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useDeleteContact(id: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!id) throw new Error('Missing contact id');
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

export function useToggleContactFavorite(id: string | undefined, currentIsFavorite: boolean | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!id) throw new Error('Missing contact id');
      const { error } = await supabase
        .from('profiles')
        .update({ is_favorite: !currentIsFavorite })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact', id] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['family-relationships'] });
    },
  });
}

export function useToggleSelfProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return async (id: string, currentIsSelf: boolean | null | undefined) => {
    if (!user?.id) throw new Error('Not authenticated');
    if (!currentIsSelf) {
      // Clear any existing self profile flags before setting this one
      await supabase
        .from('profiles')
        .update({ is_self_profile: false })
        .eq('user_id', user.id)
        .eq('is_self_profile', true);
    }
    await supabase
      .from('profiles')
      .update({ is_self_profile: !currentIsSelf })
      .eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['contact', id] });
    queryClient.invalidateQueries({ queryKey: ['contacts'] });
    queryClient.invalidateQueries({ queryKey: ['family-relationships'] });
  };
}
