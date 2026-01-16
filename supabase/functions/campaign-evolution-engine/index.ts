import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EvolutionRequest {
  action: string;
  selectionPressure?: number;
  mutationRate?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, selectionPressure = 0.5, mutationRate = 0.1 } = await req.json() as EvolutionRequest;

    if (action === 'evolve_generation') {
      // Fetch current population
      const { data: currentGenomes, error: fetchError } = await supabaseClient
        .from('campaign_genomes')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('fitness_score', { ascending: false });

      if (fetchError) throw fetchError;

      // If no genomes exist, create initial population
      if (!currentGenomes || currentGenomes.length === 0) {
        const initialPopulation = createInitialPopulation(user.id, 10);
        const { error: insertError } = await supabaseClient
          .from('campaign_genomes')
          .insert(initialPopulation);

        if (insertError) throw insertError;

        return new Response(JSON.stringify({ 
          success: true,
          message: 'Initial population created',
          populationSize: initialPopulation.length,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Evaluate fitness for all genomes
      const evaluatedGenomes = await evaluateFitness(supabaseClient, currentGenomes, user.id);

      // Selection - tournament selection based on selection pressure
      const survivors = tournamentSelection(evaluatedGenomes, selectionPressure);

      // Crossover - create offspring from survivors
      const offspring = performCrossover(survivors, user.id);

      // Mutation - apply random mutations
      const mutatedOffspring = applyMutations(offspring, mutationRate);

      // Get the latest generation number
      const { data: latestEvolution } = await supabaseClient
        .from('campaign_evolution')
        .select('generation_number')
        .eq('user_id', user.id)
        .order('generation_number', { ascending: false })
        .limit(1)
        .single();

      const newGeneration = (latestEvolution?.generation_number || 0) + 1;

      // Update offspring with new generation
      for (const genome of mutatedOffspring) {
        genome.generation = newGeneration;
      }

      // Deactivate old genomes that didn't survive
      const survivorIds = survivors.map(s => s.id);
      await supabaseClient
        .from('campaign_genomes')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .not('id', 'in', `(${survivorIds.join(',')})`);

      // Insert new offspring
      if (mutatedOffspring.length > 0) {
        const { error: offspringError } = await supabaseClient
          .from('campaign_genomes')
          .insert(mutatedOffspring);

        if (offspringError) throw offspringError;
      }

      // Record evolution run
      const evolutionRecord = {
        user_id: user.id,
        evolution_run_id: `evo_${Date.now()}`,
        generation_number: newGeneration,
        population_size: survivors.length + mutatedOffspring.length,
        best_fitness: Math.max(...evaluatedGenomes.map(g => g.fitness_score)),
        average_fitness: evaluatedGenomes.reduce((sum, g) => sum + g.fitness_score, 0) / evaluatedGenomes.length,
        diversity_index: calculateDiversity(evaluatedGenomes),
        surviving_genomes: survivorIds,
        mutations_applied: countMutations(mutatedOffspring),
        crossovers_performed: Math.floor(offspring.length / 2),
        selection_pressure: selectionPressure,
        completed_at: new Date().toISOString(),
      };

      const { error: evolutionError } = await supabaseClient
        .from('campaign_evolution')
        .insert(evolutionRecord);

      if (evolutionError) throw evolutionError;

      return new Response(JSON.stringify({ 
        success: true,
        generation: newGeneration,
        survivors: survivors.length,
        offspring: mutatedOffspring.length,
        bestFitness: evolutionRecord.best_fitness,
        avgFitness: evolutionRecord.average_fitness,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Campaign evolution error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function createInitialPopulation(userId: string, size: number): any[] {
  const population: any[] = [];
  const tactics = ['emotional_appeal', 'rational_argument', 'social_proof', 'scarcity', 'authority', 'reciprocity'];
  const channels = ['email', 'social', 'direct', 'indirect', 'event'];

  for (let i = 0; i < size; i++) {
    const tacticsGenes = tactics.map(t => ({
      name: t,
      weight: Math.random(),
      enabled: Math.random() > 0.3,
    }));

    const channelWeights: Record<string, number> = {};
    for (const ch of channels) {
      channelWeights[ch] = Math.random();
    }

    population.push({
      user_id: userId,
      genome_name: `Genome_${i + 1}_Gen1`,
      generation: 1,
      strategy_dna: {
        aggression: Math.random(),
        persistence: Math.random(),
        adaptability: Math.random(),
        timing_sensitivity: Math.random(),
      },
      tactics_genes: tacticsGenes,
      timing_patterns: {
        preferred_hours: [9, 10, 11, 14, 15, 16],
        day_weights: { mon: 0.8, tue: 0.9, wed: 1.0, thu: 0.9, fri: 0.7 },
        frequency_days: 3 + Math.floor(Math.random() * 4),
      },
      channel_weights: channelWeights,
      fitness_score: 0,
      survival_count: 0,
      mutation_history: [],
      is_active: true,
    });
  }

  return population;
}

async function evaluateFitness(supabase: any, genomes: any[], userId: string): Promise<any[]> {
  // Fetch campaign execution data to evaluate genome performance
  const { data: executions } = await supabase
    .from('agent_executions')
    .select('*')
    .eq('user_id', userId)
    .order('executed_at', { ascending: false })
    .limit(200);

  return genomes.map(genome => {
    // Calculate fitness based on strategy DNA alignment with successful executions
    const successfulExecs = executions?.filter((e: any) => e.outcome === 'success') || [];
    const totalExecs = executions?.length || 1;
    const baseSuccessRate = successfulExecs.length / totalExecs;

    // Penalize for lack of diversity
    const tacticsEnabled = genome.tactics_genes?.filter((t: any) => t.enabled).length || 0;
    const diversityBonus = Math.min(tacticsEnabled / 4, 1) * 0.2;

    // Calculate overall fitness
    const fitness = Math.min(1, baseSuccessRate + diversityBonus + Math.random() * 0.1);

    return {
      ...genome,
      fitness_score: fitness,
    };
  });
}

function tournamentSelection(genomes: any[], pressure: number): any[] {
  const tournamentSize = Math.max(2, Math.floor(genomes.length * pressure));
  const survivorCount = Math.max(2, Math.floor(genomes.length * 0.5));
  const survivors: any[] = [];

  while (survivors.length < survivorCount && genomes.length > 0) {
    // Random tournament
    const tournament = [];
    for (let i = 0; i < Math.min(tournamentSize, genomes.length); i++) {
      const idx = Math.floor(Math.random() * genomes.length);
      tournament.push(genomes[idx]);
    }

    // Select winner
    tournament.sort((a, b) => b.fitness_score - a.fitness_score);
    const winner = tournament[0];
    if (!survivors.find(s => s.id === winner.id)) {
      survivors.push(winner);
    }
  }

  return survivors;
}

function performCrossover(parents: any[], userId: string): any[] {
  const offspring: any[] = [];

  for (let i = 0; i < parents.length - 1; i += 2) {
    const parent1 = parents[i];
    const parent2 = parents[i + 1];

    // Single-point crossover for strategy DNA
    const crossoverPoint = Math.random();
    const childDna = {
      aggression: crossoverPoint > 0.5 ? parent1.strategy_dna?.aggression : parent2.strategy_dna?.aggression,
      persistence: crossoverPoint > 0.5 ? parent2.strategy_dna?.persistence : parent1.strategy_dna?.persistence,
      adaptability: crossoverPoint > 0.5 ? parent1.strategy_dna?.adaptability : parent2.strategy_dna?.adaptability,
      timing_sensitivity: crossoverPoint > 0.5 ? parent2.strategy_dna?.timing_sensitivity : parent1.strategy_dna?.timing_sensitivity,
    };

    // Uniform crossover for tactics
    const childTactics = parent1.tactics_genes?.map((t: any, idx: number) => {
      const otherParent = parent2.tactics_genes?.[idx];
      return Math.random() > 0.5 ? t : (otherParent || t);
    }) || [];

    offspring.push({
      user_id: userId,
      genome_name: `Offspring_${Date.now()}_${i}`,
      parent_genome_id: parent1.id,
      strategy_dna: childDna,
      tactics_genes: childTactics,
      timing_patterns: Math.random() > 0.5 ? parent1.timing_patterns : parent2.timing_patterns,
      channel_weights: Math.random() > 0.5 ? parent1.channel_weights : parent2.channel_weights,
      fitness_score: 0,
      survival_count: 0,
      mutation_history: [{ type: 'crossover', timestamp: new Date().toISOString(), effect: 0 }],
      is_active: true,
    });
  }

  return offspring;
}

function applyMutations(genomes: any[], mutationRate: number): any[] {
  return genomes.map(genome => {
    const mutations: any[] = [...(genome.mutation_history || [])];

    // Mutate strategy DNA
    if (Math.random() < mutationRate) {
      const genes = ['aggression', 'persistence', 'adaptability', 'timing_sensitivity'];
      const geneToMutate = genes[Math.floor(Math.random() * genes.length)];
      const oldValue = genome.strategy_dna?.[geneToMutate] || 0.5;
      const newValue = Math.min(1, Math.max(0, oldValue + (Math.random() - 0.5) * 0.2));
      genome.strategy_dna = { ...genome.strategy_dna, [geneToMutate]: newValue };
      mutations.push({ type: `mutate_${geneToMutate}`, timestamp: new Date().toISOString(), effect: newValue - oldValue });
    }

    // Mutate tactics
    if (Math.random() < mutationRate && genome.tactics_genes) {
      const tacticIdx = Math.floor(Math.random() * genome.tactics_genes.length);
      genome.tactics_genes[tacticIdx] = {
        ...genome.tactics_genes[tacticIdx],
        weight: Math.min(1, Math.max(0, genome.tactics_genes[tacticIdx].weight + (Math.random() - 0.5) * 0.2)),
      };
      mutations.push({ type: 'mutate_tactic_weight', timestamp: new Date().toISOString(), effect: 0 });
    }

    return { ...genome, mutation_history: mutations };
  });
}

function calculateDiversity(genomes: any[]): number {
  if (genomes.length < 2) return 0;

  // Calculate diversity based on strategy DNA variance
  const aggValues = genomes.map(g => g.strategy_dna?.aggression || 0);
  const variance = calculateVariance(aggValues);
  return Math.min(1, variance * 4); // Normalize
}

function calculateVariance(values: number[]): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
}

function countMutations(genomes: any[]): Array<{ type: string; count: number }> {
  const counts: Record<string, number> = {};
  for (const genome of genomes) {
    for (const mutation of genome.mutation_history || []) {
      counts[mutation.type] = (counts[mutation.type] || 0) + 1;
    }
  }
  return Object.entries(counts).map(([type, count]) => ({ type, count }));
}
