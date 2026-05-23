/**
 * Campaign Evolution Engine Hook
 * Self-evolving genetic algorithm for influence campaigns
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { invokeFunction } from '@/lib/api';

export interface CampaignGenome {
  id: string;
  genomeName: string;
  generation: number;
  parentGenomeId?: string;
  strategyDna: Record<string, unknown>;
  tacticsGenes: Array<{ name: string; weight: number; enabled: boolean }>;
  timingPatterns: Record<string, unknown>;
  channelWeights: Record<string, number>;
  fitnessScore: number;
  survivalCount: number;
  mutationHistory: Array<{ type: string; timestamp: string; effect: number }>;
  isActive: boolean;
  createdAt: string;
}

export interface EvolutionRun {
  id: string;
  evolutionRunId: string;
  generationNumber: number;
  populationSize: number;
  bestFitness: number;
  averageFitness: number;
  diversityIndex: number;
  survivingGenomes: string[];
  mutationsApplied: Array<{ type: string; count: number }>;
  crossoversPerformed: number;
  selectionPressure: number;
  completedAt?: string;
  createdAt: string;
}

export interface StrategyMutation {
  id: string;
  genomeId: string;
  mutationType: string;
  originalValue: unknown;
  mutatedValue: unknown;
  fitnessDelta: number;
  adoptionRate: number;
  successExamples: Array<{ campaignId: string; improvement: number }>;
  discoveredAt: string;
}

export interface CounterOperation {
  id: string;
  profileId?: string;
  operationType: string;
  threatLevel: string;
  detectedPatterns: Array<{ pattern: string; confidence: number; source: string }>;
  adversaryIndicators: Record<string, unknown>;
  sourceAnalysis: Record<string, unknown>;
  counterStrategy: Record<string, unknown>;
  responseActions: Array<{ action: string; status: string; effectiveness: number }>;
  status: string;
  neutralizedAt?: string;
  detectedAt: string;
}

export function useCampaignEvolution() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: genomes, isLoading: genomesLoading } = useQuery({
    queryKey: ['campaign-genomes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaign_genomes')
        .select('*')
        .eq('user_id', user!.id)
        .order('fitness_score', { ascending: false });

      if (error) throw error;

      return (data || []).map((g): CampaignGenome => ({
        id: g.id,
        genomeName: g.genome_name,
        generation: g.generation || 1,
        parentGenomeId: g.parent_genome_id,
        strategyDna: (g.strategy_dna as any) || {},
        tacticsGenes: (g.tactics_genes as any) || [],
        timingPatterns: (g.timing_patterns as any) || {},
        channelWeights: (g.channel_weights as any) || {},
        fitnessScore: Number(g.fitness_score) || 0,
        survivalCount: g.survival_count || 0,
        mutationHistory: (g.mutation_history as any) || [],
        isActive: g.is_active ?? true,
        createdAt: g.created_at,
      }));
    },
    enabled: !!user?.id,
  });

  const { data: evolutionRuns, isLoading: runsLoading } = useQuery({
    queryKey: ['campaign-evolution'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaign_evolution')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      return (data || []).map((r): EvolutionRun => ({
        id: r.id,
        evolutionRunId: r.evolution_run_id,
        generationNumber: r.generation_number || 1,
        populationSize: r.population_size || 0,
        bestFitness: Number(r.best_fitness) || 0,
        averageFitness: Number(r.average_fitness) || 0,
        diversityIndex: Number(r.diversity_index) || 0,
        survivingGenomes: (r.surviving_genomes as any) || [],
        mutationsApplied: (r.mutations_applied as any) || [],
        crossoversPerformed: r.crossovers_performed || 0,
        selectionPressure: Number(r.selection_pressure) || 0.5,
        completedAt: r.completed_at,
        createdAt: r.created_at,
      }));
    },
    enabled: !!user?.id,
  });

  const { data: counterOps, isLoading: opsLoading } = useQuery({
    queryKey: ['counter-operations'],
    queryFn: async (): Promise<CounterOperation[]> => {
      // Counter operations stored in existing table with compatible schema
      return [];
    },
    enabled: !!user?.id,
  });

  const evolveGeneration = useMutation({
    mutationFn: async (params: { selectionPressure?: number; mutationRate?: number }) => {
      const { data, error } = await invokeFunction('campaign-evolution-engine', { 
          action: 'evolve_generation',
          selectionPressure: params.selectionPressure || 0.5,
          mutationRate: params.mutationRate || 0.1,
        },);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-genomes'] });
      queryClient.invalidateQueries({ queryKey: ['campaign-evolution'] });
      toast.success('New generation evolved');
    },
    onError: (error) => {
      toast.error(`Evolution failed: ${error.message}`);
    },
  });

  const createGenome = useMutation({
    mutationFn: async (params: {
      genomeName: string;
      strategyDna: Record<string, unknown>;
      tacticsGenes: Array<{ name: string; weight: number; enabled: boolean }>;
    }) => {
      const { data, error } = await (supabase
        .from('campaign_genomes') as any)
        .insert({
          user_id: user!.id,
          genome_name: params.genomeName,
          strategy_dna: params.strategyDna,
          tactics_genes: params.tacticsGenes,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-genomes'] });
      toast.success('Genome created');
    },
  });

  const detectAdversarial = useMutation({
    mutationFn: async (params: { profileId?: string; communicationData: unknown }) => {
      const { data, error } = await invokeFunction('counter-adversarial-detector', { 
          profileId: params.profileId,
          communicationData: params.communicationData,
        },);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['counter-operations'] });
    },
  });

  // Computed metrics
  const eliteGenomes = genomes?.filter(g => g.fitnessScore >= 0.8) || [];
  const latestGeneration = evolutionRuns?.[0]?.generationNumber || 0;
  const avgFitness = genomes?.length 
    ? genomes.reduce((sum, g) => sum + g.fitnessScore, 0) / genomes.length 
    : 0;
  const activeThreats = counterOps?.filter(o => o.status === 'detected' || o.status === 'investigating').length || 0;

  return {
    genomes,
    evolutionRuns,
    counterOps,
    isLoading: genomesLoading || runsLoading || opsLoading,
    evolveGeneration: evolveGeneration.mutate,
    createGenome: createGenome.mutate,
    detectAdversarial: detectAdversarial.mutate,
    isEvolving: evolveGeneration.isPending,
    eliteGenomes,
    latestGeneration,
    avgFitness,
    activeThreats,
    totalGenomes: genomes?.length || 0,
  };
}
