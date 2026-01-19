/**
 * Intelligence Generation Hook v3.7.4
 * Handles pre-generation of intelligence data before PDF export
 * Now with 25+ intelligence tasks covering all 64 dossier sections
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { TaskResult } from '../sections/types';

interface IntelligenceTask {
  name: string;
  edgeFunction: string;
  analysisType?: string; // For checking if already exists in ai_analyses
  checkTable?: string;   // For checking other tables
  required: boolean;
  category: 'core' | 'psychological' | 'warfare' | 'fusion';
}

// Comprehensive task definitions covering all 64 sections
const ALL_INTELLIGENCE_TASKS: IntelligenceTask[] = [
  // Core Analysis (Priority 1)
  { name: 'MICE Vulnerability Analysis', edgeFunction: 'mice-recruitment-analyzer', checkTable: 'mice_assessments', required: true, category: 'core' },
  { name: 'Cialdini Influence Profile', edgeFunction: 'analyze-influence-profile', checkTable: 'contact_influence_profiles', required: true, category: 'core' },
  { name: 'Deep Intelligence Engine', edgeFunction: 'deep-intelligence-engine', analysisType: 'deep_intelligence', required: true, category: 'core' },
  { name: 'Trust Assessment', edgeFunction: 'assess-trust', checkTable: 'trust_assessments', required: true, category: 'core' },
  { name: 'Behavioral Analysis', edgeFunction: 'analyze-behavioral', checkTable: 'behavioral_analyses', required: true, category: 'core' },
  
  // Psychological Profiling (Priority 2)
  { name: 'Behavioral DNA Sequencer', edgeFunction: 'behavioral-dna-sequencer', analysisType: 'behavioral_dna', required: true, category: 'psychological' },
  { name: 'Sacred Values Mapper', edgeFunction: 'sacred-values-mapper', analysisType: 'sacred_values', required: true, category: 'psychological' },
  { name: 'Quantum Cognition Engine', edgeFunction: 'quantum-cognition-engine', analysisType: 'quantum_cognition', required: false, category: 'psychological' },
  { name: 'Dark Tetrad Profiler', edgeFunction: 'adversary-profiler', analysisType: 'dark_tetrad', required: false, category: 'psychological' },
  { name: 'Hypnotic Patterns Analyzer', edgeFunction: 'nlp-hypnotic-patterns', analysisType: 'hypnotic_patterns', required: false, category: 'psychological' },
  { name: 'Elicitation Guide Generator', edgeFunction: 'elicitation-engine', analysisType: 'elicitation_guide', required: false, category: 'psychological' },
  { name: 'Cognitive Load Analyzer', edgeFunction: 'behavioral-economics-engine', analysisType: 'cognitive_load', required: false, category: 'psychological' },
  { name: 'Attachment Vulnerability', edgeFunction: 'attachment-vulnerability-analyzer', analysisType: 'attachment_vulnerability', required: false, category: 'psychological' },
  { name: 'Trauma Exploitation Analysis', edgeFunction: 'trauma-exploitation-engine', analysisType: 'trauma_exploitation', required: false, category: 'psychological' },
  
  // Warfare & Influence (Priority 3)
  { name: 'Cognitive Warfare Engine', edgeFunction: 'cognitive-warfare-engine', analysisType: 'cognitive_warfare', required: false, category: 'warfare' },
  { name: 'Reality Consensus Engine', edgeFunction: 'reality-consensus-engine', analysisType: 'reality_testing', required: false, category: 'warfare' },
  { name: 'Identity Destabilization', edgeFunction: 'identity-destabilization-engine', analysisType: 'identity_destabilization', required: false, category: 'warfare' },
  { name: 'Semantic Warfare Engine', edgeFunction: 'semantic-warfare-engine', analysisType: 'semantic_warfare', required: false, category: 'warfare' },
  { name: 'Memetic Propagation', edgeFunction: 'memetic-propagation-engine', analysisType: 'memetic_propagation', required: false, category: 'warfare' },
  { name: 'Narrative Control Engine', edgeFunction: 'narrative-control-engine', analysisType: 'narrative_control', required: false, category: 'warfare' },
  { name: 'Choice Architecture', edgeFunction: 'choice-architecture-optimizer', analysisType: 'choice_architecture', required: false, category: 'warfare' },
  { name: 'Influence Resistance Profile', edgeFunction: 'manipulation-vulnerability-assessment', analysisType: 'influence_resistance', required: false, category: 'warfare' },
  { name: 'Betrayal Predictor', edgeFunction: 'betrayal-likelihood-scorer', analysisType: 'betrayal_prediction', required: false, category: 'warfare' },
  { name: 'Counter-Intelligence Monitor', edgeFunction: 'counter-intelligence-monitor', analysisType: 'counter_intel', required: false, category: 'warfare' },
  
  // Data Fusion & Synthesis (Priority 4)
  { name: 'Cross-Modal Synthesis', edgeFunction: 'cross-modal-synthesis-v2', analysisType: 'cross_modal_synthesis', required: false, category: 'fusion' },
  { name: 'Precognitive Pattern Engine', edgeFunction: 'precognitive-pattern-engine', analysisType: 'precognitive_patterns', required: false, category: 'fusion' },
  { name: 'Temporal Fusion Transformer', edgeFunction: 'temporal-fusion-transformer', analysisType: 'temporal_fusion', required: false, category: 'fusion' },
  { name: 'Behavioral Digital Twin', edgeFunction: 'behavioral-digital-twin', analysisType: 'digital_twin', required: false, category: 'fusion' },
  { name: 'Pattern-of-Life Engine', edgeFunction: 'pattern-of-life-engine', analysisType: 'pattern_of_life', required: false, category: 'fusion' },
  { name: 'Graph RAG Intelligence', edgeFunction: 'graph-rag-engine', analysisType: 'graph_rag', required: false, category: 'fusion' },
  { name: 'Power Network Analyzer', edgeFunction: 'power-network-analyzer', analysisType: 'network_position', required: false, category: 'fusion' },
  { name: 'Shadow Network Analyzer', edgeFunction: 'detect-shadow-networks', analysisType: 'shadow_networks', required: false, category: 'fusion' },
  { name: 'Influence Orchestrator', edgeFunction: 'influence-orchestrator-v2', analysisType: 'influence_operations', required: false, category: 'fusion' },
  { name: 'Generate Playbook', edgeFunction: 'generate-playbook', analysisType: 'playbook', required: false, category: 'fusion' },
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

  const generateFullIntelligence = useCallback(async (
    profileId: string,
    forceRefresh: boolean = false
  ) => {
    if (!profileId) {
      toast.error('Please select a contact first');
      return;
    }

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
      const tasksToRun: { task: IntelligenceTask; status: 'pending' | 'skipped' }[] = [];

      if (forceRefresh) {
        // Run all tasks
        tasksToRun.push(...ALL_INTELLIGENCE_TASKS.map(task => ({ task, status: 'pending' as const })));
      } else {
        // Check which tasks need to run
        const existenceChecks = await Promise.all(
          ALL_INTELLIGENCE_TASKS.map(async (task) => ({
            task,
            exists: await checkExistingAnalysis(profileId, task),
          }))
        );

        for (const { task, exists } of existenceChecks) {
          if (exists) {
            tasksToRun.push({ task, status: 'skipped' as const });
          } else {
            tasksToRun.push({ task, status: 'pending' as const });
          }
        }
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
      let taskIndex = 0;

      // Execute pending tasks sequentially with progress tracking
      for (const { task, status } of tasksToRun) {
        if (status === 'skipped') {
          taskIndex++;
          continue;
        }

        // Update status to running
        setTaskResults(prev => prev.map((t, idx) =>
          idx === taskIndex ? { ...t, status: 'running' as const } : t
        ));

        try {
          const result = await supabase.functions.invoke(task.edgeFunction, {
            body: { profileId, userId, analysisDepth: 'comprehensive' },
          });

          if (result.error) {
            throw new Error(result.error.message || 'Task failed');
          }

          completedCount++;
          setTaskResults(prev => prev.map((t, idx) =>
            idx === taskIndex ? { ...t, status: 'success' as const } : t
          ));
        } catch (err) {
          failedCount++;
          const { message, canRetry } = parseErrorMessage(err);
          setTaskResults(prev => prev.map((t, idx) =>
            idx === taskIndex ? { ...t, status: 'failed' as const, error: message, canRetry } : t
          ));
        }

        taskIndex++;
        setIntelProgress(Math.round((taskIndex / tasksToRun.length) * 100));

        // Small delay between tasks to prevent rate limiting
        if (taskIndex < tasksToRun.length) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      // Summary toast
      if (failedCount === 0 && completedCount > 0) {
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

    try {
      const result = await supabase.functions.invoke(task.edgeFunction, {
        body: { profileId, userId, analysisDepth: 'comprehensive' },
      });

      if (result.error) throw new Error(result.error.message);

      setTaskResults(prev => prev.map(t =>
        t.name === taskName ? { ...t, status: 'success' as const, error: undefined, canRetry: true } : t
      ));
      toast.success(`${taskName} completed`);
    } catch (err) {
      const { message, canRetry } = parseErrorMessage(err);
      setTaskResults(prev => prev.map(t =>
        t.name === taskName ? { ...t, status: 'failed' as const, error: message, canRetry } : t
      ));
      toast.error(`${taskName} failed: ${message}`);
    }
  }, []);

  return {
    isGeneratingIntel,
    intelProgress,
    taskResults,
    generateFullIntelligence,
    retryTask,
    totalTasks: ALL_INTELLIGENCE_TASKS.length,
  };
}
