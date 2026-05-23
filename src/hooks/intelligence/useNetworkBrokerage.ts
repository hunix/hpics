/**
 * Network Brokerage Analysis Hook
 * Structural holes theory and brokerage opportunity detection
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { invokeFunction } from '@/lib/api';

export interface StructuralHole {
  id: string;
  betweenGroups: [string, string];
  bridgePotential: number;
  informationArbitrage: number;
  controlPotential: number;
  currentBridges: string[];
  optimalBridgingStrategy: string;
}

export interface BrokerageOpportunity {
  id: string;
  type: 'coordinator' | 'gatekeeper' | 'representative' | 'consultant' | 'liaison';
  description: string;
  parties: string[];
  value: number;
  urgency: 'low' | 'medium' | 'high';
  actionRequired: string;
  potentialOutcome: string;
  risks: string[];
}

export interface NetworkPosition {
  profileId: string;
  
  // Burt's structural metrics
  constraint: number; // 0-1, lower = more structural holes
  efficiency: number;
  effectiveSize: number;
  hierarchy: number;
  
  // Betweenness and centrality
  betweennessCentrality: number;
  closenessCentrality: number;
  eigenvectorCentrality: number;
  
  // Brokerage scores by type
  brokerageScores: {
    coordinator: number;
    gatekeeper: number;
    representative: number;
    consultant: number;
    liaison: number;
  };
  
  // Identified structural holes
  structuralHoles: StructuralHole[];
  
  // Brokerage opportunities
  opportunities: BrokerageOpportunity[];
  
  // Network position assessment
  positionAssessment: {
    role: string;
    influence: number;
    vulnerability: number;
    recommendations: string[];
  };
  
  // Tertius Gaudens strategy
  tertiusGaudensOpportunities: {
    parties: [string, string];
    conflict: string;
    exploitationStrategy: string;
    expectedBenefit: string;
    ethicalConsiderations: string[];
  }[];
  
  analyzedAt: Date;
}

export function useNetworkBrokerage() {
  const { user } = useAuth();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [positions, setPositions] = useState<Map<string, NetworkPosition>>(new Map());
  const [networkOpportunities, setNetworkOpportunities] = useState<BrokerageOpportunity[]>([]);

  const analyzePosition = useCallback(async (
    profileId: string,
    networkContext?: {
      connections?: { from: string; to: string; strength: number }[];
      groupMemberships?: { profileId: string; group: string }[];
    }
  ): Promise<NetworkPosition | null> => {
    if (!user) return null;
    setIsAnalyzing(true);

    try {
      const { data, error } = await invokeFunction('network-brokerage-analyzer', {
          userId: user.id,
          profileId,
          networkContext,
          action: 'analyze_position'
        });

      if (error) throw error;

      const position = data?.position as NetworkPosition;
      
      // Save to database
      await supabase.from('network_brokerage').upsert({
        user_id: user.id,
        profile_id: profileId,
        constraint_score: position.constraint,
        efficiency_score: position.efficiency,
        effective_size: position.effectiveSize,
        hierarchy_score: position.hierarchy,
        betweenness_centrality: position.betweennessCentrality,
        closeness_centrality: position.closenessCentrality,
        eigenvector_centrality: position.eigenvectorCentrality,
        brokerage_scores: position.brokerageScores,
        structural_holes: position.structuralHoles,
        opportunities: position.opportunities,
        position_assessment: position.positionAssessment,
        tertius_gaudens_opportunities: position.tertiusGaudensOpportunities,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,profile_id' });

      setPositions(prev => new Map(prev).set(profileId, position));
      
      // Update global opportunities
      setNetworkOpportunities(prev => {
        const filtered = prev.filter(o => !o.parties.includes(profileId));
        return [...filtered, ...position.opportunities];
      });

      toast.success('Network position analyzed');

      return position;
    } catch (error) {
      console.error('Error analyzing network position:', error);
      toast.error('Failed to analyze network position');
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [user]);

  const findStructuralHoles = useCallback(async (): Promise<StructuralHole[]> => {
    if (!user) return [];

    try {
      const { data, error } = await invokeFunction('network-brokerage-analyzer', {
          userId: user.id,
          action: 'find_structural_holes'
        });

      if (error) throw error;
      return data?.structuralHoles || [];
    } catch (error) {
      console.error('Error finding structural holes:', error);
      return [];
    }
  }, [user]);

  const getBrokerageOpportunities = useCallback(async (
    minValue: number = 0.5
  ): Promise<BrokerageOpportunity[]> => {
    if (!user) return [];

    try {
      const { data, error } = await invokeFunction('network-brokerage-analyzer', {
          userId: user.id,
          minValue,
          action: 'get_opportunities'
        });

      if (error) throw error;
      
      const opportunities = data?.opportunities || [];
      setNetworkOpportunities(opportunities);
      return opportunities;
    } catch (error) {
      console.error('Error getting brokerage opportunities:', error);
      return [];
    }
  }, [user]);

  const getTopBrokers = useCallback((limit: number = 5): NetworkPosition[] => {
    return Array.from(positions.values())
      .sort((a, b) => b.betweennessCentrality - a.betweennessCentrality)
      .slice(0, limit);
  }, [positions]);

  const getConstraintRanking = useCallback((limit: number = 10): NetworkPosition[] => {
    // Lower constraint = more structural holes = more brokerage potential
    return Array.from(positions.values())
      .sort((a, b) => a.constraint - b.constraint)
      .slice(0, limit);
  }, [positions]);

  const loadPosition = useCallback(async (profileId: string): Promise<NetworkPosition | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('network_brokerage')
        .select('*')
        .eq('user_id', user.id)
        .eq('profile_id', profileId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      const bridgeOpps = (data.bridge_opportunities as any[]) || [];

      const position: NetworkPosition = {
        profileId: data.profile_id || profileId,
        constraint: data.constraint_score || 0,
        efficiency: 0.5,
        effectiveSize: data.structural_holes_bridged || 0,
        hierarchy: 0.5,
        betweennessCentrality: data.betweenness_centrality || 0,
        closenessCentrality: 0.5,
        eigenvectorCentrality: 0.5,
        brokerageScores: { coordinator: data.brokerage_score || 0, gatekeeper: 0, representative: 0, consultant: 0, liaison: 0 },
        structuralHoles: [],
        opportunities: bridgeOpps,
        positionAssessment: { role: 'Broker', influence: data.brokerage_score || 0, vulnerability: 0.3, recommendations: [] },
        tertiusGaudensOpportunities: (data.tertius_gaudens_positions as any[]) || [],
        analyzedAt: new Date(data.updated_at || new Date())
      };

      setPositions(prev => new Map(prev).set(profileId, position));
      return position;
    } catch (error) {
      console.error('Error loading network position:', error);
      return null;
    }
  }, [user]);

  return {
    isAnalyzing,
    positions,
    networkOpportunities,
    analyzePosition,
    findStructuralHoles,
    getBrokerageOpportunities,
    getTopBrokers,
    getConstraintRanking,
    loadPosition,
    getPosition: (id: string) => positions.get(id)
  };
}
