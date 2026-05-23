// Hook for cross-contact pattern detection and management
import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { invokeFunction } from '@/lib/api';

export interface CrossContactPattern {
  id: string;
  pattern_type: string;
  title: string;
  description?: string;
  confidence_score: number;
  profiles_involved: string[];
  evidence: Record<string, unknown>;
  detected_at: string;
  expires_at?: string;
  is_active: boolean;
  created_at: string;
}

export function useCrossContactPatterns(profileId?: string) {
  const { user } = useAuth();
  const [patterns, setPatterns] = useState<CrossContactPattern[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPatterns = useCallback(async (limit = 100) => {
    if (!user?.id) return;

    setIsLoading(true);

    try {
      let query = supabase
        .from('cross_contact_patterns')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('confidence_score', { ascending: false })
        .limit(limit);

      if (profileId) {
        query = query.contains('profiles_involved', [profileId]);
      }

      const { data, error } = await query;

      if (!error && data) {
        setPatterns(data as CrossContactPattern[]);
      }
    } catch (err) {
      console.error('Failed to fetch patterns:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, profileId]);

  const deactivatePattern = useCallback(async (patternId: string): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from('cross_contact_patterns')
        .update({ is_active: false })
        .eq('id', patternId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setPatterns(prev => prev.filter(p => p.id !== patternId));
      toast.success('Pattern dismissed');
      return true;
    } catch {
      return false;
    }
  }, [user?.id]);

  const detectPatterns = useCallback(async (): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { error } = await invokeFunction('detect-cross-patterns');
      if (error) throw error;
      
      toast.success('Pattern detection completed');
      fetchPatterns();
      return true;
    } catch {
      toast.error('Failed to detect patterns');
      return false;
    }
  }, [user?.id, fetchPatterns]);

  const getStats = useCallback(() => ({
    total: patterns.length,
    avgConfidence: patterns.length > 0 
      ? patterns.reduce((sum, p) => sum + p.confidence_score, 0) / patterns.length 
      : 0,
    uniqueProfiles: new Set(patterns.flatMap(p => p.profiles_involved)).size,
  }), [patterns]);

  useEffect(() => { fetchPatterns(); }, [fetchPatterns]);

  return {
    patterns,
    isLoading,
    stats: getStats(),
    fetchPatterns,
    deactivatePattern,
    detectPatterns,
  };
}
