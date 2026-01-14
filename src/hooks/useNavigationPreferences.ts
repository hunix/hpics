import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'react-router-dom';

export interface NavigationPreferences {
  collapsed_groups: string[];
  pinned_items: string[];
  hidden_items: string[];
  group_order: string[];
  color_overrides: Record<string, string>;
  layout_mode: 'compact' | 'comfortable' | 'spacious';
  show_badges: boolean;
  show_descriptions: boolean;
}

export interface QuickAccessItem {
  route: string;
  access_count: number;
  last_accessed: string;
}

const defaultPreferences: NavigationPreferences = {
  collapsed_groups: ['analysis', 'security', 'system'], // Collapse less-used groups by default
  pinned_items: [],
  hidden_items: [],
  group_order: ['command', 'intelligence', 'relationships', 'assets', 'analysis', 'security', 'system'],
  color_overrides: {},
  layout_mode: 'compact', // Use compact mode by default for cleaner UI
  show_badges: true,
  show_descriptions: false, // Hide descriptions by default for cleaner nav
};

export function useNavigationPreferences() {
  const { user } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();
  
  // Fetch preferences
  const { data: preferences, isLoading } = useQuery({
    queryKey: ['navigation-preferences', user?.id],
    queryFn: async () => {
      if (!user?.id) return defaultPreferences;
      
      const { data, error } = await supabase
        .from('navigation_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching nav preferences:', error);
        return defaultPreferences;
      }
      
      if (!data) return defaultPreferences;
      
      return {
        collapsed_groups: data.collapsed_groups || [],
        pinned_items: data.pinned_items || [],
        hidden_items: data.hidden_items || [],
        group_order: (data.group_order as string[]) || defaultPreferences.group_order,
        color_overrides: (data.color_overrides as Record<string, string>) || {},
        layout_mode: data.layout_mode as NavigationPreferences['layout_mode'] || 'comfortable',
        show_badges: data.show_badges ?? true,
        show_descriptions: data.show_descriptions ?? true,
      };
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Fetch quick access items
  const { data: quickAccess } = useQuery({
    queryKey: ['navigation-quick-access', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('navigation_quick_access')
        .select('*')
        .eq('user_id', user.id)
        .order('access_count', { ascending: false })
        .limit(10);
      
      if (error) {
        console.error('Error fetching quick access:', error);
        return [];
      }
      
      return data as QuickAccessItem[];
    },
    enabled: !!user?.id,
  });
  
  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (updates: Partial<NavigationPreferences>) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('navigation_preferences')
        .upsert({
          user_id: user.id,
          ...updates,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['navigation-preferences'] });
    },
  });
  
  // Track navigation access
  const trackAccess = useCallback(async (route: string) => {
    if (!user?.id) return;
    
    try {
      await supabase.rpc('track_navigation_access', { p_route: route });
      queryClient.invalidateQueries({ queryKey: ['navigation-quick-access'] });
    } catch (error) {
      console.error('Error tracking navigation:', error);
    }
  }, [user?.id, queryClient]);
  
  // Track route changes
  useEffect(() => {
    if (location.pathname && user?.id) {
      trackAccess(location.pathname);
    }
  }, [location.pathname, user?.id, trackAccess]);
  
  // Helper functions
  const toggleGroupCollapse = useCallback((groupId: string) => {
    const current = preferences?.collapsed_groups || [];
    const updated = current.includes(groupId)
      ? current.filter(g => g !== groupId)
      : [...current, groupId];
    
    updatePreferencesMutation.mutate({ collapsed_groups: updated });
  }, [preferences, updatePreferencesMutation]);
  
  const togglePinItem = useCallback((itemId: string) => {
    const current = preferences?.pinned_items || [];
    const updated = current.includes(itemId)
      ? current.filter(i => i !== itemId)
      : [...current, itemId];
    
    updatePreferencesMutation.mutate({ pinned_items: updated });
  }, [preferences, updatePreferencesMutation]);
  
  const toggleHideItem = useCallback((itemId: string) => {
    const current = preferences?.hidden_items || [];
    const updated = current.includes(itemId)
      ? current.filter(i => i !== itemId)
      : [...current, itemId];
    
    updatePreferencesMutation.mutate({ hidden_items: updated });
  }, [preferences, updatePreferencesMutation]);
  
  const setLayoutMode = useCallback((mode: NavigationPreferences['layout_mode']) => {
    updatePreferencesMutation.mutate({ layout_mode: mode });
  }, [updatePreferencesMutation]);
  
  const setShowBadges = useCallback((show: boolean) => {
    updatePreferencesMutation.mutate({ show_badges: show });
  }, [updatePreferencesMutation]);
  
  const setShowDescriptions = useCallback((show: boolean) => {
    updatePreferencesMutation.mutate({ show_descriptions: show });
  }, [updatePreferencesMutation]);
  
  const updateGroupOrder = useCallback((order: string[]) => {
    updatePreferencesMutation.mutate({ group_order: order });
  }, [updatePreferencesMutation]);
  
  const isGroupCollapsed = useCallback((groupId: string) => {
    return preferences?.collapsed_groups?.includes(groupId) || false;
  }, [preferences]);
  
  const isPinned = useCallback((itemId: string) => {
    return preferences?.pinned_items?.includes(itemId) || false;
  }, [preferences]);
  
  const isHidden = useCallback((itemId: string) => {
    return preferences?.hidden_items?.includes(itemId) || false;
  }, [preferences]);
  
  return {
    preferences: preferences || defaultPreferences,
    quickAccess: quickAccess || [],
    isLoading,
    toggleGroupCollapse,
    togglePinItem,
    toggleHideItem,
    setLayoutMode,
    setShowBadges,
    setShowDescriptions,
    updateGroupOrder,
    isGroupCollapsed,
    isPinned,
    isHidden,
    trackAccess,
  };
}
