/**
 * Intelligence Generation Hook v8.0.0
 * Handles pre-generation of intelligence data before PDF export
 * 
 * v8.0.0: Updated to 94 total tasks across 14 priority groups
 * v6.0.0: Added v6.0, v7.0, v8.0 intelligence engines
 * v5.3.0: Added 9 new v5.0/v6.0 fusion engines
 * v5.2.0: Synced tasks with backend intelligence-session-runner
 * v3.7.7: Circuit breaker integration, health monitoring, background retry queue
 * v3.7.6: Enhanced reliability with retry logic, parallel batch execution, timeout handling
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { TaskResult } from '../sections/types';
import { getEdgeFunctionBreaker, CircuitOpenError, getOpenEdgeFunctionBreakers, getTimeUntilReset } from '@/lib/circuitBreaker';
import { edgeFunctionHealthMonitor, type FunctionHealthStats } from '@/lib/edgeFunctionHealthMonitor';
import { intelligenceRetryQueue } from '@/lib/intelligenceRetryQueue';

interface IntelligenceTask {
  name: string;
  edgeFunction: string;
  analysisType?: string;
  checkTable?: string;
  required: boolean;
  category: 'core' | 'psychological' | 'warfare' | 'fusion';
  priority: number; // Lower = higher priority
  dependsOn?: string[]; // Edge functions this task depends on
}

// Edge function invocation with retry and timeout
const INVOKE_TIMEOUT_MS = 45000; // 45 seconds per function
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1500;
const BATCH_SIZE = 3; // Parallel tasks per batch

/**
 * Invoke edge function with retry, timeout, circuit breaker, and health monitoring
 */
async function invokeWithRetry(
  edgeFunction: string, 
  body: Record<string, unknown>,
  retries = MAX_RETRIES
): Promise<{ data: unknown; error: Error | null }> {
  const breaker = getEdgeFunctionBreaker(edgeFunction);
  const startTime = Date.now();
  let lastError: Error | null = null;
  
  // Check if circuit is open
  const breakerStats = breaker.getStats();
  if (breakerStats.state === 'open') {
    const timeUntil = getTimeUntilReset(edgeFunction);
    return { 
      data: null, 
      error: new CircuitOpenError(`Circuit open for ${edgeFunction}, retry in ${Math.ceil(timeUntil / 1000)}s`) 
    };
  }
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await breaker.execute(async () => {
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), INVOKE_TIMEOUT_MS);
        
        try {
          const response = await supabase.functions.invoke(edgeFunction, {
            body,
          });
          
          clearTimeout(timeoutId);
          
          if (response.error) {
            throw new Error(response.error.message || 'Edge function error');
          }
          
          return response.data;
        } catch (err) {
          clearTimeout(timeoutId);
          throw err;
        }
      });
      
      // Success - record in health monitor
      const responseTime = Date.now() - startTime;
      edgeFunctionHealthMonitor.recordSuccess(edgeFunction, responseTime);
      
      return { data: result, error: null };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const responseTime = Date.now() - startTime;
      
      // Record failure in health monitor
      edgeFunctionHealthMonitor.recordFailure(edgeFunction, responseTime, lastError.message);
      
      // Don't retry on circuit open errors
      if (err instanceof CircuitOpenError) {
        break;
      }
      
      // Don't retry on non-retryable errors
      const msg = lastError.message.toLowerCase();
      if (msg.includes('not found') || msg.includes('404') || msg.includes('auth')) {
        break;
      }
      
      // Wait before retry with exponential backoff
      if (attempt < retries) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  return { data: null, error: lastError };
}

// Comprehensive task definitions - SYNCED with backend intelligence-session-runner (85 tasks)
const ALL_INTELLIGENCE_TASKS: IntelligenceTask[] = [
  // Core Intelligence (Priority 1) - 5 tasks
  { name: 'MICE Assessment', edgeFunction: 'mice-recruitment-analyzer', analysisType: 'full_assessment', required: true, category: 'core', priority: 1 },
  { name: 'Behavioral DNA', edgeFunction: 'behavioral-dna-sequencer', analysisType: 'full_sequence', required: true, category: 'core', priority: 1 },
  { name: 'Attachment Vulnerability', edgeFunction: 'attachment-vulnerability-analyzer', analysisType: 'comprehensive', required: true, category: 'core', priority: 1 },
  { name: 'Manipulation Susceptibility', edgeFunction: 'manipulation-vulnerability-assessment', analysisType: 'full_assessment', required: true, category: 'core', priority: 1 },
  { name: 'Phobia Exploitation', edgeFunction: 'phobia-exploitation-engine', analysisType: 'full_analysis', required: true, category: 'core', priority: 1 },
  
  // Psychological Operations (Priority 2) - 6 tasks
  { name: 'Cognitive Warfare', edgeFunction: 'cognitive-warfare-engine', analysisType: 'full_analysis', required: false, category: 'psychological', priority: 2 },
  { name: 'Trauma Exploitation', edgeFunction: 'trauma-exploitation-engine', analysisType: 'full_mapping', required: false, category: 'psychological', priority: 2 },
  { name: 'Deception Detection', edgeFunction: 'enhanced-deception-detector', analysisType: 'full_analysis', required: false, category: 'psychological', priority: 2 },
  { name: 'Influence Profile', edgeFunction: 'analyze-influence-profile', analysisType: 'full_plan', required: false, category: 'psychological', priority: 2 },
  { name: 'Coercion Resistance', edgeFunction: 'coercion-resistance-assessor', analysisType: 'full_assessment', required: false, category: 'psychological', priority: 2 },
  { name: 'Existential Leverage', edgeFunction: 'existential-leverage-calculator', analysisType: 'full_analysis', required: false, category: 'psychological', priority: 2 },
  
  // Advanced Warfare (Priority 3) - 6 tasks
  { name: 'Memetic Propagation', edgeFunction: 'memetic-propagation-engine', analysisType: 'vulnerability_scan', required: false, category: 'warfare', priority: 3 },
  { name: 'Reality Consensus', edgeFunction: 'reality-consensus-engine', analysisType: 'map_anchors', required: false, category: 'warfare', priority: 3 },
  { name: 'Mass Formation', edgeFunction: 'mass-formation-analyzer', analysisType: 'full_analysis', required: false, category: 'warfare', priority: 3 },
  { name: 'Narrative Control', edgeFunction: 'narrative-control-engine', analysisType: 'full_analysis', required: false, category: 'warfare', priority: 3 },
  { name: 'Predictive Behavior', edgeFunction: 'predict-behavioral-scenarios', analysisType: 'full_prediction', required: false, category: 'warfare', priority: 3 },
  { name: 'Precognitive Patterns', edgeFunction: 'precognitive-pattern-engine', analysisType: 'full_analysis', required: false, category: 'warfare', priority: 3 },
  
  // Network Intelligence (Priority 4) - 4 tasks
  { name: 'Network Graph', edgeFunction: 'analyze-network-graph', analysisType: 'full_map', required: false, category: 'fusion', priority: 4 },
  { name: 'Power Network', edgeFunction: 'power-network-analyzer', analysisType: 'full_analysis', required: false, category: 'fusion', priority: 4 },
  { name: 'Relationship Trajectory', edgeFunction: 'predict-relationship-trajectory', analysisType: 'full_analysis', required: false, category: 'fusion', priority: 4 },
  { name: 'Network Exploitation', edgeFunction: 'network-exploitation-mapper', analysisType: 'full_map', required: false, category: 'fusion', priority: 4 },
  
  // Temporal & Quantum (Priority 5) - 4 tasks
  { name: 'Temporal Fusion', edgeFunction: 'temporal-fusion-transformer', analysisType: 'full_analysis', required: false, category: 'fusion', priority: 5 },
  { name: 'Quantum Cognition', edgeFunction: 'quantum-cognition-engine', analysisType: 'superposition', required: false, category: 'fusion', priority: 5 },
  { name: 'Morphic Resonance', edgeFunction: 'morphic-resonance-detector', analysisType: 'network', required: false, category: 'fusion', priority: 5 },
  { name: 'Omega Point Tracking', edgeFunction: 'omega-point-tracker', analysisType: 'full_calculation', required: false, category: 'fusion', priority: 5 },
  
  // Fusion Intelligence (Priority 6) - 5 tasks
  { name: 'Mosaic Intelligence', edgeFunction: 'mosaic-intelligence-fuser', analysisType: 'full_fusion', required: false, category: 'fusion', priority: 6 },
  { name: 'Unified Data Fusion', edgeFunction: 'unified-data-fusion', analysisType: 'full_unification', required: false, category: 'fusion', priority: 6 },
  { name: 'Omniscient Orchestrator', edgeFunction: 'omniscient-orchestrator', analysisType: 'full_synthesis', required: false, category: 'fusion', priority: 6 },
  { name: 'Intelligence Dossier', edgeFunction: 'generate-intelligence-dossier', analysisType: 'full_dossier', required: false, category: 'fusion', priority: 6 },
  { name: 'Aggregate Intelligence', edgeFunction: 'aggregate-media-intelligence', analysisType: 'full_aggregation', required: false, category: 'fusion', priority: 6 },
  
  // Defense Operations (Priority 7) - 10 new warfare tasks (v5.0)
  { name: 'OPSEC Vulnerability', edgeFunction: 'opsec-vulnerability-analyzer', analysisType: 'opsec_assessment', required: false, category: 'warfare', priority: 7 },
  { name: 'Social Engineering', edgeFunction: 'social-engineering-detector', analysisType: 'social_engineering', required: false, category: 'warfare', priority: 7 },
  { name: 'Crisis Response', edgeFunction: 'crisis-response-orchestrator', analysisType: 'crisis_response', required: false, category: 'warfare', priority: 7 },
  { name: 'Lawfare Defense', edgeFunction: 'lawfare-defense-analyzer', analysisType: 'lawfare_defense', required: false, category: 'warfare', priority: 7 },
  { name: 'Reputation Defense', edgeFunction: 'reputation-defense-engine', analysisType: 'reputation_defense', required: false, category: 'warfare', priority: 7 },
  { name: 'Behavioral Baseline', edgeFunction: 'behavioral-baseline-monitor', analysisType: 'behavioral_baseline', required: false, category: 'warfare', priority: 7 },
  { name: 'Family Protection', edgeFunction: 'family-protection-analyzer', analysisType: 'family_protection', required: false, category: 'warfare', priority: 7 },
  { name: 'Economic Warfare', edgeFunction: 'economic-warfare-detector', analysisType: 'economic_warfare', required: false, category: 'warfare', priority: 7 },
  { name: 'TSCM Sweep', edgeFunction: 'tscm-sweep-analyzer', analysisType: 'tscm_sweep', required: false, category: 'warfare', priority: 7 },
  { name: 'Digital Footprint', edgeFunction: 'digital-footprint-scanner', analysisType: 'digital_footprint', required: false, category: 'warfare', priority: 7 },
  
  // Advanced Fusion Intelligence (Priority 8) - 4 v5.0 tasks
  { name: 'Biometric-Behavioral Fusion', edgeFunction: 'biometric-behavioral-fusion', analysisType: 'biometric_behavioral_fusion', required: false, category: 'fusion', priority: 8 },
  { name: 'Geospatial-Communication Fusion', edgeFunction: 'geospatial-communication-fusion', analysisType: 'geospatial_communication_fusion', required: false, category: 'fusion', priority: 8 },
  { name: 'Financial-Document Synthesis', edgeFunction: 'financial-document-synthesis', analysisType: 'financial_document_synthesis', required: false, category: 'fusion', priority: 8 },
  { name: 'Calendar Pattern Analyzer', edgeFunction: 'calendar-pattern-analyzer', analysisType: 'calendar_pattern', required: false, category: 'fusion', priority: 8 },
  
  // Advanced Intelligence Systems (Priority 9) - 5 v6.0 tasks
  { name: 'Relationship Half-Life', edgeFunction: 'relationship-half-life-calculator', analysisType: 'relationship_half_life', required: false, category: 'fusion', priority: 9 },
  { name: 'Automated Red Team', edgeFunction: 'automated-red-team-engine', analysisType: 'automated_red_team', required: false, category: 'warfare', priority: 9 },
  { name: 'Multi-Party Deception', edgeFunction: 'multi-party-deception-detector', analysisType: 'multi_party_deception', required: false, category: 'warfare', priority: 9 },
  { name: 'Zero-Day Anomaly', edgeFunction: 'zero-day-anomaly-detector', analysisType: 'zero_day_anomaly', required: false, category: 'fusion', priority: 9 },
  { name: 'Hypergame Theory', edgeFunction: 'hypergame-theory-engine', analysisType: 'hypergame_theory', required: false, category: 'fusion', priority: 9 },
  
  // v7.0 Extreme Intelligence Engines (Priority 10) - 12 tasks
  { name: 'Subvocalization Detection', edgeFunction: 'subvocalization-detector', analysisType: 'subvocalization_detection', required: false, category: 'fusion', priority: 10 },
  { name: 'Audio Burst Analysis', edgeFunction: 'audio-burst-analyzer', analysisType: 'audio_burst_mental_state', required: false, category: 'fusion', priority: 10 },
  { name: 'IIO Attribution', edgeFunction: 'iio-attribution-engine', analysisType: 'iio_attribution', required: false, category: 'warfare', priority: 10 },
  { name: 'Reflexive Control', edgeFunction: 'reflexive-control-detector', analysisType: 'reflexive_control', required: false, category: 'warfare', priority: 10 },
  { name: 'Cognitive Effect', edgeFunction: 'cognitive-effect-orchestrator', analysisType: 'cognitive_effect', required: false, category: 'warfare', priority: 10 },
  { name: 'Theory of Mind', edgeFunction: 'kallisti-theory-of-mind', analysisType: 'adversary_mental_model', required: false, category: 'fusion', priority: 10 },
  { name: 'Collective Behavior', edgeFunction: 'collective-behavior-predictor', analysisType: 'collective_behavior', required: false, category: 'fusion', priority: 10 },
  { name: 'Stylometric Analysis', edgeFunction: 'stylometric-analyzer', analysisType: 'stylometric_fingerprint', required: false, category: 'fusion', priority: 10 },
  { name: 'Dark2Clear', edgeFunction: 'dark2clear-deanonymization', analysisType: 'surface_identity_bridge', required: false, category: 'fusion', priority: 10 },
  { name: 'Gated Bio Fusion', edgeFunction: 'gated-biological-fusion', analysisType: 'gated_bio_fusion', required: false, category: 'fusion', priority: 10 },
  { name: 'TAS-Com Community', edgeFunction: 'tas-com-community-detector', analysisType: 'tas_com_community', required: false, category: 'fusion', priority: 10 },
  { name: 'Biometric Retention', edgeFunction: 'migration5-biometric-tracker', analysisType: 'biometric_retention', required: false, category: 'fusion', priority: 10 },
  
  // v8.0 Masterpiece Counter-Intelligence (Priority 11) - 8 tasks
  { name: 'Draco Deception Orchestrator', edgeFunction: 'draco-deception-orchestrator', analysisType: 'draco_deception', required: false, category: 'warfare', priority: 11 },
  { name: 'Sentient Intent Analyzer', edgeFunction: 'sentient-intent-analyzer', analysisType: 'sentient_intent', required: false, category: 'fusion', priority: 11 },
  { name: 'Insider Threat Matrix', edgeFunction: 'insider-threat-matrix-engine', analysisType: 'insider_threat_matrix', required: false, category: 'warfare', priority: 11 },
  { name: 'Bayesian Intention Predictor', edgeFunction: 'bayesian-intention-predictor', analysisType: 'bayesian_intention', required: false, category: 'fusion', priority: 11 },
  { name: 'Red Team Adversary Simulator', edgeFunction: 'red-team-adversary-simulator', analysisType: 'red_team_simulation', required: false, category: 'warfare', priority: 11 },
  { name: 'SEMAFOR Forgery Detector', edgeFunction: 'semafor-forgery-detector', analysisType: 'semafor_forgery', required: false, category: 'fusion', priority: 11 },
  { name: 'Epistemic Vulnerability Scanner', edgeFunction: 'epistemic-vulnerability-scanner', analysisType: 'epistemic_vulnerability', required: false, category: 'fusion', priority: 11 },
  { name: 'Cognitive IW Detector', edgeFunction: 'cognitive-iw-detector', analysisType: 'cognitive_iw', required: false, category: 'warfare', priority: 11 },
  
  // v8.0 Psychological Warfare (Priority 12) - 10 tasks
  { name: 'Psychoagent Cascade Predictor', edgeFunction: 'psychoagent-cascade-predictor', analysisType: 'psychoagent_cascade', required: false, category: 'psychological', priority: 12 },
  { name: 'Affective Manipulation Detector', edgeFunction: 'affective-manipulation-detector', analysisType: 'affective_manipulation', required: false, category: 'psychological', priority: 12 },
  { name: 'Hyperpersonalization Engine', edgeFunction: 'hyperpersonalization-engine', analysisType: 'hyperpersonalization', required: false, category: 'psychological', priority: 12 },
  { name: 'Computational Persuasion', edgeFunction: 'computational-persuasion-engine', analysisType: 'computational_persuasion', required: false, category: 'psychological', priority: 12 },
  { name: 'Synthetic Memory Generator', edgeFunction: 'synthetic-memory-generator', analysisType: 'synthetic_memory', required: false, category: 'psychological', priority: 12 },
  { name: 'PreMem Belief Modifier', edgeFunction: 'premem-belief-modifier', analysisType: 'premem_belief', required: false, category: 'psychological', priority: 12 },
  { name: 'Linguistic Stress Detector', edgeFunction: 'linguistic-stress-detector', analysisType: 'linguistic_stress', required: false, category: 'psychological', priority: 12 },
  { name: 'Memory Anchor Generator', edgeFunction: 'memory-anchor-generator', analysisType: 'memory_anchor', required: false, category: 'psychological', priority: 12 },
  { name: 'Emotional Contagion Modeler', edgeFunction: 'emotional-contagion-modeler', analysisType: 'emotional_contagion', required: false, category: 'fusion', priority: 12 },
  { name: 'Sacred Value Predictor', edgeFunction: 'sacred-value-predictor', analysisType: 'sacred_value_prediction', required: false, category: 'psychological', priority: 12 },
  
  // v8.0 Biometric & Network (Priority 13) - 8 tasks
  { name: 'Pupillometry Analyzer', edgeFunction: 'pupillometry-analyzer', analysisType: 'pupillometry', required: false, category: 'fusion', priority: 13 },
  { name: 'Thermal Stress Detector', edgeFunction: 'thermal-stress-detector', analysisType: 'thermal_stress', required: false, category: 'fusion', priority: 13 },
  { name: 'Attention Multimodal Fuser', edgeFunction: 'attention-multimodal-fuser', analysisType: 'attention_multimodal', required: false, category: 'fusion', priority: 13 },
  { name: 'Keystroke Dynamics Analyzer', edgeFunction: 'keystroke-dynamics-analyzer', analysisType: 'keystroke_dynamics', required: false, category: 'fusion', priority: 13 },
  { name: 'Sheaf Neural Influence Mapper', edgeFunction: 'sheaf-neural-influence-mapper', analysisType: 'sheaf_influence', required: false, category: 'fusion', priority: 13 },
  { name: 'CTDG Link Predictor', edgeFunction: 'ctdg-link-predictor', analysisType: 'ctdg_link', required: false, category: 'fusion', priority: 13 },
  { name: 'Cascade Virality Predictor', edgeFunction: 'cascade-virality-predictor', analysisType: 'cascade_virality', required: false, category: 'fusion', priority: 13 },
  { name: 'Network Resilience Analyzer', edgeFunction: 'network-resilience-analyzer', analysisType: 'network_resilience', required: false, category: 'fusion', priority: 13 },
  
  // v8.0 Doctrine & Advanced (Priority 14) - 7 tasks
  { name: 'Gaze Pattern Analyzer', edgeFunction: 'gaze-pattern-analyzer', analysisType: 'gaze_pattern', required: false, category: 'fusion', priority: 14 },
  { name: 'Micro-Expression Timeline', edgeFunction: 'micro-expression-timeline', analysisType: 'micro_expression_timeline', required: false, category: 'fusion', priority: 14 },
  { name: 'Voice Stress Correlator', edgeFunction: 'voice-stress-correlator', analysisType: 'voice_stress_correlation', required: false, category: 'fusion', priority: 14 },
  { name: 'Social Graph Predictor', edgeFunction: 'social-graph-predictor', analysisType: 'social_graph_prediction', required: false, category: 'fusion', priority: 14 },
  { name: 'Influence Campaign Optimizer', edgeFunction: 'influence-campaign-optimizer', analysisType: 'influence_campaign_optimization', required: false, category: 'warfare', priority: 14 },
  { name: 'Counter-Narrative Generator', edgeFunction: 'counter-narrative-generator', analysisType: 'counter_narrative', required: false, category: 'warfare', priority: 14 },
  { name: 'Predictive Doctrine Engine', edgeFunction: 'predictive-doctrine-engine', analysisType: 'predictive_doctrine', required: false, category: 'warfare', priority: 14 },
];

/**
 * Parse error messages to provide user-friendly feedback
 */
function parseErrorMessage(error: unknown): { message: string; canRetry: boolean } {
  const errorStr = error instanceof Error ? error.message : String(error);
  
  // Circuit breaker errors
  if (error instanceof CircuitOpenError || errorStr.includes('Circuit open')) {
    const match = errorStr.match(/retry in (\d+)s/);
    const seconds = match ? match[1] : '60';
    return { message: `Paused (${seconds}s cooldown)`, canRetry: true };
  }
  
  // Known error patterns with user-friendly messages
  if (errorStr.includes('Insufficient data for cross-modal')) {
    return { message: 'Needs more media/voice data', canRetry: false };
  }
  if (errorStr.includes('No profile data found')) {
    return { message: 'No profile data available', canRetry: false };
  }
  if (errorStr.includes('rate limit') || errorStr.includes('429')) {
    return { message: 'Rate limited - try again in 1 min', canRetry: true };
  }
  if (errorStr.includes('timeout') || errorStr.includes('504')) {
    return { message: 'Request timed out', canRetry: true };
  }
  if (errorStr.includes('Authentication') || errorStr.includes('auth')) {
    return { message: 'Auth error - refresh page', canRetry: false };
  }
  if (errorStr.includes('not found') || errorStr.includes('404')) {
    return { message: 'Edge function not found', canRetry: false };
  }
  if (errorStr.includes('Insufficient') || errorStr.includes('No data')) {
    return { message: 'Insufficient data for analysis', canRetry: false };
  }
  if (errorStr.includes('500') || errorStr.includes('502') || errorStr.includes('503')) {
    return { message: 'Server error - will auto-retry', canRetry: true };
  }
  
  // Default: truncate long messages
  const truncated = errorStr.length > 50 ? errorStr.substring(0, 47) + '...' : errorStr;
  return { message: truncated, canRetry: true };
}

export function useIntelligenceGeneration() {
  const [isGeneratingIntel, setIsGeneratingIntel] = useState(false);
  const [intelProgress, setIntelProgress] = useState(0);
  const [taskResults, setTaskResults] = useState<TaskResult[]>([]);
  const [healthStats, setHealthStats] = useState<Map<string, FunctionHealthStats>>(new Map());
  const [queueStats, setQueueStats] = useState({ total: 0, ready: 0, waiting: 0, exhausted: 0 });
  const cancelRef = useRef(false);

  // Initialize retry queue with invoker
  useEffect(() => {
    intelligenceRetryQueue.setInvoker(async (edgeFunction, body) => {
      const result = await supabase.functions.invoke(edgeFunction, { body });
      if (result.error) throw new Error(result.error.message);
      return { data: result.data, error: null };
    });

    // Subscribe to health updates
    const unsubHealth = edgeFunctionHealthMonitor.subscribe(setHealthStats);
    
    // Subscribe to queue updates
    const unsubQueue = intelligenceRetryQueue.subscribe(() => {
      setQueueStats(intelligenceRetryQueue.getStats());
    });

    // Initial stats
    setQueueStats(intelligenceRetryQueue.getStats());

    return () => {
      unsubHealth();
      unsubQueue();
    };
  }, []);

  /**
   * Check if a specific analysis already exists
   */
  const checkExistingAnalysis = async (
    profileId: string,
    task: IntelligenceTask
  ): Promise<boolean> => {
    try {
      if (task.analysisType) {
        const { data } = await supabase
          .from('ai_analyses')
          .select('id')
          .eq('profile_id', profileId)
          .eq('analysis_type', task.analysisType)
          .maybeSingle();
        return !!data;
      }
      if (task.checkTable) {
        const { data } = await supabase
          .from(task.checkTable as any)
          .select('id')
          .eq('profile_id', profileId)
          .maybeSingle();
        return !!data;
      }
      return false;
    } catch {
      return false;
    }
  };

  /**
   * Execute a batch of tasks in parallel with circuit breaker protection
   */
  const executeBatch = async (
    tasks: { task: IntelligenceTask; index: number }[],
    profileId: string,
    userId: string
  ): Promise<{ index: number; success: boolean; error?: string; canRetry?: boolean; task: IntelligenceTask }[]> => {
    const results = await Promise.all(
      tasks.map(async ({ task, index }) => {
        if (cancelRef.current) {
          return { index, success: false, error: 'Cancelled', canRetry: false, task };
        }

        // Update to running
        setTaskResults(prev => prev.map((t, idx) =>
          idx === index ? { ...t, status: 'running' as const } : t
        ));

        const { data, error } = await invokeWithRetry(task.edgeFunction, {
          profileId,
          userId,
          analysisDepth: 'comprehensive',
        });

        if (error) {
          const parsed = parseErrorMessage(error);
          return { index, success: false, error: parsed.message, canRetry: parsed.canRetry, task };
        }

        return { index, success: true, task };
      })
    );

    return results;
  };

  const generateFullIntelligence = useCallback(async (
    profileId: string,
    forceRefresh: boolean = false
  ) => {
    if (!profileId) {
      toast.error('Please select a contact first');
      return;
    }

    // Check for open circuit breakers
    const openBreakers = getOpenEdgeFunctionBreakers();
    if (openBreakers.length > 3) {
      toast.warning(`${openBreakers.length} functions are in cooldown. Consider waiting before starting.`);
    }

    cancelRef.current = false;
    setIsGeneratingIntel(true);
    setIntelProgress(0);
    setTaskResults([]);

    try {
      // Get current user for edge function authentication
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Authentication required');
        setIsGeneratingIntel(false);
        return;
      }
      const userId = user.id;

      // Build task list - skip existing unless forceRefresh
      const tasksToRun: { task: IntelligenceTask; status: 'pending' | 'skipped'; index: number }[] = [];

      if (forceRefresh) {
        // Run all tasks
        tasksToRun.push(...ALL_INTELLIGENCE_TASKS.map((task, index) => ({ task, status: 'pending' as const, index })));
      } else {
        // Check which tasks need to run (parallel existence checks)
        const existenceChecks = await Promise.all(
          ALL_INTELLIGENCE_TASKS.map(async (task) => ({
            task,
            exists: await checkExistingAnalysis(profileId, task),
          }))
        );

        existenceChecks.forEach(({ task, exists }, index) => {
          tasksToRun.push({
            task,
            status: exists ? 'skipped' as const : 'pending' as const,
            index,
          });
        });
      }

      const pendingTasks = tasksToRun.filter(t => t.status === 'pending');
      const skippedCount = tasksToRun.filter(t => t.status === 'skipped').length;

      if (pendingTasks.length === 0) {
        toast.info(`All ${skippedCount} intelligence tasks already completed. Enable "Force re-analyze" to re-run.`);
        setIsGeneratingIntel(false);
        return;
      }

      // Initialize task results
      setTaskResults(tasksToRun.map(({ task, status }) => ({
        name: task.name,
        status: status,
        analysisType: task.analysisType,
        canRetry: status === 'pending',
      })));

      let completedCount = 0;
      let failedCount = 0;
      let processedCount = skippedCount; // Start from skipped count for progress

      // Group tasks by priority for batch execution
      const priorityGroups = new Map<number, { task: IntelligenceTask; index: number }[]>();
      for (const { task, status, index } of tasksToRun) {
        if (status === 'pending') {
          const priority = task.priority;
          if (!priorityGroups.has(priority)) {
            priorityGroups.set(priority, []);
          }
          priorityGroups.get(priority)!.push({ task, index });
        }
      }

      // Execute by priority group, with parallel execution within each group
      const sortedPriorities = Array.from(priorityGroups.keys()).sort((a, b) => a - b);

      for (const priority of sortedPriorities) {
        if (cancelRef.current) break;

        const groupTasks = priorityGroups.get(priority)!;
        
        // Execute in batches within priority group
        for (let i = 0; i < groupTasks.length; i += BATCH_SIZE) {
          if (cancelRef.current) break;

          const batch = groupTasks.slice(i, i + BATCH_SIZE);
          const results = await executeBatch(batch, profileId, userId);

          // Update results
          for (const result of results) {
            if (result.success) {
              completedCount++;
              setTaskResults(prev => prev.map((t, idx) =>
                idx === result.index ? { ...t, status: 'success' as const } : t
              ));
            } else {
              failedCount++;
              setTaskResults(prev => prev.map((t, idx) =>
                idx === result.index ? { 
                  ...t, 
                  status: 'failed' as const, 
                  error: result.error, 
                  canRetry: result.canRetry 
                } : t
              ));

              // Add to background retry queue if retryable
              if (result.canRetry && result.task) {
                intelligenceRetryQueue.enqueue({
                  taskName: result.task.name,
                  edgeFunction: result.task.edgeFunction,
                  profileId,
                  userId,
                  lastError: result.error || 'Unknown error',
                  priority: result.task.priority,
                });
              }
            }
            processedCount++;
          }

          setIntelProgress(Math.round((processedCount / tasksToRun.length) * 100));

          // Small delay between batches to prevent rate limiting
          if (i + BATCH_SIZE < groupTasks.length) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }

        // Delay between priority groups
        if (priority < sortedPriorities[sortedPriorities.length - 1]) {
          await new Promise(resolve => setTimeout(resolve, 800));
        }
      }

      // Summary toast
      if (cancelRef.current) {
        toast.info('Intelligence generation cancelled');
      } else if (failedCount === 0 && completedCount > 0) {
        toast.success(`Intelligence package complete: ${completedCount} tasks (${skippedCount} skipped)`);
      } else if (completedCount > 0) {
        const queuedMsg = failedCount > 0 ? ` ${failedCount} queued for background retry.` : '';
        toast.warning(`Completed ${completedCount}/${pendingTasks.length} tasks.${queuedMsg}`);
      } else if (failedCount > 0) {
        toast.error(`All ${failedCount} tasks failed. Queued for background retry.`);
      }
    } catch (err) {
      console.error('[IntelligenceGeneration] Error:', err);
      toast.error('Failed to generate intelligence package');
    } finally {
      setIsGeneratingIntel(false);
    }
  }, []);

  const cancelGeneration = useCallback(() => {
    cancelRef.current = true;
  }, []);

  const retryTask = useCallback(async (taskName: string, profileId: string) => {
    // Get current user for edge function authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Authentication required');
      return;
    }
    const userId = user.id;

    // Find the task definition
    const task = ALL_INTELLIGENCE_TASKS.find(t => t.name === taskName);
    if (!task) {
      toast.error('Unknown task');
      return;
    }

    // Check circuit breaker first
    const breaker = getEdgeFunctionBreaker(task.edgeFunction);
    if (breaker.getStats().state === 'open') {
      const timeUntil = getTimeUntilReset(task.edgeFunction);
      toast.warning(`${taskName} is in cooldown. Wait ${Math.ceil(timeUntil / 1000)}s before retrying.`);
      return;
    }

    setTaskResults(prev => prev.map(t =>
      t.name === taskName ? { ...t, status: 'running' as const, error: undefined } : t
    ));

    const { data, error } = await invokeWithRetry(task.edgeFunction, {
      profileId,
      userId,
      analysisDepth: 'comprehensive',
    });

    if (error) {
      const { message, canRetry } = parseErrorMessage(error);
      setTaskResults(prev => prev.map(t =>
        t.name === taskName ? { ...t, status: 'failed' as const, error: message, canRetry } : t
      ));
      toast.error(`${taskName} failed: ${message}`);
    } else {
      setTaskResults(prev => prev.map(t =>
        t.name === taskName ? { ...t, status: 'success' as const, error: undefined, canRetry: true } : t
      ));
      toast.success(`${taskName} completed`);
    }
  }, []);

  const retryAllFailed = useCallback(async (profileId: string) => {
    const failedTasks = taskResults.filter(t => t.status === 'failed' && t.canRetry);
    if (failedTasks.length === 0) {
      toast.info('No retryable failed tasks');
      return;
    }

    // Check how many are blocked by circuit breaker
    const openBreakers = getOpenEdgeFunctionBreakers();
    const blockedTasks = failedTasks.filter(t => {
      const task = ALL_INTELLIGENCE_TASKS.find(at => at.name === t.name);
      return task && openBreakers.includes(task.edgeFunction);
    });

    if (blockedTasks.length > 0) {
      toast.warning(`${blockedTasks.length} tasks are in cooldown and will be skipped`);
    }

    const retryableTasks = failedTasks.filter(t => {
      const task = ALL_INTELLIGENCE_TASKS.find(at => at.name === t.name);
      return task && !openBreakers.includes(task.edgeFunction);
    });

    if (retryableTasks.length === 0) {
      toast.info('All failed tasks are in cooldown. Try again later.');
      return;
    }

    toast.info(`Retrying ${retryableTasks.length} failed tasks...`);

    for (const task of retryableTasks) {
      await retryTask(task.name, profileId);
      // Small delay between retries
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }, [taskResults, retryTask]);

  /**
   * Get health status for a specific function
   */
  const getFunctionHealth = useCallback((edgeFunction: string): FunctionHealthStats | null => {
    return healthStats.get(edgeFunction) || null;
  }, [healthStats]);

  /**
   * Get overall system health
   */
  const getSystemHealth = useCallback(() => {
    const summary = edgeFunctionHealthMonitor.getSummary();
    const openBreakers = getOpenEdgeFunctionBreakers();
    return {
      ...summary,
      openCircuitBreakers: openBreakers.length,
      queuedRetries: queueStats.total,
      isHealthy: openBreakers.length < 3 && summary.unhealthy < 5,
    };
  }, [queueStats]);

  return {
    isGeneratingIntel,
    intelProgress,
    taskResults,
    generateFullIntelligence,
    retryTask,
    retryAllFailed,
    cancelGeneration,
    totalTasks: ALL_INTELLIGENCE_TASKS.length,
    // New reliability features
    healthStats,
    queueStats,
    getFunctionHealth,
    getSystemHealth,
    openCircuitBreakers: getOpenEdgeFunctionBreakers(),
  };
}
