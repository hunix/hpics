/**
 * useCollectiveBehavior Hook (v9.0)
 * 
 * React hook for information epidemic modeling and collective behavior simulation.
 */

import { useState, useCallback, useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import {
  simulateEpidemic,
  predictBlastRadius,
  simulatePanicPropagation,
  calculateVaccinationStrategy,
  runMonteCarloSimulations,
  detectCoordinatedBehavior,
  type EpidemicModel,
  type NetworkNode,
  type NetworkEdge,
  type SimulationConfig,
  type SimulationResult,
  type BlastRadiusPrediction,
  type VaccinationStrategy,
} from '@/lib/collective/infoEpidemicModeler';

export interface CollectiveSimulationState {
  lastSimulation: SimulationResult | null;
  monteCarloResults: SimulationResult[] | null;
  blastRadius: BlastRadiusPrediction | null;
  vaccinationStrategy: VaccinationStrategy | null;
}

export function useCollectiveBehavior() {
  const { session } = useAuth();
  const userId = session?.user?.id;

  // Local state for simulation results
  const [state, setState] = useState<CollectiveSimulationState>({
    lastSimulation: null,
    monteCarloResults: null,
    blastRadius: null,
    vaccinationStrategy: null,
  });

  // Run single epidemic simulation
  const simulateMutation = useMutation({
    mutationFn: async ({
      nodes,
      edges,
      config,
    }: {
      nodes: NetworkNode[];
      edges: NetworkEdge[];
      config: SimulationConfig;
    }) => {
      const result = simulateEpidemic(nodes, edges, config);
      setState(prev => ({ ...prev, lastSimulation: result }));
      return result;
    },
  });

  // Run Monte Carlo simulations
  const monteCarloMutation = useMutation({
    mutationFn: async ({
      nodes,
      edges,
      config,
      numSimulations = 1000,
    }: {
      nodes: NetworkNode[];
      edges: NetworkEdge[];
      config: SimulationConfig;
      numSimulations?: number;
    }) => {
      const results = runMonteCarloSimulations(nodes, edges, config, numSimulations);
      
      // Calculate blast radius from results
      const blastRadius = predictBlastRadius(results.results, nodes.length);
      
      setState(prev => ({
        ...prev,
        monteCarloResults: results.results,
        blastRadius,
      }));
      
      return {
        ...results,
        blastRadius,
      };
    },
  });

  // Simulate panic propagation
  const panicMutation = useMutation({
    mutationFn: async ({
      nodes,
      edges,
      seedNodes,
      panicIntensity,
    }: {
      nodes: NetworkNode[];
      edges: NetworkEdge[];
      seedNodes: string[];
      panicIntensity: number;
    }) => {
      const result = simulatePanicPropagation(nodes, edges, seedNodes, panicIntensity);
      setState(prev => ({ ...prev, lastSimulation: result }));
      return result;
    },
  });

  // Calculate vaccination strategy
  const calculateVaccinationMutation = useMutation({
    mutationFn: async ({
      nodes,
      edges,
      budget,
      costPerVaccination,
    }: {
      nodes: NetworkNode[];
      edges: NetworkEdge[];
      budget: number;
      costPerVaccination: number;
    }) => {
      const strategy = calculateVaccinationStrategy(nodes, edges, budget, costPerVaccination);
      setState(prev => ({ ...prev, vaccinationStrategy: strategy }));
      return strategy;
    },
  });

  // Detect coordinated inauthentic behavior
  const detectCoordination = useCallback((
    activationTimes: Map<string, number>,
    edges: NetworkEdge[]
  ) => {
    return detectCoordinatedBehavior(activationTimes, edges);
  }, []);

  // Get spread metrics from last simulation
  const spreadMetrics = useMemo(() => {
    const sim = state.lastSimulation;
    if (!sim) return null;

    const finalStep = sim.steps[sim.steps.length - 1];
    
    return {
      totalReach: sim.finalReach,
      peakInfection: sim.peakInfection.count,
      peakTime: sim.peakInfection.step,
      r0: sim.r0Estimate,
      timeToSaturation: sim.timeToSaturation,
      superSpreaders: sim.criticalNodes.slice(0, 5),
      bottlenecks: sim.bottlenecks.slice(0, 5),
      finalSusceptible: finalStep?.susceptible || 0,
      finalRecovered: finalStep?.recovered || 0,
    };
  }, [state.lastSimulation]);

  // Confidence intervals from Monte Carlo
  const confidenceIntervals = useMemo(() => {
    const results = state.monteCarloResults;
    if (!results || results.length === 0) return null;

    const reaches = results.map(r => r.finalReach).sort((a, b) => a - b);
    const mean = reaches.reduce((a, b) => a + b, 0) / reaches.length;
    
    return {
      mean,
      p5: reaches[Math.floor(reaches.length * 0.05)],
      p25: reaches[Math.floor(reaches.length * 0.25)],
      p50: reaches[Math.floor(reaches.length * 0.50)],
      p75: reaches[Math.floor(reaches.length * 0.75)],
      p95: reaches[Math.floor(reaches.length * 0.95)],
      simulations: results.length,
    };
  }, [state.monteCarloResults]);

  return {
    // State
    state,
    
    // Simulations
    simulate: simulateMutation.mutateAsync,
    isSimulating: simulateMutation.isPending,
    
    runMonteCarlo: monteCarloMutation.mutateAsync,
    isRunningMonteCarlo: monteCarloMutation.isPending,
    
    simulatePanic: panicMutation.mutateAsync,
    isSimulatingPanic: panicMutation.isPending,
    
    calculateVaccination: calculateVaccinationMutation.mutateAsync,
    isCalculatingVaccination: calculateVaccinationMutation.isPending,
    
    // Analysis
    detectCoordination,
    
    // Computed
    spreadMetrics,
    confidenceIntervals,
    blastRadius: state.blastRadius,
    vaccinationStrategy: state.vaccinationStrategy,
  };
}
