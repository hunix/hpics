import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { DashletConfig, getDefaultLayout } from '@/lib/dashletDefinitions';

export function useDashboardLayout() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: layout, isLoading } = useQuery({
    queryKey: ['dashboard-layout', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dashboard_layouts')
        .select('layout')
        .eq('user_id', user!.id)
        .maybeSingle();
      
      if (error) throw error;
      
      if (!data) {
        // Return default layout if none exists
        return getDefaultLayout();
      }
      
      // Merge saved layout with defaults to pick up any new dashlets
      const savedLayout = (data.layout as unknown) as DashletConfig[];
      const defaults = getDefaultLayout();
      
      // Add any new dashlets that don't exist in saved layout
      const savedTypes = new Set(savedLayout.map(d => d.type));
      const newDashlets = defaults.filter(d => !savedTypes.has(d.type));
      
      return [
        ...savedLayout,
        ...newDashlets.map((d, i) => ({ ...d, order: savedLayout.length + i })),
      ];
    },
    enabled: !!user,
  });

  const saveLayoutMutation = useMutation({
    mutationFn: async (newLayout: DashletConfig[]) => {
      const { data: existing } = await supabase
        .from('dashboard_layouts')
        .select('id')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('dashboard_layouts')
          .update({ layout: JSON.parse(JSON.stringify(newLayout)) })
          .eq('user_id', user!.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('dashboard_layouts')
          .insert([{ user_id: user!.id, layout: JSON.parse(JSON.stringify(newLayout)) }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-layout'] });
    },
  });

  const updateLayout = (newLayout: DashletConfig[]) => {
    // Optimistically update
    queryClient.setQueryData(['dashboard-layout', user?.id], newLayout);
    saveLayoutMutation.mutate(newLayout);
  };

  const toggleDashletVisibility = (dashletId: string) => {
    if (!layout) return;
    const newLayout = layout.map(d => 
      d.id === dashletId ? { ...d, visible: !d.visible } : d
    );
    updateLayout(newLayout);
  };

  const reorderDashlets = (activeId: string, overId: string) => {
    if (!layout) return;
    
    const oldIndex = layout.findIndex(d => d.id === activeId);
    const newIndex = layout.findIndex(d => d.id === overId);
    
    if (oldIndex === -1 || newIndex === -1) return;
    
    const newLayout = [...layout];
    const [movedItem] = newLayout.splice(oldIndex, 1);
    newLayout.splice(newIndex, 0, movedItem);
    
    // Update order values
    const updatedLayout = newLayout.map((d, i) => ({ ...d, order: i }));
    updateLayout(updatedLayout);
  };

  const resetToDefault = () => {
    updateLayout(getDefaultLayout());
  };

  return {
    layout: layout?.sort((a, b) => a.order - b.order),
    isLoading,
    updateLayout,
    toggleDashletVisibility,
    reorderDashlets,
    resetToDefault,
    isSaving: saveLayoutMutation.isPending,
  };
}
