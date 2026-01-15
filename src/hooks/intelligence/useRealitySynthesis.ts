import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface RealitySynthesis {
  id: string;
  synthesisType: string;
  inputSources: Array<{ source: string; weight: number; lastUpdate: string }>;
  realityModel: Record<string, unknown>;
  confidenceScore: number;
  temporalAccuracy: number;
  spatialAccuracy: number;
  causalDepth: number;
  synthesisTimestamp: string;
  validityWindow: { start: string; end: string };
  createdAt: string;
}

export interface OmniscientAwareness {
  id: string;
  awarenessDomain: string;
  awarenessScope: Record<string, unknown>;
  blindSpots: Array<{ area: string; severity: number }>;
  coveragePercentage: number;
  realTimeFeeds: Array<{ feedId: string; status: string }>;
  patternRecognition: Record<string, unknown>;
  threatDetection: Array<{ threat: string; level: number }>;
  opportunityDetection: Array<{ opportunity: string; score: number }>;
  lastScanAt: string;
}

export function useRealitySynthesis() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: syntheses = [], isLoading: synthesesLoading } = useQuery({
    queryKey: ['reality-synthesis', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reality_synthesis')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(row => ({
        id: row.id,
        synthesisType: row.synthesis_type,
        inputSources: row.input_sources as RealitySynthesis['inputSources'],
        realityModel: row.reality_model as Record<string, unknown>,
        confidenceScore: Number(row.confidence_score),
        temporalAccuracy: Number(row.temporal_accuracy),
        spatialAccuracy: Number(row.spatial_accuracy),
        causalDepth: row.causal_depth,
        synthesisTimestamp: row.synthesis_timestamp,
        validityWindow: row.validity_window as RealitySynthesis['validityWindow'],
        createdAt: row.created_at
      })) as RealitySynthesis[];
    },
    enabled: !!user?.id
  });

  const { data: awarenessData = [], isLoading: awarenessLoading } = useQuery({
    queryKey: ['omniscient-awareness', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('omniscient_awareness')
        .select('*')
        .eq('user_id', user?.id)
        .order('last_scan_at', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(row => ({
        id: row.id,
        awarenessDomain: row.awareness_domain,
        awarenessScope: row.awareness_scope as Record<string, unknown>,
        blindSpots: row.blind_spots as OmniscientAwareness['blindSpots'],
        coveragePercentage: Number(row.coverage_percentage),
        realTimeFeeds: row.real_time_feeds as OmniscientAwareness['realTimeFeeds'],
        patternRecognition: row.pattern_recognition as Record<string, unknown>,
        threatDetection: row.threat_detection as OmniscientAwareness['threatDetection'],
        opportunityDetection: row.opportunity_detection as OmniscientAwareness['opportunityDetection'],
        lastScanAt: row.last_scan_at
      })) as OmniscientAwareness[];
    },
    enabled: !!user?.id
  });

  const createSynthesisMutation = useMutation({
    mutationFn: async (synthesis: Partial<RealitySynthesis>) => {
      const { data, error } = await supabase
        .from('reality_synthesis')
        .insert({
          user_id: user?.id,
          synthesis_type: synthesis.synthesisType,
          input_sources: synthesis.inputSources,
          reality_model: synthesis.realityModel,
          confidence_score: synthesis.confidenceScore,
          temporal_accuracy: synthesis.temporalAccuracy,
          spatial_accuracy: synthesis.spatialAccuracy,
          causal_depth: synthesis.causalDepth
        } as never)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reality-synthesis'] })
  });

  const createAwarenessMutation = useMutation({
    mutationFn: async (awareness: Partial<OmniscientAwareness>) => {
      const { data, error } = await supabase
        .from('omniscient_awareness')
        .insert({
          user_id: user?.id,
          awareness_domain: awareness.awarenessDomain,
          awareness_scope: awareness.awarenessScope,
          blind_spots: awareness.blindSpots,
          coverage_percentage: awareness.coveragePercentage,
          real_time_feeds: awareness.realTimeFeeds,
          pattern_recognition: awareness.patternRecognition,
          threat_detection: awareness.threatDetection,
          opportunity_detection: awareness.opportunityDetection
        } as never)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['omniscient-awareness'] })
  });

  return {
    syntheses,
    awarenessData,
    isLoading: synthesesLoading || awarenessLoading,
    createSynthesis: createSynthesisMutation.mutateAsync,
    createAwareness: createAwarenessMutation.mutateAsync,
    totalCoverage: awarenessData.reduce((sum, a) => sum + a.coveragePercentage, 0) / Math.max(awarenessData.length, 1),
    activeThreats: awarenessData.flatMap(a => a.threatDetection).length,
    opportunities: awarenessData.flatMap(a => a.opportunityDetection).length
  };
}
