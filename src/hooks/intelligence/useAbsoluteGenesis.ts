/**
 * Absolute Genesis Hook (Phase 22)
 * 
 * Provides access to Phase 22 genesis operations including
 * reality creation, causal origination, and genesis synthesis.
 * All configuration is database-driven via platform_config.
 * 
 * @version 3.9.0
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useConfigValue } from '@/hooks/usePlatformConfig';
import { useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { invokeFunction } from '@/lib/api';

export type GenesisOperationType = 
  | 'reality_creation'
  | 'causal_origination' 
  | 'genesis_synthesis'
  | 'primordial_creation'
  | 'existence_origination'
  | 'universal_creation';

export type GenesisStatus = 'draft' | 'pending' | 'manifesting' | 'completed' | 'failed' | 'cancelled';

export interface GenesisOperation {
  id: string;
  user_id: string;
  profile_id: string | null;
  operation_type: GenesisOperationType;
  operation_name: string;
  description: string | null;
  blueprint: Record<string, unknown>;
  parameters: Record<string, unknown>;
  constraints: unknown[];
  status: GenesisStatus;
  manifestation_progress: number;
  manifestation_log: Array<{
    timestamp: string;
    message: string;
    phase: string;
  }>;
  outcome: Record<string, unknown> | null;
  side_effects: unknown[];
  cascading_effects: unknown[];
  initiated_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface GenesisConfig {
  realityCreationEnabled: boolean;
  causalMaxDepth: number;
  synthesisIntensity: number;
}

const GENESIS_QUERY_KEY = ['genesis-operations'];

export function useAbsoluteGenesis(profileId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Load genesis configuration from platform_config
  const { data: realityEnabled } = useConfigValue<string>('genesis.reality_creation.enabled');
  const { data: causalDepth } = useConfigValue<string>('genesis.causal_origination.max_depth');
  const { data: synthesisIntensity } = useConfigValue<string>('genesis.synthesis.intensity_default');

  const genesisConfig = useMemo<GenesisConfig>(() => ({
    realityCreationEnabled: realityEnabled === 'true',
    causalMaxDepth: parseInt(causalDepth || '10'),
    synthesisIntensity: parseFloat(synthesisIntensity || '0.7')
  }), [realityEnabled, causalDepth, synthesisIntensity]);

  // Load all genesis operations
  const {
    data: operations,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: [...GENESIS_QUERY_KEY, profileId],
    queryFn: async () => {
      let query = (supabase
        .from('genesis_operations' as any)
        .select('*')
        .eq('user_id', user?.id ?? '')
        .order('created_at', { ascending: false })) as any;

      if (profileId) {
        query = query.eq('profile_id', profileId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as GenesisOperation[];
    },
    staleTime: 60 * 1000,
    enabled: !!user
  });

  // Group by operation type
  const byType = useMemo(() => {
    const grouped: Record<GenesisOperationType, GenesisOperation[]> = {
      reality_creation: [],
      causal_origination: [],
      genesis_synthesis: [],
      primordial_creation: [],
      existence_origination: [],
      universal_creation: []
    };

    for (const op of operations || []) {
      if (grouped[op.operation_type]) {
        grouped[op.operation_type].push(op);
      }
    }

    return grouped;
  }, [operations]);

  // Group by status
  const byStatus = useMemo(() => {
    const grouped: Record<GenesisStatus, GenesisOperation[]> = {
      draft: [],
      pending: [],
      manifesting: [],
      completed: [],
      failed: [],
      cancelled: []
    };

    for (const op of operations || []) {
      if (grouped[op.status]) {
        grouped[op.status].push(op);
      }
    }

    return grouped;
  }, [operations]);

  // Get active operations (manifesting)
  const activeOperations = useMemo(() => {
    return operations?.filter(op => op.status === 'manifesting') || [];
  }, [operations]);

  // Calculate overall manifestation progress
  const overallProgress = useMemo(() => {
    const completed = operations?.filter(op => op.status === 'completed').length || 0;
    const total = operations?.length || 0;
    return total > 0 ? (completed / total) * 100 : 0;
  }, [operations]);

  // Create new genesis operation
  const createOperation = useMutation({
    mutationFn: async (operation: {
      operation_type: GenesisOperationType;
      operation_name: string;
      description?: string;
      blueprint: Record<string, unknown>;
      parameters?: Record<string, unknown>;
      constraints?: unknown[];
      profile_id?: string;
    }) => {
      if (operation.operation_type === 'reality_creation' && !genesisConfig.realityCreationEnabled) {
        throw new Error('Reality creation is currently disabled');
      }

      const { data, error } = await (supabase
        .from('genesis_operations' as any)
        .insert({
          ...operation,
          user_id: user?.id,
          status: 'draft',
          manifestation_progress: 0,
          manifestation_log: [],
          side_effects: [],
          cascading_effects: []
        })
        .select()
        .single()) as any;

      if (error) throw error;
      return data as unknown as GenesisOperation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GENESIS_QUERY_KEY });
      toast.success('Genesis operation created');
    },
    onError: (error: Error) => {
      toast.error('Failed to create operation', { description: error.message });
    }
  });

  // Initiate manifestation
  const initiateManifestion = useMutation({
    mutationFn: async (operationId: string) => {
      const { data, error } = await invokeFunction('genesis-engine', {
          operation: 'initiate',
          operationId,
          userId: user?.id
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GENESIS_QUERY_KEY });
      toast.success('Manifestation initiated');
    },
    onError: (error: Error) => {
      toast.error('Manifestation failed', { description: error.message });
    }
  });

  // Update operation
  const updateOperation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<GenesisOperation> }) => {
      const { data, error } = await (supabase
        .from('genesis_operations' as any)
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user?.id ?? '')
        .select()
        .single()) as any;

      if (error) throw error;
      return data as unknown as GenesisOperation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GENESIS_QUERY_KEY });
    }
  });

  // Cancel operation
  const cancelOperation = useMutation({
    mutationFn: async (operationId: string) => {
      const { error } = await (supabase
        .from('genesis_operations' as any)
        .update({
          status: 'cancelled',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', operationId)
        .eq('user_id', user?.id ?? '')) as any;

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GENESIS_QUERY_KEY });
      toast.success('Operation cancelled');
    }
  });

  // Delete operation (only drafts)
  const deleteOperation = useMutation({
    mutationFn: async (operationId: string) => {
      const op = operations?.find(o => o.id === operationId);
      if (op && op.status !== 'draft') {
        throw new Error('Can only delete draft operations');
      }

      const { error } = await (supabase
        .from('genesis_operations' as any)
        .delete()
        .eq('id', operationId)
        .eq('user_id', user?.id ?? '')) as any;

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GENESIS_QUERY_KEY });
      toast.success('Operation deleted');
    }
  });

  // Invoke genesis engine for specific operations
  const invokeGenesisEngine = useCallback(async (
    operationType: GenesisOperationType,
    params: Record<string, unknown>
  ) => {
    const { data, error } = await invokeFunction('genesis-engine', {
        operation: operationType,
        params,
        userId: user?.id,
        config: genesisConfig
      });

    if (error) throw error;
    return data;
  }, [user?.id, genesisConfig]);

  // Get operation by ID
  const getOperation = useCallback((id: string): GenesisOperation | undefined => {
    return operations?.find(op => op.id === id);
  }, [operations]);

  return {
    // Data
    operations: operations || [],
    byType,
    byStatus,
    activeOperations,
    overallProgress,
    config: genesisConfig,

    // State
    isLoading,
    error,
    refetch,

    // Utilities
    getOperation,
    invokeGenesisEngine,

    // Mutations
    createOperation,
    updateOperation,
    initiateManifestion,
    cancelOperation,
    deleteOperation
  };
}

// Query keys factory
export const genesisKeys = {
  all: GENESIS_QUERY_KEY,
  byProfile: (profileId: string) => [...GENESIS_QUERY_KEY, profileId],
  byType: (type: GenesisOperationType) => [...GENESIS_QUERY_KEY, 'type', type],
  byStatus: (status: GenesisStatus) => [...GENESIS_QUERY_KEY, 'status', status]
};
