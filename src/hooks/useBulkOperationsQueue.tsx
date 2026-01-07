import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface BulkOperationProgress {
  total: number;
  completed: number;
  failed: number;
  status: 'idle' | 'running' | 'completed' | 'error';
  currentBatch: number;
  totalBatches: number;
}

const BATCH_SIZE = 50;

export function useBulkDeleteContacts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<BulkOperationProgress>({
    total: 0,
    completed: 0,
    failed: 0,
    status: 'idle',
    currentBatch: 0,
    totalBatches: 0,
  });

  const deleteRelatedData = async (ids: string[]) => {
    // Delete in order of dependencies
    const tables = [
      'ai_analyses',
      'behavioral_analyses',
      'body_language_analyses',
      'facial_analyses',
      'vocal_analyses',
      'certifications',
      'communications',
      'contact_bank_accounts',
      'contact_biometrics',
      'contact_communication_preferences',
      'contact_devices',
      'contact_financial_history',
      'contact_graduations',
      'contact_group_members',
      'contact_identity_documents',
      'contact_interaction_notes',
      'contact_interests',
      'contact_kids_schools',
      'contact_languages',
      'contact_methods',
      'contact_observations',
      'contact_payment_accounts',
      'contact_personal_info',
      'contact_properties',
      'contact_residences',
      'contact_skills',
      'contact_travel_history',
      'contact_vehicles',
      'contact_activity_feed',
      'cross_references',
      'documents',
      'education',
      'events',
      'gift_ideas',
      'life_milestones',
      'media',
      'meeting_recordings',
      'relationship_goals',
      'shared_experiences',
      'trust_assessments',
      'analysis_sessions',
      'behavioral_anomalies',
      'behavioral_baselines',
    ];

    // Delete related data in parallel batches
    for (let i = 0; i < tables.length; i += 5) {
      const batch = tables.slice(i, i + 5);
      await Promise.all(
        batch.map(table => 
          supabase.from(table as any).delete().in('profile_id', ids).then(() => {})
        )
      );
    }

    // Handle relationships separately (both directions)
    await supabase.from('contact_relationships').delete().in('from_profile_id', ids);
    await supabase.from('contact_relationships').delete().in('to_profile_id', ids);

    // Delete conversations and their messages
    const { data: conversations } = await supabase
      .from('conversations')
      .select('id')
      .in('profile_id', ids);
    
    if (conversations && conversations.length > 0) {
      const convIds = conversations.map(c => c.id);
      await supabase.from('messages').delete().in('conversation_id', convIds);
      await supabase.from('conversations').delete().in('id', convIds);
    }
  };

  const mutation = useMutation({
    mutationFn: async (ids: string[]) => {
      if (!user?.id) throw new Error('No user');
      
      const totalBatches = Math.ceil(ids.length / BATCH_SIZE);
      setProgress({
        total: ids.length,
        completed: 0,
        failed: 0,
        status: 'running',
        currentBatch: 0,
        totalBatches,
      });

      let completed = 0;
      let failed = 0;

      for (let i = 0; i < ids.length; i += BATCH_SIZE) {
        const batch = ids.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        
        setProgress(prev => ({
          ...prev,
          currentBatch: batchNum,
        }));

        try {
          // Delete related data first
          await deleteRelatedData(batch);
          
          // Then delete profiles
          const { error } = await supabase
            .from('profiles')
            .delete()
            .in('id', batch);
          
          if (error) throw error;
          
          completed += batch.length;
        } catch (error) {
          console.error(`Batch ${batchNum} failed:`, error);
          failed += batch.length;
        }

        setProgress(prev => ({
          ...prev,
          completed,
          failed,
        }));
      }

      setProgress(prev => ({
        ...prev,
        status: failed > 0 ? 'error' : 'completed',
      }));

      return { completed, failed };
    },
    onSuccess: ({ completed, failed }) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['server-contacts'] });
      queryClient.invalidateQueries({ queryKey: ['paginated-contacts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['storage-summary'] });
      
      if (failed > 0) {
        toast.warning(`Deleted ${completed} contacts, ${failed} failed`);
      } else {
        toast.success(`Successfully deleted ${completed} contacts`);
      }
    },
    onError: (error) => {
      setProgress(prev => ({ ...prev, status: 'error' }));
      toast.error('Bulk delete failed: ' + (error as Error).message);
    },
  });

  const reset = useCallback(() => {
    setProgress({
      total: 0,
      completed: 0,
      failed: 0,
      status: 'idle',
      currentBatch: 0,
      totalBatches: 0,
    });
  }, []);

  return {
    deleteContacts: mutation.mutate,
    progress,
    isDeleting: mutation.isPending,
    reset,
  };
}

// Hook for bulk updating contacts
export function useBulkUpdateContacts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<BulkOperationProgress>({
    total: 0,
    completed: 0,
    failed: 0,
    status: 'idle',
    currentBatch: 0,
    totalBatches: 0,
  });

  const mutation = useMutation({
    mutationFn: async ({ ids, updates }: { ids: string[]; updates: Record<string, any> }) => {
      if (!user?.id) throw new Error('No user');
      
      const totalBatches = Math.ceil(ids.length / BATCH_SIZE);
      setProgress({
        total: ids.length,
        completed: 0,
        failed: 0,
        status: 'running',
        currentBatch: 0,
        totalBatches,
      });

      let completed = 0;
      let failed = 0;

      for (let i = 0; i < ids.length; i += BATCH_SIZE) {
        const batch = ids.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        
        setProgress(prev => ({
          ...prev,
          currentBatch: batchNum,
        }));

        try {
          const { error } = await supabase
            .from('profiles')
            .update(updates)
            .in('id', batch);
          
          if (error) throw error;
          
          completed += batch.length;
        } catch (error) {
          console.error(`Batch ${batchNum} failed:`, error);
          failed += batch.length;
        }

        setProgress(prev => ({
          ...prev,
          completed,
          failed,
        }));
      }

      setProgress(prev => ({
        ...prev,
        status: failed > 0 ? 'error' : 'completed',
      }));

      return { completed, failed };
    },
    onSuccess: ({ completed, failed }) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['server-contacts'] });
      queryClient.invalidateQueries({ queryKey: ['paginated-contacts'] });
      
      if (failed > 0) {
        toast.warning(`Updated ${completed} contacts, ${failed} failed`);
      } else {
        toast.success(`Successfully updated ${completed} contacts`);
      }
    },
    onError: (error) => {
      setProgress(prev => ({ ...prev, status: 'error' }));
      toast.error('Bulk update failed: ' + (error as Error).message);
    },
  });

  const reset = useCallback(() => {
    setProgress({
      total: 0,
      completed: 0,
      failed: 0,
      status: 'idle',
      currentBatch: 0,
      totalBatches: 0,
    });
  }, []);

  return {
    updateContacts: mutation.mutate,
    progress,
    isUpdating: mutation.isPending,
    reset,
  };
}
