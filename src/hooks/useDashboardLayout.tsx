import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { DashletConfig, getDefaultLayout, applyPreset, LayoutPresetId } from '@/lib/dashletDefinitions';

interface DashboardLayoutData {
  layout: DashletConfig[];
  gridColumns: number;
}

export function useDashboardLayout() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-layout', user?.id],
    queryFn: async (): Promise<DashboardLayoutData> => {
      const { data: dbData, error } = await supabase
        .from('dashboard_layouts')
        .select('layout, grid_columns')
        .eq('user_id', user!.id)
        .maybeSingle();
      
      if (error) throw error;
      
      if (!dbData) {
        // Return default layout if none exists
        return {
          layout: getDefaultLayout(),
          gridColumns: 2,
        };
      }
      
      // Merge saved layout with defaults to pick up any new dashlets
      const savedLayout = (dbData.layout as unknown) as DashletConfig[];
      const defaults = getDefaultLayout();
      
      // Add any new dashlets that don't exist in saved layout
      const savedTypes = new Set(savedLayout.map(d => d.type));
      const newDashlets = defaults.filter(d => !savedTypes.has(d.type));
      
      const mergedLayout = [
        ...savedLayout,
        ...newDashlets.map((d, i) => ({ ...d, order: savedLayout.length + i })),
      ];
      
      return {
        layout: mergedLayout,
        gridColumns: dbData.grid_columns ?? 2,
      };
    },
    enabled: !!user,
  });

  const saveLayoutMutation = useMutation({
    mutationFn: async ({ layout, gridColumns }: { layout?: DashletConfig[]; gridColumns?: number }) => {
      const { data: existing } = await supabase
        .from('dashboard_layouts')
        .select('id')
        .eq('user_id', user!.id)
        .maybeSingle();

      const updateData: Record<string, unknown> = {};
      if (layout !== undefined) {
        updateData.layout = JSON.parse(JSON.stringify(layout));
      }
      if (gridColumns !== undefined) {
        updateData.grid_columns = gridColumns;
      }

      if (existing) {
        const { error } = await supabase
          .from('dashboard_layouts')
          .update(updateData)
          .eq('user_id', user!.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('dashboard_layouts')
          .insert([{ 
            user_id: user!.id, 
            layout: layout ? JSON.parse(JSON.stringify(layout)) : JSON.parse(JSON.stringify(getDefaultLayout())),
            grid_columns: gridColumns ?? 2,
          }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-layout'] });
    },
  });

  const updateLayout = (newLayout: DashletConfig[]) => {
    // Optimistically update
    queryClient.setQueryData(['dashboard-layout', user?.id], (old: DashboardLayoutData | undefined) => ({
      layout: newLayout,
      gridColumns: old?.gridColumns ?? 2,
    }));
    saveLayoutMutation.mutate({ layout: newLayout });
  };

  const setGridColumns = (columns: number) => {
    // Validate range
    const validColumns = Math.min(6, Math.max(1, columns));
    // Optimistically update
    queryClient.setQueryData(['dashboard-layout', user?.id], (old: DashboardLayoutData | undefined) => ({
      layout: old?.layout ?? getDefaultLayout(),
      gridColumns: validColumns,
    }));
    saveLayoutMutation.mutate({ gridColumns: validColumns });
  };

  const toggleDashletVisibility = (dashletId: string) => {
    if (!data?.layout) return;
    const newLayout = data.layout.map(d => 
      d.id === dashletId ? { ...d, visible: !d.visible } : d
    );
    updateLayout(newLayout);
  };

  const setDashletColSpan = (dashletId: string, colSpan: 1 | 2 | 3 | 4 | 5 | 6) => {
    if (!data?.layout) return;
    const newLayout = data.layout.map(d => 
      d.id === dashletId ? { ...d, colSpan } : d
    );
    updateLayout(newLayout);
  };

  const applyLayoutPreset = (presetId: LayoutPresetId) => {
    const { layout, gridColumns } = applyPreset(presetId);
    // Optimistically update
    queryClient.setQueryData(['dashboard-layout', user?.id], {
      layout,
      gridColumns,
    });
    saveLayoutMutation.mutate({ layout, gridColumns });
  };

  const reorderDashlets = (activeId: string, overId: string) => {
    if (!data?.layout) return;
    
    const oldIndex = data.layout.findIndex(d => d.id === activeId);
    const newIndex = data.layout.findIndex(d => d.id === overId);
    
    if (oldIndex === -1 || newIndex === -1) return;
    
    const newLayout = [...data.layout];
    const [movedItem] = newLayout.splice(oldIndex, 1);
    newLayout.splice(newIndex, 0, movedItem);
    
    // Update order values
    const updatedLayout = newLayout.map((d, i) => ({ ...d, order: i }));
    updateLayout(updatedLayout);
  };

  const resetToDefault = () => {
    updateLayout(getDefaultLayout());
    setGridColumns(2);
  };

  return {
    layout: data?.layout?.sort((a, b) => a.order - b.order),
    gridColumns: data?.gridColumns ?? 2,
    isLoading,
    updateLayout,
    setGridColumns,
    toggleDashletVisibility,
    setDashletColSpan,
    reorderDashlets,
    resetToDefault,
    applyLayoutPreset,
    isSaving: saveLayoutMutation.isPending,
  };
}
