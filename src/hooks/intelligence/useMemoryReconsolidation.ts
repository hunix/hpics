/**
 * useMemoryReconsolidation Hook
 * AGIS Phase 2 - Memory Reconsolidation Engine
 */

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { invokeFunction } from '@/lib/api';

export interface MemoryIntervention {
  id: string;
  profileId: string;
  targetMemory: string;
  desiredModification: string;
  interventionProtocol: {
    activationPhase: {
      memoryTriggers: string[];
      emotionalPriming: string[];
      contextRecreation: string;
    };
    predictionErrorPhase: {
      contradictoryElements: string[];
      novelInformation: string[];
      uncertaintyInduction: string;
    };
    reconsolidationPhase: {
      newAssociations: string[];
      reinforcementStrategies: string[];
      consolidationWindow: string;
    };
  };
  ethicalConsiderations: string[];
  successProbability: number;
  status: 'planned' | 'in_progress' | 'completed' | 'failed';
  createdAt: string | null;
  completedAt?: string;
}

export function useMemoryReconsolidation() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [interventions, setInterventions] = useState<Map<string, MemoryIntervention[]>>(new Map());

  const generateIntervention = async (
    profileId: string,
    targetMemory: string,
    desiredModification: string
  ): Promise<MemoryIntervention | null> => {
    setIsProcessing(true);
    try {
      const { data, error } = await invokeFunction('memory-reconsolidation-engine', { profileId, targetMemory, desiredModification });

      if (error) throw error;

      const intervention: MemoryIntervention = {
        id: crypto.randomUUID(),
        profileId,
        targetMemory,
        desiredModification,
        interventionProtocol: data.interventionProtocol,
        ethicalConsiderations: data.ethicalConsiderations || [],
        successProbability: data.successProbability || 0.65,
        status: 'planned',
        createdAt: new Date().toISOString()
      };

      // Save to database using actual column names
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const insertData = {
          user_id: user.id,
          target_memory_id: profileId,
          intervention_type: 'reconsolidation',
          memory_category: 'behavioral',
          reconsolidation_technique: JSON.stringify(intervention.interventionProtocol),
          success_rating: intervention.successProbability,
          notes: `Target: ${targetMemory}\nModification: ${desiredModification}`
        };
        await (supabase.from('memory_interventions').insert as any)(insertData);
      }

      // Update local state
      const existing = interventions.get(profileId) || [];
      setInterventions(new Map(interventions.set(profileId, [...existing, intervention])));

      toast.success('Intervention protocol generated');
      return intervention;
    } catch (err) {
      console.error('Memory reconsolidation error:', err);
      toast.error('Failed to generate intervention');
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const loadInterventions = async (profileId: string): Promise<MemoryIntervention[]> => {
    try {
      const result = await supabase
        .from('memory_interventions')
        .select('*')
        .order('created_at', { ascending: false });

      const data = result.data || [];
      if (result.error) throw result.error;

      const mapped: MemoryIntervention[] = (data || []).map((row: any) => ({
        id: row.id,
        profileId: row.target_memory_id,
        targetMemory: row.notes?.split('\n')[0]?.replace('Target: ', '') || '',
        desiredModification: row.notes?.split('\n')[1]?.replace('Modification: ', '') || '',
        interventionProtocol: typeof row.reconsolidation_technique === 'string' 
          ? JSON.parse(row.reconsolidation_technique) 
          : row.reconsolidation_technique || {},
        ethicalConsiderations: [],
        successProbability: row.success_rating || 0,
        status: row.outcome_achieved ? 'completed' : 'planned',
        createdAt: row.created_at,
        completedAt: row.lability_window_end
      }));

      setInterventions(new Map(interventions.set(profileId, mapped)));
      return mapped;
    } catch (err) {
      console.error('Failed to load interventions:', err);
      return [];
    }
  };

  const updateInterventionStatus = async (
    interventionId: string,
    status: MemoryIntervention['status']
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('memory_interventions')
        .update({ 
          outcome_achieved: status === 'completed',
          lability_window_end: status === 'completed' || status === 'failed' 
            ? new Date().toISOString() 
            : null
        })
        .eq('id', interventionId);

      if (error) throw error;
      toast.success(`Intervention ${status}`);
      return true;
    } catch (err) {
      console.error('Failed to update intervention:', err);
      toast.error('Failed to update intervention status');
      return false;
    }
  };

  return {
    isProcessing,
    interventions,
    generateIntervention,
    loadInterventions,
    updateInterventionStatus,
    getInterventions: (profileId: string) => interventions.get(profileId) || []
  };
}
