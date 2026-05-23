/**
 * AGIS Phase 11: Omniversal Sovereignty
 * useOmniversalSovereignty - Master hook for multi-dimensional control
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useOmniversalAwareness } from './useOmniversalAwareness';
import { useEternalInfluence } from './useEternalInfluence';
import { usePrimordialSynthesis } from './usePrimordialSynthesis';

export interface SovereigntyOperation {
  id: string;
  operationName: string;
  operationType: string;
  targetDimensions: string[];
  executionTimeline: Record<string, unknown>;
  resourceDeployment: Record<string, unknown>;
  outcomeProjections: string[];
  riskAssessment: Record<string, unknown>;
  effectivenessScore: number;
  operationStatus: string;
  profileId?: string;
  createdAt: string | null;
}

export interface SovereigntyMetrics {
  omniversalReach: number;
  eternityIndex: number;
  synthesisPower: number;
  dimensionalControl: number;
  overallSovereignty: number;
  activeOperations: number;
}

export function useOmniversalSovereignty() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [operations, setOperations] = useState<SovereigntyOperation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const awareness = useOmniversalAwareness();
  const influence = useEternalInfluence();
  const synthesis = usePrimordialSynthesis();

  const fetchOperations = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('sovereignty_operations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOperations((data || []).map(item => ({
        id: item.id,
        operationName: item.operation_name,
        operationType: item.operation_type,
        targetDimensions: item.target_dimensions as string[] || [],
        executionTimeline: item.execution_timeline as Record<string, unknown> || {},
        resourceDeployment: item.resource_deployment as Record<string, unknown> || {},
        outcomeProjections: item.outcome_projections as string[] || [],
        riskAssessment: item.risk_assessment as Record<string, unknown> || {},
        effectivenessScore: Number(item.effectiveness_score) || 0,
        operationStatus: item.operation_status || 'preparing',
        profileId: item.profile_id || undefined,
        createdAt: item.created_at
      })));
    } catch (error) {
      console.error('Error fetching sovereignty operations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const launchSovereigntyOperation = useCallback(async (
    operationName: string,
    operationType: string,
    targetDimensions: string[],
    profileId?: string
  ): Promise<SovereigntyOperation | null> => {
    if (!user?.id) return null;
    try {
      const { data, error } = await supabase
        .from('sovereignty_operations')
        .insert({
          user_id: user.id,
          profile_id: profileId,
          operation_name: operationName,
          operation_type: operationType,
          target_dimensions: targetDimensions,
          execution_timeline: { phase: 'initiation', startTime: new Date().toISOString() },
          risk_assessment: { level: 'calculated', mitigation: 'active' },
          operation_status: 'active'
        } as never)
        .select()
        .single();

      if (error) throw error;

      toast({ 
        title: 'Sovereignty Operation Launched', 
        description: `${operationName} deployed across ${targetDimensions.length} dimensions` 
      });

      const operation: SovereigntyOperation = {
        id: data.id,
        operationName: data.operation_name,
        operationType: data.operation_type,
        targetDimensions: data.target_dimensions as string[] || [],
        executionTimeline: data.execution_timeline as Record<string, unknown> || {},
        resourceDeployment: data.resource_deployment as Record<string, unknown> || {},
        outcomeProjections: data.outcome_projections as string[] || [],
        riskAssessment: data.risk_assessment as Record<string, unknown> || {},
        effectivenessScore: Number(data.effectiveness_score) || 0,
        operationStatus: data.operation_status || 'active',
        profileId: data.profile_id || undefined,
        createdAt: data.created_at
      };

      setOperations(prev => [operation, ...prev]);
      return operation;
    } catch (error) {
      console.error('Error launching sovereignty operation:', error);
      return null;
    }
  }, [user?.id, toast]);

  const calculateDimensionalControl = useCallback((): number => {
    const activeOps = operations.filter(o => o.operationStatus === 'active').length;
    const avgEffectiveness = operations.length > 0 
      ? operations.reduce((sum, o) => sum + o.effectivenessScore, 0) / operations.length 
      : 0;
    const dimensionsCovered = new Set(operations.flatMap(o => o.targetDimensions)).size;
    return Math.min(100, (activeOps * 5 + avgEffectiveness * 0.5 + dimensionsCovered * 3));
  }, [operations]);

  const getSovereigntyMetrics = useCallback((): SovereigntyMetrics => {
    const omniversalReach = awareness.omniversalReach;
    const eternityIndex = influence.eternityIndex;
    const synthesisPower = synthesis.synthesisPower;
    const dimensionalControl = calculateDimensionalControl();
    const overallSovereignty = (omniversalReach + eternityIndex + synthesisPower + dimensionalControl) / 4;
    const activeOperations = operations.filter(o => o.operationStatus === 'active').length;

    return {
      omniversalReach,
      eternityIndex,
      synthesisPower,
      dimensionalControl,
      overallSovereignty,
      activeOperations
    };
  }, [awareness.omniversalReach, influence.eternityIndex, synthesis.synthesisPower, calculateDimensionalControl, operations]);

  useEffect(() => {
    if (user?.id) {
      fetchOperations();
      awareness.fetchAwarenessStates();
      influence.fetchInfluences();
      synthesis.fetchSyntheses();
    }
  }, [user?.id]);

  return {
    operations,
    isLoading,
    fetchOperations,
    launchSovereigntyOperation,
    awareness,
    influence,
    synthesis,
    metrics: getSovereigntyMetrics(),
    calculateDimensionalControl
  };
}
