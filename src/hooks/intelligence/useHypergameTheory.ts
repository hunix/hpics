/**
 * Hypergame Theory Hook (v9.0)
 * 
 * React hook for hypergame analysis, perception gap detection, and quantum game simulation.
 * 
 * @version 9.0
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  analyzeHypergame,
  computeHNE,
  detectPerceptionGaps,
  identifyExploitableAsymmetries,
  type Player,
  type HypergameAnalysis,
  type HypergameNashEquilibrium,
  type PerceptionGap,
  type ExploitableAsymmetry,
} from '@/lib/gameTheory/hypergameEngine';
import {
  simulateQuantumGame,
  createQuantumPrisonersDilemma,
  type QuantumGameResult,
} from '@/lib/gameTheory/quantumGameSimulator';
import {
  analyzePersuasion,
  type PersuasionAnalysis,
  type ReceiverType,
  type TrustConstraint,
} from '@/lib/gameTheory/bayesianPersuader';

export interface HypergameRecord {
  id: string;
  profileIds: string[];
  analysis: HypergameAnalysis;
  quantumResult?: QuantumGameResult;
  persuasionAnalysis?: PersuasionAnalysis;
  createdAt: string;
}

export function useHypergameTheory(profileIds?: string[]) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch cached hypergame analyses
  const { data: cachedAnalyses, isLoading: analysesLoading } = useQuery({
    queryKey: ['hypergame-analyses', profileIds],
    queryFn: async () => {
      let query = supabase
        .from('ai_analyses')
        .select('*')
        .eq('analysis_type', 'hypergame')
        .order('created_at', { ascending: false });

      const { data, error } = await query.limit(50);
      if (error) throw error;
      
      return (data || []).map((row: Record<string, unknown>) => {
        const results = row.results as Record<string, unknown> || {};
        return {
          id: row.id as string,
          profileIds: (results.profileIds || []) as string[],
          analysis: (results.hypergameAnalysis || {}) as HypergameAnalysis,
          quantumResult: results.quantumResult as QuantumGameResult | undefined,
          persuasionAnalysis: results.persuasionAnalysis as PersuasionAnalysis | undefined,
          createdAt: row.created_at as string,
        };
      }) as HypergameRecord[];
    },
    enabled: !!user,
  });

  // Local hypergame analysis (client-side, fast)
  const modelHypergame = (players: Player[]): HypergameAnalysis => {
    return analyzeHypergame(players);
  };

  // Compute Nash Equilibria
  const computeEquilibria = (players: Player[], maxLevel?: number): HypergameNashEquilibrium[] => {
    return computeHNE(players, maxLevel);
  };

  // Find perception gaps between players
  const findPerceptionGaps = (players: Player[]): PerceptionGap[] => {
    return detectPerceptionGaps(players);
  };

  // Identify exploitable asymmetries
  const findAsymmetries = (players: Player[]): ExploitableAsymmetry[] => {
    return identifyExploitableAsymmetries(players);
  };

  // Simulate quantum game
  const simulateQuantum = (
    player1: { id: string; name: string },
    player2: { id: string; name: string },
    entanglement?: number
  ): QuantumGameResult => {
    const game = createQuantumPrisonersDilemma(player1, player2, entanglement);
    return simulateQuantumGame(game);
  };

  // Analyze persuasion strategy
  const analyzePersuasionStrategy = (
    receiver: ReceiverType,
    targetActions: string[],
    states: string[],
    trustConstraint?: TrustConstraint
  ): PersuasionAnalysis => {
    return analyzePersuasion(receiver, targetActions, states, trustConstraint);
  };

  // Full analysis via edge function (comprehensive, server-side)
  const fullAnalysisMutation = useMutation({
    mutationFn: async (input: { 
      profileIds: string[];
      gameType?: 'hypergame' | 'quantum' | 'persuasion';
      entanglementLevel?: number;
    }) => {
      const { data, error } = await supabase.functions.invoke('hypergame-solver', {
        body: {
          userId: user!.id,
          profileIds: input.profileIds,
          gameType: input.gameType || 'hypergame',
          entanglementLevel: input.entanglementLevel,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hypergame-analyses'] });
    },
  });

  // Build players from profile data
  const buildPlayersFromProfiles = useMutation({
    mutationFn: async (ids: string[]): Promise<Player[]> => {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', ids);

      if (error) throw error;

      // Build player models from profile data
      return (profiles || []).map((p: Record<string, unknown>) => ({
        id: p.id as string,
        name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Unknown',
        profileId: p.id as string,
        strategies: ['cooperate', 'compete', 'negotiate', 'defer'],
        perceivedGame: {
          players: ids,
          strategies: ids.reduce((acc, id) => {
            acc[id] = ['cooperate', 'compete', 'negotiate', 'defer'];
            return acc;
          }, {} as Record<string, string[]>),
          payoffs: ids.reduce((acc, id) => {
            acc[id] = { 'cooperate': 3, 'compete': 1, 'negotiate': 2, 'defer': 0 };
            return acc;
          }, {} as Record<string, Record<string, number>>),
        },
        beliefLevel: 2, // Default to level-2 reasoning
      }));
    },
  });

  // Get summary statistics
  const getStatistics = () => {
    if (!cachedAnalyses || cachedAnalyses.length === 0) {
      return null;
    }

    const totalGaps = cachedAnalyses.reduce((sum, a) => 
      sum + (a.analysis?.perceptionGaps?.length || 0), 0
    );
    const totalAsymmetries = cachedAnalyses.reduce((sum, a) => 
      sum + (a.analysis?.exploitableAsymmetries?.length || 0), 0
    );
    const quantumAdvantaged = cachedAnalyses.filter(a => 
      a.quantumResult?.quantumEquilibrium?.isQuantumAdvantaged
    ).length;

    return {
      totalAnalyses: cachedAnalyses.length,
      totalPerceptionGaps: totalGaps,
      totalExploitableAsymmetries: totalAsymmetries,
      quantumAdvantagedGames: quantumAdvantaged,
      averageConfidence: cachedAnalyses.reduce((sum, a) => 
        sum + (a.analysis?.confidence || 0), 0
      ) / cachedAnalyses.length,
    };
  };

  return {
    cachedAnalyses,
    isLoading: analysesLoading,
    // Client-side analysis
    modelHypergame,
    computeEquilibria,
    findPerceptionGaps,
    findAsymmetries,
    simulateQuantum,
    analyzePersuasionStrategy,
    // Server-side analysis
    runFullAnalysis: fullAnalysisMutation.mutateAsync,
    isAnalyzing: fullAnalysisMutation.isPending,
    // Helpers
    buildPlayersFromProfiles: buildPlayersFromProfiles.mutateAsync,
    isBuildingPlayers: buildPlayersFromProfiles.isPending,
    statistics: getStatistics(),
  };
}
