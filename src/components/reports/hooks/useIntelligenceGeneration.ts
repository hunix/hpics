/**
 * Intelligence Generation Hook
 * Handles pre-generation of intelligence data before PDF export
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { TaskResult } from '../sections/types';

export function useIntelligenceGeneration() {
  const [isGeneratingIntel, setIsGeneratingIntel] = useState(false);
  const [intelProgress, setIntelProgress] = useState(0);
  const [taskResults, setTaskResults] = useState<TaskResult[]>([]);

  const generateFullIntelligence = useCallback(async (profileId: string) => {
    if (!profileId) {
      toast.error('Please select a contact first');
      return;
    }

    setIsGeneratingIntel(true);
    setIntelProgress(0);
    setTaskResults([]);

    try {
      // Check what's missing
      const [miceExists, influenceExists, deepIntelExists, behavioralDnaExists, sacredValuesExists] = await Promise.all([
        supabase.from('mice_assessments').select('id').eq('profile_id', profileId).maybeSingle(),
        supabase.from('contact_influence_profiles').select('id').eq('profile_id', profileId).maybeSingle(),
        supabase.from('ai_analyses').select('id').eq('profile_id', profileId).eq('analysis_type', 'deep_intelligence').maybeSingle(),
        supabase.from('ai_analyses').select('id').eq('profile_id', profileId).eq('analysis_type', 'behavioral_dna').maybeSingle(),
        supabase.from('ai_analyses').select('id').eq('profile_id', profileId).eq('analysis_type', 'sacred_values').maybeSingle(),
      ]);

      const tasks: { name: string; fn: () => Promise<any>; required: boolean }[] = [];
      
      if (!miceExists.data) {
        tasks.push({
          name: 'MICE Vulnerability Analysis',
          fn: () => supabase.functions.invoke('mice-recruitment-analyzer', { body: { profileId, analysisDepth: 'comprehensive' } }),
          required: true,
        });
      }
      
      if (!influenceExists.data) {
        tasks.push({
          name: 'Cialdini Influence Profile',
          fn: () => supabase.functions.invoke('analyze-influence-profile', { body: { profileId } }),
          required: true,
        });
      }
      
      if (!deepIntelExists.data) {
        tasks.push({
          name: 'Deep Intelligence Engine',
          fn: () => supabase.functions.invoke('deep-intelligence-engine', { body: { profileId } }),
          required: true,
        });
      }
      
      if (!behavioralDnaExists.data) {
        tasks.push({
          name: 'Behavioral DNA Sequencer',
          fn: () => supabase.functions.invoke('behavioral-dna-sequencer', { body: { profileId } }),
          required: false,
        });
      }
      
      if (!sacredValuesExists.data) {
        tasks.push({
          name: 'Sacred Values Mapper',
          fn: () => supabase.functions.invoke('sacred-values-mapper', { body: { profileId } }),
          required: false,
        });
      }

      // Always run these for latest data
      tasks.push({
        name: 'Cross-Modal Synthesis',
        fn: () => supabase.functions.invoke('cross-modal-synthesis-v2', { body: { profileId } }),
        required: false,
      });
      
      tasks.push({
        name: 'Precognitive Pattern Engine',
        fn: () => supabase.functions.invoke('precognitive-pattern-engine', { body: { profileId } }),
        required: false,
      });

      // Data Fusion Engines
      tasks.push({
        name: 'Temporal Fusion Transformer',
        fn: () => supabase.functions.invoke('temporal-fusion-transformer', { body: { profileId } }),
        required: false,
      });
      
      tasks.push({
        name: 'Behavioral Digital Twin',
        fn: () => supabase.functions.invoke('behavioral-digital-twin', { body: { profileId } }),
        required: false,
      });
      
      tasks.push({
        name: 'Pattern-of-Life Engine',
        fn: () => supabase.functions.invoke('pattern-of-life-engine', { body: { profileId } }),
        required: false,
      });

      if (tasks.length === 0) {
        toast.info('All intelligence already generated');
        setIsGeneratingIntel(false);
        return;
      }

      // Initialize task results
      setTaskResults(tasks.map(t => ({ name: t.name, status: 'pending' as const })));

      let completedCount = 0;
      let failedCount = 0;
      const failedTasks: string[] = [];

      // Execute tasks sequentially with progress tracking
      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        
        // Update status to running
        setTaskResults(prev => prev.map((t, idx) => 
          idx === i ? { ...t, status: 'running' as const } : t
        ));

        try {
          const result = await task.fn();
          
          if (result.error) {
            throw new Error(result.error.message || 'Task failed');
          }
          
          completedCount++;
          setTaskResults(prev => prev.map((t, idx) => 
            idx === i ? { ...t, status: 'success' as const } : t
          ));
        } catch (err) {
          failedCount++;
          failedTasks.push(task.name);
          setTaskResults(prev => prev.map((t, idx) => 
            idx === i ? { ...t, status: 'failed' as const, error: err instanceof Error ? err.message : 'Unknown error' } : t
          ));
        }
        
        setIntelProgress(Math.round(((i + 1) / tasks.length) * 100));
        
        // Small delay between tasks to prevent rate limiting
        if (i < tasks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      if (failedCount === 0) {
        toast.success(`Intelligence package complete: ${completedCount} tasks`);
      } else if (completedCount > 0) {
        toast.warning(`Completed ${completedCount}/${tasks.length} tasks. ${failedCount} failed.`);
      } else {
        toast.error('Intelligence generation failed');
      }
    } catch (err) {
      console.error('[IntelligenceGeneration] Error:', err);
      toast.error('Failed to generate intelligence package');
    } finally {
      setIsGeneratingIntel(false);
    }
  }, []);

  const retryTask = useCallback(async (taskName: string, profileId: string) => {
    const taskFunctions: Record<string, () => Promise<any>> = {
      'MICE Vulnerability Analysis': () => supabase.functions.invoke('mice-recruitment-analyzer', { body: { profileId, analysisDepth: 'comprehensive' } }),
      'Cialdini Influence Profile': () => supabase.functions.invoke('analyze-influence-profile', { body: { profileId } }),
      'Deep Intelligence Engine': () => supabase.functions.invoke('deep-intelligence-engine', { body: { profileId } }),
      'Behavioral DNA Sequencer': () => supabase.functions.invoke('behavioral-dna-sequencer', { body: { profileId } }),
      'Sacred Values Mapper': () => supabase.functions.invoke('sacred-values-mapper', { body: { profileId } }),
      'Cross-Modal Synthesis': () => supabase.functions.invoke('cross-modal-synthesis-v2', { body: { profileId } }),
      'Precognitive Pattern Engine': () => supabase.functions.invoke('precognitive-pattern-engine', { body: { profileId } }),
      'Temporal Fusion Transformer': () => supabase.functions.invoke('temporal-fusion-transformer', { body: { profileId } }),
      'Behavioral Digital Twin': () => supabase.functions.invoke('behavioral-digital-twin', { body: { profileId } }),
      'Pattern-of-Life Engine': () => supabase.functions.invoke('pattern-of-life-engine', { body: { profileId } }),
    };

    const fn = taskFunctions[taskName];
    if (!fn) {
      toast.error('Unknown task');
      return;
    }

    setTaskResults(prev => prev.map(t => 
      t.name === taskName ? { ...t, status: 'running' as const, error: undefined } : t
    ));

    try {
      const result = await fn();
      if (result.error) throw new Error(result.error.message);
      
      setTaskResults(prev => prev.map(t => 
        t.name === taskName ? { ...t, status: 'success' as const } : t
      ));
      toast.success(`${taskName} completed`);
    } catch (err) {
      setTaskResults(prev => prev.map(t => 
        t.name === taskName ? { ...t, status: 'failed' as const, error: err instanceof Error ? err.message : 'Unknown error' } : t
      ));
      toast.error(`${taskName} failed`);
    }
  }, []);

  return {
    isGeneratingIntel,
    intelProgress,
    taskResults,
    generateFullIntelligence,
    retryTask,
  };
}
