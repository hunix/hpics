import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ScanSession {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  stages_completed: string[];
  total_stages: number;
  started_at: string | null;
  completed_at: string | null;
  results_summary: any;
  cost_cents: number;
  error_message: string | null;
  device_type: string;
}

const SCAN_STAGES = [
  'profile', 'psychological', 'behavioral', 'cross-modal', 'network',
  'preferences', 'trust', 'influence', 'risks', 'dossier'
];

export function useComprehensiveScan(profileId: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Fetch active/latest scan session
  const { data: scanSession, refetch: refetchSession } = useQuery({
    queryKey: ['comprehensive-scan', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comprehensive_scan_sessions')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data as ScanSession | null;
    },
    enabled: !!profileId && !!user,
    refetchInterval: (query) => {
      const data = query.state.data as ScanSession | null;
      // Poll every 2 seconds while scanning
      return data?.status === 'running' ? 2000 : false;
    },
  });

  // Calculate derived state
  const isScanning = scanSession?.status === 'running';
  const stagesCompleted = (scanSession?.stages_completed || []) as string[];
  const progress = (stagesCompleted.length / SCAN_STAGES.length) * 100;
  const currentStageIndex = stagesCompleted.length;
  const currentStage = isScanning && currentStageIndex < SCAN_STAGES.length 
    ? SCAN_STAGES[currentStageIndex] 
    : null;
  const lastScan = scanSession?.completed_at || null;
  const totalCost = scanSession?.cost_cents || 0;
  const error = scanSession?.error_message || null;

  // Estimate cost based on typical usage
  const estimatedCost = 50; // ~$0.50 for full scan

  // Start scan mutation
  const startMutation = useMutation({
    mutationFn: async (deviceType: 'mobile' | 'desktop') => {
      const { data, error } = await supabase.functions.invoke('comprehensive-contact-scan', {
        body: { 
          profileId, 
          deviceType,
          action: 'start'
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setCurrentSessionId(data.sessionId);
      toast({
        title: 'Intelligence Scan Started',
        description: 'Running all analysis modules...',
      });
      refetchSession();
    },
    onError: (error: any) => {
      toast({
        title: 'Scan Failed',
        description: error.message || 'Failed to start scan',
        variant: 'destructive',
      });
    },
  });

  // Cancel scan mutation
  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!currentSessionId && !scanSession?.id) return;
      
      const { error } = await supabase
        .from('comprehensive_scan_sessions')
        .update({ status: 'cancelled' })
        .eq('id', currentSessionId || scanSession?.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Scan Cancelled',
        description: 'Intelligence scan has been stopped.',
      });
      refetchSession();
    },
  });

  const startScan = useCallback((deviceType: 'mobile' | 'desktop' = 'desktop') => {
    startMutation.mutate(deviceType);
  }, [startMutation]);

  const cancelScan = useCallback(() => {
    cancelMutation.mutate();
  }, [cancelMutation]);

  // Invalidate related queries when scan completes
  useEffect(() => {
    if (scanSession?.status === 'completed') {
      queryClient.invalidateQueries({ queryKey: ['contact-preferences', profileId] });
      queryClient.invalidateQueries({ queryKey: ['ai-analyses', profileId] });
      queryClient.invalidateQueries({ queryKey: ['psych-profile', profileId] });
      queryClient.invalidateQueries({ queryKey: ['influence-profile', profileId] });
      queryClient.invalidateQueries({ queryKey: ['trust-assessment', profileId] });
    }
  }, [scanSession?.status, profileId, queryClient]);

  return {
    isScanning,
    progress,
    currentStage,
    stagesCompleted,
    lastScan,
    estimatedCost,
    totalCost,
    error,
    startScan,
    cancelScan,
    isStarting: startMutation.isPending,
    isCancelling: cancelMutation.isPending,
  };
}
