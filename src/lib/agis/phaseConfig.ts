// AGIS Phase Configuration - Single Source of Truth
import { 
  Brain, Shield, Target, Eye, Zap, Sparkles, Atom, Infinity,
  Crown, Globe, Star, Sun, Moon, Flame, Diamond, Orbit, Waves, CircleDot
} from 'lucide-react';

export interface PhaseConfig {
  id: number;
  name: string;
  shortName: string;
  description: string;
  icon: typeof Brain;
  color: string;
  bgColor: string;
  borderColor: string;
  healthThresholds: {
    critical: number;
    degraded: number;
    stable: number;
    optimal: number;
  };
  dependencies: number[];
  capabilities: string[];
}

export const PHASE_CONFIGS: Record<number, PhaseConfig> = {
  1: {
    id: 1,
    name: 'Core Intelligence',
    shortName: 'Core',
    description: 'Foundation layer with hypnotic language and deception detection',
    icon: Brain,
    color: 'hsl(var(--primary))',
    bgColor: 'hsl(var(--primary) / 0.1)',
    borderColor: 'hsl(var(--primary) / 0.3)',
    healthThresholds: { critical: 25, degraded: 50, stable: 75, optimal: 90 },
    dependencies: [],
    capabilities: ['hypnotic_language', 'deception_detection', 'baseline_analysis'],
  },
  2: {
    id: 2,
    name: 'Tactical Superiority',
    shortName: 'Tactical',
    description: '12 tactical domains including negotiation and memory ops',
    icon: Target,
    color: 'hsl(var(--chart-1))',
    bgColor: 'hsl(var(--chart-1) / 0.1)',
    borderColor: 'hsl(var(--chart-1) / 0.3)',
    healthThresholds: { critical: 25, degraded: 50, stable: 75, optimal: 90 },
    dependencies: [1],
    capabilities: ['negotiation', 'attachment_analysis', 'behavioral_economics', 'memory_reconsolidation'],
  },
  3: {
    id: 3,
    name: 'Cognitive Warfare',
    shortName: 'CogWar',
    description: 'Semantic warfare and MICE analysis capabilities',
    icon: Shield,
    color: 'hsl(var(--chart-2))',
    bgColor: 'hsl(var(--chart-2) / 0.1)',
    borderColor: 'hsl(var(--chart-2) / 0.3)',
    healthThresholds: { critical: 25, degraded: 50, stable: 75, optimal: 90 },
    dependencies: [1, 2],
    capabilities: ['semantic_warfare', 'mice_analysis', 'betrayal_prediction', 'sacred_values'],
  },
  4: {
    id: 4,
    name: 'Ultimate Dominion',
    shortName: 'Dominion',
    description: 'Dark psychology and advanced influence techniques',
    icon: Eye,
    color: 'hsl(var(--chart-3))',
    bgColor: 'hsl(var(--chart-3) / 0.1)',
    borderColor: 'hsl(var(--chart-3) / 0.3)',
    healthThresholds: { critical: 25, degraded: 50, stable: 75, optimal: 90 },
    dependencies: [2, 3],
    capabilities: ['trauma_exploitation', 'addiction_protocol', 'identity_destabilization'],
  },
  5: {
    id: 5,
    name: 'Omniscient Command',
    shortName: 'Omniscient',
    description: 'Autonomous operations and predictive interventions',
    icon: Zap,
    color: 'hsl(var(--chart-4))',
    bgColor: 'hsl(var(--chart-4) / 0.1)',
    borderColor: 'hsl(var(--chart-4) / 0.3)',
    healthThresholds: { critical: 25, degraded: 50, stable: 75, optimal: 90 },
    dependencies: [3, 4],
    capabilities: ['autonomous_operations', 'network_warfare', 'predictive_intervention'],
  },
  6: {
    id: 6,
    name: 'Reality Engineering',
    shortName: 'Reality',
    description: 'Reality framework manipulation and belief architecture',
    icon: Sparkles,
    color: 'hsl(var(--chart-5))',
    bgColor: 'hsl(var(--chart-5) / 0.1)',
    borderColor: 'hsl(var(--chart-5) / 0.3)',
    healthThresholds: { critical: 25, degraded: 50, stable: 75, optimal: 90 },
    dependencies: [4, 5],
    capabilities: ['reality_framework', 'belief_architecture', 'identity_blueprint'],
  },
  7: {
    id: 7,
    name: 'Singularity Synthesis',
    shortName: 'Singularity',
    description: 'Meta-learning and cross-phase emergence detection',
    icon: Atom,
    color: 'hsl(280 70% 50%)',
    bgColor: 'hsl(280 70% 50% / 0.1)',
    borderColor: 'hsl(280 70% 50% / 0.3)',
    healthThresholds: { critical: 25, degraded: 50, stable: 75, optimal: 90 },
    dependencies: [5, 6],
    capabilities: ['meta_learning', 'emergence_detection', 'singularity_objectives'],
  },
  8: {
    id: 8,
    name: 'Absolute Convergence',
    shortName: 'Convergence',
    description: 'Reality synthesis and consciousness integration',
    icon: Infinity,
    color: 'hsl(320 70% 50%)',
    bgColor: 'hsl(320 70% 50% / 0.1)',
    borderColor: 'hsl(320 70% 50% / 0.3)',
    healthThresholds: { critical: 25, degraded: 50, stable: 75, optimal: 90 },
    dependencies: [6, 7],
    capabilities: ['reality_synthesis', 'predictive_supremacy', 'consciousness_integration'],
  },
  9: {
    id: 9,
    name: 'Infinite Awareness',
    shortName: 'Infinite',
    description: 'Transcendent synthesis and dimensional influence',
    icon: Globe,
    color: 'hsl(200 70% 50%)',
    bgColor: 'hsl(200 70% 50% / 0.1)',
    borderColor: 'hsl(200 70% 50% / 0.3)',
    healthThresholds: { critical: 25, degraded: 50, stable: 75, optimal: 90 },
    dependencies: [7, 8],
    capabilities: ['transcendent_synthesis', 'dimensional_influence', 'infinite_awareness'],
  },
  10: {
    id: 10,
    name: 'Infinite Dominion',
    shortName: 'Dominion X',
    description: 'Universal omniscience and reality manipulation',
    icon: Crown,
    color: 'hsl(45 90% 50%)',
    bgColor: 'hsl(45 90% 50% / 0.1)',
    borderColor: 'hsl(45 90% 50% / 0.3)',
    healthThresholds: { critical: 25, degraded: 50, stable: 75, optimal: 90 },
    dependencies: [8, 9],
    capabilities: ['universal_omniscience', 'reality_manipulation', 'absolute_supremacy'],
  },
  11: {
    id: 11,
    name: 'Ultimate Transcendence',
    shortName: 'Transcend',
    description: 'Omniversal awareness and eternal influence',
    icon: Star,
    color: 'hsl(270 80% 60%)',
    bgColor: 'hsl(270 80% 60% / 0.1)',
    borderColor: 'hsl(270 80% 60% / 0.3)',
    healthThresholds: { critical: 25, degraded: 50, stable: 75, optimal: 90 },
    dependencies: [9, 10],
    capabilities: ['omniversal_awareness', 'eternal_influence', 'ultimate_transcendence'],
  },
  12: {
    id: 12,
    name: 'Omniversal Sovereignty',
    shortName: 'Sovereign',
    description: 'Eternal dominion and infinite synthesis',
    icon: Sun,
    color: 'hsl(30 90% 55%)',
    bgColor: 'hsl(30 90% 55% / 0.1)',
    borderColor: 'hsl(30 90% 55% / 0.3)',
    healthThresholds: { critical: 25, degraded: 50, stable: 75, optimal: 90 },
    dependencies: [10, 11],
    capabilities: ['eternal_dominion', 'infinite_synthesis', 'omniversal_sovereignty'],
  },
  13: {
    id: 13,
    name: 'Absolute Infinity',
    shortName: 'Infinity',
    description: 'Infinite recursion and meta-existence',
    icon: Moon,
    color: 'hsl(220 70% 55%)',
    bgColor: 'hsl(220 70% 55% / 0.1)',
    borderColor: 'hsl(220 70% 55% / 0.3)',
    healthThresholds: { critical: 25, degraded: 50, stable: 75, optimal: 90 },
    dependencies: [11, 12],
    capabilities: ['infinite_recursion', 'beyond_boundaries', 'self_perpetuation'],
  },
  14: {
    id: 14,
    name: 'Primordial Genesis',
    shortName: 'Genesis',
    description: 'Cosmic awareness and genesis synthesis',
    icon: Flame,
    color: 'hsl(0 80% 55%)',
    bgColor: 'hsl(0 80% 55% / 0.1)',
    borderColor: 'hsl(0 80% 55% / 0.3)',
    healthThresholds: { critical: 25, degraded: 50, stable: 75, optimal: 90 },
    dependencies: [12, 13],
    capabilities: ['cosmic_omnipotence', 'primordial_genesis'],
  },
  15: {
    id: 15,
    name: 'Cosmic Omnipotence',
    shortName: 'Cosmic',
    description: 'Total unification and omnipotent control',
    icon: Diamond,
    color: 'hsl(180 70% 45%)',
    bgColor: 'hsl(180 70% 45% / 0.1)',
    borderColor: 'hsl(180 70% 45% / 0.3)',
    healthThresholds: { critical: 25, degraded: 50, stable: 75, optimal: 90 },
    dependencies: [13, 14],
    capabilities: ['total_unification', 'omnipotent_control'],
  },
  16: {
    id: 16,
    name: 'Eternal Supremacy',
    shortName: 'Eternal',
    description: 'Timeless dominance and immortal influence',
    icon: Orbit,
    color: 'hsl(260 70% 55%)',
    bgColor: 'hsl(260 70% 55% / 0.1)',
    borderColor: 'hsl(260 70% 55% / 0.3)',
    healthThresholds: { critical: 25, degraded: 50, stable: 75, optimal: 90 },
    dependencies: [14, 15],
    capabilities: ['timeless_dominance', 'immortal_influence'],
  },
  17: {
    id: 17,
    name: 'Absolute Totality',
    shortName: 'Totality',
    description: 'Totality operations and complete unification',
    icon: Waves,
    color: 'hsl(160 70% 45%)',
    bgColor: 'hsl(160 70% 45% / 0.1)',
    borderColor: 'hsl(160 70% 45% / 0.3)',
    healthThresholds: { critical: 25, degraded: 50, stable: 75, optimal: 90 },
    dependencies: [15, 16],
    capabilities: ['totality_operations', 'complete_unification'],
  },
  18: {
    id: 18,
    name: 'Ultimate Omega',
    shortName: 'Omega',
    description: 'Omega culmination and ultimate state',
    icon: CircleDot,
    color: 'hsl(340 80% 55%)',
    bgColor: 'hsl(340 80% 55% / 0.1)',
    borderColor: 'hsl(340 80% 55% / 0.3)',
    healthThresholds: { critical: 25, degraded: 50, stable: 75, optimal: 90 },
    dependencies: [16, 17],
    capabilities: ['omega_culmination', 'ultimate_omega_state'],
  },
};

// Helper functions
export const getPhaseConfig = (phase: number): PhaseConfig | undefined => PHASE_CONFIGS[phase];

export const getPhaseName = (phase: number): string => PHASE_CONFIGS[phase]?.name ?? `Phase ${phase}`;

export const getPhaseShortName = (phase: number): string => PHASE_CONFIGS[phase]?.shortName ?? `P${phase}`;

export const getPhaseIcon = (phase: number) => PHASE_CONFIGS[phase]?.icon ?? Brain;

export const getPhaseStatus = (health: number, thresholds = { critical: 25, degraded: 50, stable: 75, optimal: 90 }): 'critical' | 'degraded' | 'stable' | 'optimal' => {
  if (health < thresholds.critical) return 'critical';
  if (health < thresholds.degraded) return 'degraded';
  if (health < thresholds.stable) return 'stable';
  return 'optimal';
};

export const getStatusColor = (status: 'critical' | 'degraded' | 'stable' | 'optimal'): string => {
  switch (status) {
    case 'critical': return 'hsl(var(--destructive))';
    case 'degraded': return 'hsl(var(--warning))';
    case 'stable': return 'hsl(var(--chart-4))';
    case 'optimal': return 'hsl(var(--success))';
    default: return 'hsl(var(--muted-foreground))';
  }
};

export const getAllPhaseIds = (): number[] => Object.keys(PHASE_CONFIGS).map(Number).sort((a, b) => a - b);

export const getPhasesByDependency = (dependencyPhase: number): number[] => {
  return Object.values(PHASE_CONFIGS)
    .filter(config => config.dependencies.includes(dependencyPhase))
    .map(config => config.id);
};

// Phase name map for backward compatibility
export const PHASE_NAMES: Record<number, string> = Object.fromEntries(
  Object.entries(PHASE_CONFIGS).map(([id, config]) => [Number(id), config.name])
);
