/**
 * Mission Control Hook
 * Aggregates all AGIS Phase 2 operations for unified management
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ActiveOperation {
  id: string;
  type: 'negotiation' | 'nudge' | 'memory';
  title: string;
  target?: string;
  status: 'active' | 'paused' | 'pending' | 'completed';
  progress?: number;
  createdAt: string;
  updatedAt: string;
}

interface MissionStats {
  active: number;
  paused: number;
  pending: number;
  completed: number;
}

export function useMissionControl(profileId?: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [operations, setOperations] = useState<ActiveOperation[]>([]);
  const [stats, setStats] = useState<MissionStats>({
    active: 0,
    paused: 0,
    pending: 0,
    completed: 0
  });

  const fetchOperations = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const allOps: ActiveOperation[] = [];

      // Fetch negotiation sessions
      const { data: negotiations } = await supabase
        .from('negotiation_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (negotiations) {
        negotiations.forEach(n => {
          allOps.push({
            id: n.id,
            type: 'negotiation',
            title: n.session_type || 'Negotiation Session',
            target: n.profile_id || undefined,
            status: n.outcome ? 'completed' : 'active',
            createdAt: n.created_at || '',
            updatedAt: n.updated_at || ''
          });
        });
      }

      // Fetch nudge campaigns
      const { data: campaigns } = await supabase
        .from('nudge_campaigns')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (campaigns) {
        campaigns.forEach(c => {
          allOps.push({
            id: c.id,
            type: 'nudge',
            title: c.campaign_name || 'Nudge Campaign',
            target: c.target_behavior || undefined,
            status: c.is_active ? 'active' : 'paused',
            createdAt: c.created_at || '',
            updatedAt: c.updated_at || ''
          });
        });
      }

      // Fetch memory interventions
      const { data: interventions } = await supabase
        .from('memory_interventions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (interventions) {
        interventions.forEach(i => {
          allOps.push({
            id: i.id,
            type: 'memory',
            title: i.target_memory || 'Memory Intervention',
            target: i.profile_id || undefined,
            status: i.follow_up_required ? 'pending' : 'completed',
            createdAt: i.created_at || '',
            updatedAt: i.updated_at || ''
          });
        });
      }

      // Filter by profileId if provided
      const filteredOps = profileId 
        ? allOps.filter(op => op.target === profileId)
        : allOps;

      // Sort by updated date
      filteredOps.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

      setOperations(filteredOps);

      // Calculate stats
      setStats({
        active: filteredOps.filter(op => op.status === 'active').length,
        paused: filteredOps.filter(op => op.status === 'paused').length,
        pending: filteredOps.filter(op => op.status === 'pending').length,
        completed: filteredOps.filter(op => op.status === 'completed').length
      });

    } catch (error) {
      console.error('Failed to fetch operations:', error);
      toast.error('Failed to load operations');
    } finally {
      setIsLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    fetchOperations();
  }, [fetchOperations]);


  const pauseOperation = async (id: string, type: ActiveOperation['type']): Promise<boolean> => {
    try {
      const table = type === 'negotiation' 
        ? 'negotiation_sessions' 
        : type === 'nudge' 
          ? 'nudge_campaigns'
          : 'memory_interventions';

      const field = type === 'nudge' ? 'is_active' : 'status';
      const value = type === 'nudge' ? false : 'paused';

      const { error } = await supabase
        .from(table)
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      
      await fetchOperations();
      return true;
    } catch (error) {
      console.error('Failed to pause operation:', error);
      toast.error('Failed to pause operation');
      return false;
    }
  };

  const resumeOperation = async (id: string, type: ActiveOperation['type']): Promise<boolean> => {
    try {
      const table = type === 'negotiation' 
        ? 'negotiation_sessions' 
        : type === 'nudge' 
          ? 'nudge_campaigns'
          : 'memory_interventions';

      const field = type === 'nudge' ? 'is_active' : 'status';
      const value = type === 'nudge' ? true : 'active';

      const { error } = await supabase
        .from(table)
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      
      await fetchOperations();
      return true;
    } catch (error) {
      console.error('Failed to resume operation:', error);
      toast.error('Failed to resume operation');
      return false;
    }
  };

  const completeOperation = async (id: string, type: ActiveOperation['type']): Promise<boolean> => {
    try {
      const table = type === 'negotiation' 
        ? 'negotiation_sessions' 
        : type === 'nudge' 
          ? 'nudge_campaigns'
          : 'memory_interventions';

      const field = type === 'nudge' ? 'is_active' : 'status';
      const value = type === 'nudge' ? false : 'completed';

      const { error } = await supabase
        .from(table)
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      
      await fetchOperations();
      return true;
    } catch (error) {
      console.error('Failed to complete operation:', error);
      toast.error('Failed to complete operation');
      return false;
    }
  };

  return {
    isLoading,
    operations,
    stats,
    refreshOperations: fetchOperations,
    pauseOperation,
    resumeOperation,
    completeOperation
  };
}
