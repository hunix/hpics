import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface UserPreferences {
  user_id: string;
  email_reminders: boolean | null;
  reminder_email: string | null;
  theme: string | null;
}

export interface UserPreferencesUpdate {
  email_reminders: boolean;
  reminder_email: string | null;
  theme: string;
}

export function useUserPreferences() {
  const { user } = useAuth();
  return useQuery<UserPreferences | null>({
    queryKey: ['user-preferences', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return (data as UserPreferences | null) ?? null;
    },
  });
}

export function useSaveUserPreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      patch,
      existing,
    }: {
      patch: UserPreferencesUpdate;
      existing: boolean;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');
      const row = { user_id: user.id, ...patch };
      if (existing) {
        const { error } = await supabase
          .from('user_preferences')
          .update(row)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('user_preferences').insert(row);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-preferences'] });
    },
  });
}

export function useAppSetting(settingKey: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['app-settings', settingKey, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('user_id', user!.id)
        .eq('setting_key', settingKey)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useSaveAppSetting() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: unknown }) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          user_id: user.id,
          setting_key: key,
          setting_value: typeof value === 'string' ? value : JSON.stringify(value),
        });
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['app-settings', vars.key] });
    },
  });
}
