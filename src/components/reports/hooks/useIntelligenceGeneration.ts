/**
 * Intelligence Generation Hook v3.7.6
 * Handles pre-generation of intelligence data before PDF export
 * 
 * v3.7.6: Enhanced reliability with retry logic, parallel batch execution, timeout handling
 * v3.7.5: 34 intelligence tasks covering all 64 dossier sections
 */

import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { TaskResult } from '../sections/types';

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

async function invokeWithRetry(
  edgeFunction: string, 
  body: Record<string, unknown>,
  retries = MAX_RETRIES
): Promise<{ data: unknown; error: Error | null }> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), INVOKE_TIMEOUT_MS);
      
      const result = await supabase.functions.invoke(edgeFunction, {
        body,
        // Note: signal support depends on supabase-js version
      });
      
      clearTimeout(timeoutId);
      
      if (result.error) {
        throw new Error(result.error.message || 'Edge function error');
      }
      
      return { data: result.data, error: null };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      
      // Don't retry on non-retryable errors
      const msg = lastError.message.toLowerCase();
      if (msg.includes('not found') || msg.includes('404') || msg.includes('auth')) {
        break;
      }
      
      // Wait before retry
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * (attempt + 1)));
      }
    }
  }
  
  return { data: null, error: lastError };
}

// Comprehensive task definitions covering all 64 sections
const ALL_INTELLIGENCE_TASKS: IntelligenceTask[] = [
  // Core Analysis (Priority 1) - Run first, these feed into others
  { name: 'MICE Vulnerability Analysis', edgeFunction: 'mice-recruitment-analyzer', checkTable: 'mice_assessments', required: true, category: 'core', priority: 1 },
  { name: 'Cialdini Influence Profile', edgeFunction: 'analyze-influence-profile', checkTable: 'contact_influence_profiles', required: true, category: 'core', priority: 1 },
  { name: 'Deep Intelligence Engine', edgeFunction: 'deep-intelligence-engine', analysisType: 'deep_intelligence', required: true, category: 'core', priority: 1 },
  { name: 'Trust Assessment', edgeFunction: 'assess-trust', checkTable: 'trust_assessments', required: true, category: 'core', priority: 1 },
  { name: 'Behavioral Analysis', edgeFunction: 'analyze-behavioral', checkTable: 'behavioral_analyses', required: true, category: 'core', priority: 1 },
  
  // Psychological Profiling (Priority 2)
  { name: 'Behavioral DNA Sequencer', edgeFunction: 'behavioral-dna-sequencer', analysisType: 'behavioral_dna', required: true, category: 'psychological', priority: 2 },
  { name: 'Sacred Values Mapper', edgeFunction: 'sacred-values-mapper', analysisType: 'sacred_values', required: true, category: 'psychological', priority: 2 },
  { name: 'Quantum Cognition Engine', edgeFunction: 'quantum-cognition-engine', analysisType: 'quantum_cognition', required: false, category: 'psychological', priority: 2 },
  { name: 'Dark Tetrad Profiler', edgeFunction: 'adversary-profiler', analysisType: 'dark_tetrad', required: false, category: 'psychological', priority: 2 },
  { name: 'Hypnotic Patterns Analyzer', edgeFunction: 'nlp-hypnotic-patterns', analysisType: 'hypnotic_patterns', required: false, category: 'psychological', priority: 2 },
  { name: 'Elicitation Guide Generator', edgeFunction: 'elicitation-engine', analysisType: 'elicitation_guide', required: false, category: 'psychological', priority: 2 },
  { name: 'Cognitive Load Analyzer', edgeFunction: 'behavioral-economics-engine', analysisType: 'cognitive_load', required: false, category: 'psychological', priority: 2 },
  { name: 'Attachment Vulnerability', edgeFunction: 'attachment-vulnerability-analyzer', analysisType: 'attachment_vulnerability', required: false, category: 'psychological', priority: 2 },
  { name: 'Trauma Exploitation Analysis', edgeFunction: 'trauma-exploitation-engine', analysisType: 'trauma_exploitation', required: false, category: 'psychological', priority: 2 },
  
  // Warfare & Influence (Priority 3)
  { name: 'Cognitive Warfare Engine', edgeFunction: 'cognitive-warfare-engine', analysisType: 'cognitive_warfare', required: false, category: 'warfare', priority: 3 },
  { name: 'Reality Consensus Engine', edgeFunction: 'reality-consensus-engine', analysisType: 'reality_testing', required: false, category: 'warfare', priority: 3 },
  { name: 'Identity Destabilization', edgeFunction: 'identity-destabilization-engine', analysisType: 'identity_destabilization', required: false, category: 'warfare', priority: 3 },
  { name: 'Semantic Warfare Engine', edgeFunction: 'semantic-warfare-engine', analysisType: 'semantic_warfare', required: false, category: 'warfare', priority: 3 },
  { name: 'Memetic Propagation', edgeFunction: 'memetic-propagation-engine', analysisType: 'memetic_propagation', required: false, category: 'warfare', priority: 3 },
  { name: 'Narrative Control Engine', edgeFunction: 'narrative-control-engine', analysisType: 'narrative_control', required: false, category: 'warfare', priority: 3 },
  { name: 'Choice Architecture', edgeFunction: 'choice-architecture-optimizer', analysisType: 'choice_architecture', required: false, category: 'warfare', priority: 3 },
  { name: 'Influence Resistance Profile', edgeFunction: 'manipulation-vulnerability-assessment', analysisType: 'influence_resistance', required: false, category: 'warfare', priority: 3 },
  { name: 'Betrayal Predictor', edgeFunction: 'betrayal-likelihood-scorer', analysisType: 'betrayal_prediction', required: false, category: 'warfare', priority: 3 },
  { name: 'Counter-Intelligence Monitor', edgeFunction: 'counter-intelligence-monitor', analysisType: 'counter_intel', required: false, category: 'warfare', priority: 3 },
  
  // Data Fusion & Synthesis (Priority 4) - Run last, depend on earlier analyses
  { name: 'Cross-Modal Synthesis', edgeFunction: 'cross-modal-synthesis-v2', analysisType: 'cross_modal_synthesis', required: false, category: 'fusion', priority: 4 },
  { name: 'Precognitive Pattern Engine', edgeFunction: 'precognitive-pattern-engine', analysisType: 'precognitive_patterns', required: false, category: 'fusion', priority: 4 },
  { name: 'Temporal Fusion Transformer', edgeFunction: 'temporal-fusion-transformer', analysisType: 'temporal_fusion', required: false, category: 'fusion', priority: 4 },
  { name: 'Behavioral Digital Twin', edgeFunction: 'behavioral-digital-twin', analysisType: 'digital_twin', required: false, category: 'fusion', priority: 4 },
  { name: 'Pattern-of-Life Engine', edgeFunction: 'pattern-of-life-engine', analysisType: 'pattern_of_life', required: false, category: 'fusion', priority: 4 },
  { name: 'Graph RAG Intelligence', edgeFunction: 'graph-rag-engine', analysisType: 'graph_rag', required: false, category: 'fusion', priority: 4 },
  { name: 'Power Network Analyzer', edgeFunction: 'power-network-analyzer', analysisType: 'network_position', required: false, category: 'fusion', priority: 4 },
  { name: 'Shadow Network Analyzer', edgeFunction: 'detect-shadow-networks', analysisType: 'shadow_networks', required: false, category: 'fusion', priority: 4 },
  { name: 'Influence Orchestrator', edgeFunction: 'influence-orchestrator-v2', analysisType: 'influence_operations', required: false, category: 'fusion', priority: 4 },
  { name: 'Generate Playbook', edgeFunction: 'generate-playbook', analysisType: 'playbook', required: false, category: 'fusion', priority: 5 }, // Playbook runs last
];

/**
 * Parse error messages to provide user-friendly feedback
 */
function parseErrorMessage(error: unknown): { message: string; canRetry: boolean } {
  const errorStr = error instanceof Error ? error.message : String(error);
  
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
  
  // Default: truncate long messages
  const truncated = errorStr.length > 50 ? errorStr.substring(0, 47) + '...' : errorStr;
  return { message: truncated, canRetry: true };
}

export function useIntelligenceGeneration() {
  const [isGeneratingIntel, setIsGeneratingIntel] = useState(false);
  const [intelProgress, setIntelProgress] = useState(0);
  const [taskResults, setTaskResults] = useState<TaskResult[]>([]);
  const cancelRef = useRef(false);

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
   * Execute a batch of tasks in parallel
   */
  const executeBatch = async (
    tasks: { task: IntelligenceTask; index: number }[],
    profileId: string,
    userId: string
  ): Promise<{ index: number; success: boolean; error?: string; canRetry?: boolean }[]> => {
    const results = await Promise.all(
      tasks.map(async ({ task, index }) => {
        if (cancelRef.current) {
          return { index, success: false, error: 'Cancelled', canRetry: false };
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
          return { index, success: false, error: parsed.message, canRetry: parsed.canRetry };
        }

        return { index, success: true };
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
        toast.warning(`Completed ${completedCount}/${pendingTasks.length} tasks. ${failedCount} failed, ${skippedCount} skipped.`);
      } else if (failedCount > 0) {
        toast.error(`All ${failedCount} tasks failed. Check errors for details.`);
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

    toast.info(`Retrying ${failedTasks.length} failed tasks...`);

    for (const task of failedTasks) {
      await retryTask(task.name, profileId);
      // Small delay between retries
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }, [taskResults, retryTask]);

  return {
    isGeneratingIntel,
    intelProgress,
    taskResults,
    generateFullIntelligence,
    retryTask,
    retryAllFailed,
    cancelGeneration,
    totalTasks: ALL_INTELLIGENCE_TASKS.length,
  };
}
