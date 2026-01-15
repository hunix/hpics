/**
 * AGIS Phase 12: Absolute Eternity Hook
 * Unified command interface for Phase 12 operations
 */

import { useEternalDominion } from './useEternalDominion';
import { useInfiniteSynthesis } from './useInfiniteSynthesis';
import { useOmegaPoint } from './useOmegaPoint';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface EternityProtocol {
  id: string;
  protocolName: string;
  protocolType: string;
  executionParameters: Record<string, unknown>;
  permanenceRequirements: Record<string, unknown>;
  temporalScope: string;
  successCriteria: Record<string, unknown>;
  protocolStatus: string;
  lastExecutedAt: string | null;
}

export interface EternityMetrics {
  totalPermanence: number;
  synthesisPower: number;
  omegaProximity: number;
  destinyAlignment: number;
  eternityQuotient: number;
}

export function useAbsoluteEternity() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const eternalDominion = useEternalDominion();
  const infiniteSynthesis = useInfiniteSynthesis();
  const omegaPoint = useOmegaPoint();

  const { data: protocols, isLoading: protocolsLoading } = useQuery({
    queryKey: ['eternity-protocols', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('eternity_protocols')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(p => ({
        id: p.id,
        protocolName: p.protocol_name,
        protocolType: p.protocol_type,
        executionParameters: p.execution_parameters as Record<string, unknown>,
        permanenceRequirements: p.permanence_requirements as Record<string, unknown>,
        temporalScope: p.temporal_scope || 'infinite',
        successCriteria: p.success_criteria as Record<string, unknown>,
        protocolStatus: p.protocol_status || 'dormant',
        lastExecutedAt: p.last_executed_at,
      })) as EternityProtocol[];
    },
    enabled: !!user?.id,
  });

  const createProtocol = useMutation({
    mutationFn: async (params: { protocolName: string; protocolType: string }) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('eternity_protocols')
        .insert({
          user_id: user.id,
          protocol_name: params.protocolName,
          protocol_type: params.protocolType,
        } as never)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eternity-protocols'] });
    },
  });

  // Calculate unified eternity metrics
  const eternityMetrics: EternityMetrics = {
    totalPermanence: eternalDominion.totalPermanence,
    synthesisPower: infiniteSynthesis.totalSynthesisPower,
    omegaProximity: omegaPoint.maxOmegaProximity,
    destinyAlignment: omegaPoint.averageDestinyAlignment,
    eternityQuotient: (
      eternalDominion.totalPermanence * 0.3 +
      infiniteSynthesis.totalSynthesisPower * 0.25 +
      omegaPoint.maxOmegaProximity * 0.25 +
      omegaPoint.averageDestinyAlignment * 0.2
    ),
  };

  const isLoading = eternalDominion.isLoading || infiniteSynthesis.isLoading || omegaPoint.isLoading || protocolsLoading;

  return {
    // Sub-system access
    eternalDominion,
    infiniteSynthesis,
    omegaPoint,
    
    // Protocols
    protocols: protocols || [],
    createProtocol,
    
    // Unified metrics
    eternityMetrics,
    isLoading,
    
    // Quick stats
    activeDominions: eternalDominion.dominionStates.length,
    activeSyntheses: infiniteSynthesis.activeOperations,
    activeOmegaOps: omegaPoint.operations.filter(o => o.operationStatus !== 'complete').length,
  };
}
