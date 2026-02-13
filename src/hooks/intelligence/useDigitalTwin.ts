/**
 * Digital Twin Hook (v9.0)
 * 
 * React hooks for HDTwin cognitive simulation and persona generation.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { invokeFunction } from '@/lib/api';

export interface DigitalTwinRecord {
  id: string;
  profileId: string;
  twinType: string;
  personaData: Record<string, unknown>;
  simulationState: Record<string, unknown>;
  accuracyScore: number;
  lastSynced: string;
  createdAt: string;
}

export function useDigitalTwin(profileId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: twins, isLoading: twinsLoading } = useQuery({
    queryKey: ['digital-twins', profileId],
    queryFn: async () => {
      let query = supabase
        .from('digital_twins')
        .select('*')
        .order('created_at', { ascending: false });

      if (profileId) {
        query = query.eq('profile_id', profileId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []).map((row: Record<string, unknown>) => ({
        id: row.id as string,
        profileId: row.profile_id as string,
        twinType: (row.twin_type || 'cognitive') as string,
        personaData: (row.persona_data || {}) as Record<string, unknown>,
        simulationState: (row.simulation_state || {}) as Record<string, unknown>,
        accuracyScore: (row.accuracy_score || 0) as number,
        lastSynced: row.last_synced as string,
        createdAt: row.created_at as string
      })) as DigitalTwinRecord[];
    },
    enabled: !!user,
  });

  const createTwin = useMutation({
    mutationFn: async (input: {
      profileId: string;
      twinType: 'cognitive' | 'behavioral' | 'social' | 'full';
    }) => {
      // Call edge function for twin generation via adapter
      const { data, error } = await invokeFunction('digital-twin-generator', {
        userId: user!.id,
        profileId: input.profileId,
        twinType: input.twinType,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['digital-twins'] });
    }
  });

  const simulateScenario = useMutation({
    mutationFn: async (input: {
      twinId: string;
      scenario: string;
      conditions?: Record<string, unknown>;
    }) => {
      const { data, error } = await invokeFunction('digital-twin-simulator', {
        userId: user!.id,
        twinId: input.twinId,
        scenario: input.scenario,
        conditions: input.conditions || {},
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['digital-twins'] });
    }
  });

  const syncTwin = useMutation({
    mutationFn: async (twinId: string) => {
      const { data, error } = await supabase
        .from('digital_twins')
        .update({ last_synced: new Date().toISOString() } as never)
        .eq('id', twinId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['digital-twins'] });
    }
  });

  const activeTwin = twins?.find(t => t.profileId === profileId);
  const highAccuracyTwins = twins?.filter(t => t.accuracyScore >= 0.8) || [];

  return {
    twins,
    activeTwin,
    highAccuracyTwins,
    isLoading: twinsLoading,
    createTwin: createTwin.mutateAsync,
    simulateScenario: simulateScenario.mutateAsync,
    syncTwin: syncTwin.mutateAsync,
    isCreating: createTwin.isPending,
    isSimulating: simulateScenario.isPending
  };
}
