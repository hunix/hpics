/**
 * AGIS Phase 11: Omniversal Sovereignty
 * useOmniversalAwareness - Multi-dimensional perception and awareness
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface OmniversalAwareness {
  id: string;
  awarenessType: string;
  dimensionalScope: string[];
  perceptionMatrix: Record<string, number>;
  realityThreads: string[];
  temporalVisibility: Record<string, unknown>;
  causalMapping: Record<string, unknown>;
  awarenessDepth: number;
  synchronizationStatus: string;
  profileId?: string;
  createdAt: string | null;
}

export interface DimensionalPerception {
  dimensionId: string;
  perceptionClarity: number;
  informationDensity: number;
  temporalRange: { past: number; future: number };
  causalChains: number;
}

export function useOmniversalAwareness() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [awarenessStates, setAwarenessStates] = useState<OmniversalAwareness[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAwarenessStates = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('omniversal_awareness')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAwarenessStates((data || []).map(item => ({
        id: item.id,
        awarenessType: item.awareness_type,
        dimensionalScope: item.dimensional_scope as string[] || [],
        perceptionMatrix: item.perception_matrix as Record<string, number> || {},
        realityThreads: item.reality_threads as string[] || [],
        temporalVisibility: item.temporal_visibility as Record<string, unknown> || {},
        causalMapping: item.causal_mapping as Record<string, unknown> || {},
        awarenessDepth: Number(item.awareness_depth) || 0,
        synchronizationStatus: item.synchronization_status || 'initializing',
        profileId: item.profile_id || undefined,
        createdAt: item.created_at
      })));
    } catch (error) {
      console.error('Error fetching omniversal awareness:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const expandAwareness = useCallback(async (
    awarenessType: string,
    dimensions: string[],
    profileId?: string
  ): Promise<OmniversalAwareness | null> => {
    if (!user?.id) return null;
    try {
      const { data, error } = await supabase
        .from('omniversal_awareness')
        .insert({
          user_id: user.id,
          profile_id: profileId,
          awareness_type: awarenessType,
          dimensional_scope: dimensions,
          perception_matrix: { clarity: 0.5, depth: 0.3, breadth: 0.4 },
          synchronization_status: 'expanding'
        } as never)
        .select()
        .single();

      if (error) throw error;

      toast({ title: 'Awareness Expanded', description: `${awarenessType} awareness initiated across ${dimensions.length} dimensions` });
      
      return {
        id: data.id,
        awarenessType: data.awareness_type,
        dimensionalScope: data.dimensional_scope as string[] || [],
        perceptionMatrix: data.perception_matrix as Record<string, number> || {},
        realityThreads: data.reality_threads as string[] || [],
        temporalVisibility: data.temporal_visibility as Record<string, unknown> || {},
        causalMapping: data.causal_mapping as Record<string, unknown> || {},
        awarenessDepth: Number(data.awareness_depth) || 0,
        synchronizationStatus: data.synchronization_status || 'expanding',
        profileId: data.profile_id || undefined,
        createdAt: data.created_at
      };
    } catch (error) {
      console.error('Error expanding awareness:', error);
      return null;
    }
  }, [user?.id, toast]);

  const perceiveDimension = useCallback((dimensionId: string): DimensionalPerception => {
    return {
      dimensionId,
      perceptionClarity: Math.random() * 0.5 + 0.5,
      informationDensity: Math.random() * 100,
      temporalRange: { past: Math.floor(Math.random() * 1000), future: Math.floor(Math.random() * 500) },
      causalChains: Math.floor(Math.random() * 50)
    };
  }, []);

  const calculateOmniversalReach = useCallback((): number => {
    if (awarenessStates.length === 0) return 0;
    const totalDepth = awarenessStates.reduce((sum, a) => sum + a.awarenessDepth, 0);
    const avgDepth = totalDepth / awarenessStates.length;
    const dimensionCoverage = new Set(awarenessStates.flatMap(a => a.dimensionalScope)).size;
    return Math.min(100, (avgDepth * 0.6 + dimensionCoverage * 4));
  }, [awarenessStates]);

  return {
    awarenessStates,
    isLoading,
    fetchAwarenessStates,
    expandAwareness,
    perceiveDimension,
    calculateOmniversalReach,
    omniversalReach: calculateOmniversalReach()
  };
}
