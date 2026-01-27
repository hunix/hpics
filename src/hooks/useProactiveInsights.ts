// Hook for managing proactive insights with full validation
import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type InsightPriority = 'low' | 'medium' | 'high' | 'critical';
export type InsightStatus = 'pending' | 'viewed' | 'acted' | 'dismissed' | 'snoozed';

export interface ProactiveInsight {
  id: string;
  insight_type: string;
  title: string;
  description?: string;
  priority: InsightPriority;
  category: string;
  profile_id?: string;
  action_type?: string;
  action_data?: Record<string, unknown>;
  status: InsightStatus;
  snoozed_until?: string;
  generated_at: string;
  expires_at?: string;
  created_at: string;
}

export interface InsightFilters {
  priority?: InsightPriority[];
  status?: InsightStatus[];
  category?: string;
  profileId?: string;
}

export function useProactiveInsights(filters?: InsightFilters) {
  const { user } = useAuth();
  const [insights, setInsights] = useState<ProactiveInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchInsights = useCallback(async (limit = 50) => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('proactive_insights')
        .select('*')
        .eq('user_id', user.id)
        .order('generated_at', { ascending: false })
        .limit(limit);

      if (filters?.priority?.length) {
        query = query.in('priority', filters.priority);
      }
      if (filters?.status?.length) {
        query = query.in('status', filters.status);
      }
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.profileId) {
        query = query.eq('profile_id', filters.profileId);
      }

      const { data, error: queryError } = await query;

      if (!isMountedRef.current) return;
      if (queryError) throw new Error(queryError.message);

      setInsights(data as ProactiveInsight[]);
    } catch (err) {
      if (!isMountedRef.current) return;
      setError(err instanceof Error ? err.message : 'Failed to fetch insights');
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [user?.id, filters]);

  const updateStatus = useCallback(async (
    insightId: string,
    status: InsightStatus,
    snoozeDuration?: number
  ): Promise<boolean> => {
    if (!user?.id) return false;

    const updateData: Record<string, unknown> = { status };
    
    if (status === 'snoozed' && snoozeDuration) {
      const snoozeUntil = new Date();
      snoozeUntil.setMinutes(snoozeUntil.getMinutes() + snoozeDuration);
      updateData.snoozed_until = snoozeUntil.toISOString();
    }

    try {
      const { error } = await supabase
        .from('proactive_insights')
        .update(updateData)
        .eq('id', insightId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setInsights(prev => 
        prev.map(i => i.id === insightId ? { ...i, ...updateData } as ProactiveInsight : i)
      );
      return true;
    } catch {
      return false;
    }
  }, [user?.id]);

  const dismissInsight = useCallback((id: string) => updateStatus(id, 'dismissed'), [updateStatus]);
  const markAsViewed = useCallback((id: string) => updateStatus(id, 'viewed'), [updateStatus]);
  const markAsActed = useCallback((id: string) => updateStatus(id, 'acted'), [updateStatus]);
  const snoozeInsight = useCallback((id: string, mins: number) => updateStatus(id, 'snoozed', mins), [updateStatus]);

  const generateInsights = useCallback(async (profileId?: string): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase.functions.invoke('generate-proactive-insights', {
        body: { profileId },
      });

      if (error) throw error;
      
      toast.success('Insights generated');
      fetchInsights();
      return true;
    } catch {
      toast.error('Failed to generate insights');
      return false;
    }
  }, [user?.id, fetchInsights]);

  const getCounts = useCallback(() => ({
    critical: insights.filter(i => i.priority === 'critical' && i.status === 'pending').length,
    high: insights.filter(i => i.priority === 'high' && i.status === 'pending').length,
    medium: insights.filter(i => i.priority === 'medium' && i.status === 'pending').length,
    low: insights.filter(i => i.priority === 'low' && i.status === 'pending').length,
    total: insights.filter(i => i.status === 'pending').length,
  }), [insights]);

  useEffect(() => { fetchInsights(); }, [fetchInsights]);

  return {
    insights,
    isLoading,
    error,
    counts: getCounts(),
    fetchInsights,
    dismissInsight,
    markAsViewed,
    markAsActed,
    snoozeInsight,
    generateInsights,
  };
}
