/**
 * React hooks for platform configuration
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type { ConfigCategory, PlatformConfigItem } from '@/lib/platformConfig';

interface UseConfigValueOptions {
  profileId?: string;
  enabled?: boolean;
}

/**
 * Get a single config value with proper hierarchy
 */
export function useConfigValue<T = unknown>(
  configKey: string,
  options: UseConfigValueOptions = {}
) {
  const { user } = useAuth();
  const { profileId, enabled = true } = options;

  return useQuery({
    queryKey: ['config-value', configKey, user?.id, profileId],
    queryFn: async () => {
      // Check contact override first
      if (user?.id && profileId) {
        const { data: contactOverride } = await supabase
          .from('contact_config_overrides')
          .select('config_value')
          .eq('user_id', user.id)
          .eq('profile_id', profileId)
          .eq('config_key', configKey)
          .maybeSingle();
        
        if (contactOverride) return contactOverride.config_value as T;
      }

      // Check user override
      if (user?.id) {
        const { data: userOverride } = await supabase
          .from('user_config_overrides')
          .select('config_value')
          .eq('user_id', user.id)
          .eq('config_key', configKey)
          .maybeSingle();
        
        if (userOverride) return userOverride.config_value as T;
      }

      // Fall back to platform default
      const { data: platformConfig } = await supabase
        .from('platform_config')
        .select('config_value')
        .eq('config_key', configKey)
        .maybeSingle();
      
      return (platformConfig?.config_value ?? null) as T;
    },
    enabled: enabled && !!configKey,
    staleTime: 60000, // Cache for 1 minute
  });
}

/**
 * Get all platform configs by category
 */
export function usePlatformConfigsByCategory(category?: ConfigCategory) {
  return useQuery({
    queryKey: ['platform-configs', category],
    queryFn: async () => {
      let query = supabase
        .from('platform_config')
        .select('*')
        .order('category')
        .order('subcategory')
        .order('display_name');
      
      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PlatformConfigItem[];
    },
    staleTime: 60000,
  });
}

/**
 * Get user's config overrides
 */
export function useUserConfigOverrides() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-config-overrides', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_config_overrides')
        .select('config_key, config_value')
        .eq('user_id', user!.id);
      
      if (error) throw error;
      return new Map(data.map(d => [d.config_key, d.config_value]));
    },
    enabled: !!user,
  });
}

/**
 * Get contact's config overrides
 */
export function useContactConfigOverrides(profileId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['contact-config-overrides', user?.id, profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_config_overrides')
        .select('config_key, config_value')
        .eq('user_id', user!.id)
        .eq('profile_id', profileId);
      
      if (error) throw error;
      return new Map(data.map(d => [d.config_key, d.config_value]));
    },
    enabled: !!user && !!profileId,
  });
}

/**
 * Mutation to save user config override
 */
export function useSaveUserConfig() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ configKey, configValue }: { configKey: string; configValue: unknown }) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_config_overrides')
        .upsert({
          user_id: user.id,
          config_key: configKey,
          config_value: configValue as any,
        });
      
      if (error) throw error;
    },
    onSuccess: (_, { configKey }) => {
      queryClient.invalidateQueries({ queryKey: ['config-value', configKey] });
      queryClient.invalidateQueries({ queryKey: ['user-config-overrides'] });
      toast.success('Configuration saved');
    },
    onError: (error) => {
      toast.error('Failed to save configuration', { description: error.message });
    },
  });
}

/**
 * Mutation to save contact config override
 */
export function useSaveContactConfig(profileId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ configKey, configValue }: { configKey: string; configValue: unknown }) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('contact_config_overrides')
        .upsert({
          user_id: user.id,
          profile_id: profileId,
          config_key: configKey,
          config_value: configValue as any,
        });
      
      if (error) throw error;
    },
    onSuccess: (_, { configKey }) => {
      queryClient.invalidateQueries({ queryKey: ['config-value', configKey] });
      queryClient.invalidateQueries({ queryKey: ['contact-config-overrides', user?.id, profileId] });
      toast.success('Contact configuration saved');
    },
    onError: (error) => {
      toast.error('Failed to save configuration', { description: error.message });
    },
  });
}

/**
 * Mutation to reset user config to platform default
 */
export function useResetUserConfig() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (configKey: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_config_overrides')
        .delete()
        .eq('user_id', user.id)
        .eq('config_key', configKey);
      
      if (error) throw error;
    },
    onSuccess: (_, configKey) => {
      queryClient.invalidateQueries({ queryKey: ['config-value', configKey] });
      queryClient.invalidateQueries({ queryKey: ['user-config-overrides'] });
      toast.success('Reset to platform default');
    },
    onError: (error) => {
      toast.error('Failed to reset configuration', { description: error.message });
    },
  });
}

/**
 * Mutation to reset contact config to user/platform default
 */
export function useResetContactConfig(profileId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (configKey: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('contact_config_overrides')
        .delete()
        .eq('user_id', user.id)
        .eq('profile_id', profileId)
        .eq('config_key', configKey);
      
      if (error) throw error;
    },
    onSuccess: (_, configKey) => {
      queryClient.invalidateQueries({ queryKey: ['config-value', configKey] });
      queryClient.invalidateQueries({ queryKey: ['contact-config-overrides', user?.id, profileId] });
      toast.success('Reset to default');
    },
    onError: (error) => {
      toast.error('Failed to reset configuration', { description: error.message });
    },
  });
}
