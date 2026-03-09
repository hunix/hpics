import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useCosmicOmnipotence(profileId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: awareness, isLoading: awarenessLoading } = useQuery({
    queryKey: ['cosmic-awareness', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cosmic_awareness')
        .select('id, awareness_type, insight_depth, user_id, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: control, isLoading: controlLoading } = useQuery({
    queryKey: ['omnipotent-control'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('omnipotent_control')
        .select('id, control_domain, power_magnitude, user_id, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const expandAwareness = useMutation({
    mutationFn: async (input: { awareness_scope: string; cosmic_perception_level?: number }) => {
      const { data, error } = await supabase
        .from('cosmic_awareness')
        .insert({
          user_id: user!.id,
          awareness_type: input.awareness_scope,
          insight_depth: input.cosmic_perception_level || 1,
        })
        .select('id, awareness_type, insight_depth, user_id, created_at')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cosmic-awareness'] }),
  });

  const establishControl = useMutation({
    mutationFn: async (input: { control_domain: string; power_magnitude?: number }) => {
      const { data, error } = await supabase
        .from('omnipotent_control')
        .insert({ user_id: user!.id, control_domain: input.control_domain, power_magnitude: input.power_magnitude || 0 })
        .select('id, control_domain, power_magnitude, user_id, created_at')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['omnipotent-control'] }),
  });

  return { awareness, control, isLoading: awarenessLoading || controlLoading, expandAwareness, establishControl };
}
