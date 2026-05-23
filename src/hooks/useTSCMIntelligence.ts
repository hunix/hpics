import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { TSCMSweep, ThreatLevel } from '@/types/hardware';
import { invokeFunction } from '@/lib/api';

interface TSCMFinding {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location?: { lat: number; lng: number };
  frequency?: number;
  confidence: number;
  recommendation: string;
}

interface SweepParams {
  sweep_name?: string;
  location_name: string;
  location?: { lat: number; lng: number };
  sweep_type: 'rf' | 'thermal' | 'nljd' | 'visual' | 'acoustic' | 'comprehensive';
  devices: string[];
  mission_id?: string;
}

interface ThreatProtocol {
  name: string;
  steps: string[];
}

export function useTSCMIntelligence() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeSweepId, setActiveSweepId] = useState<string | null>(null);

  // Fetch sweep history
  const { data: sweeps = [], isLoading, refetch } = useQuery<TSCMSweep[]>({
    queryKey: ['tscm-sweeps', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('tscm_sweeps')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []) as unknown as TSCMSweep[];
    },
    enabled: !!user?.id,
  });

  // Fetch threat protocols
  const { data: threatProtocols = {} } = useQuery<Record<string, ThreatProtocol>>({
    queryKey: ['tscm-threat-protocols'],
    queryFn: async () => {
      const { data, error } = await invokeFunction('tscm-intelligence/threat-protocols');
      if (error) throw error;
      return data.protocols || {};
    },
    staleTime: 24 * 60 * 60 * 1000,
  });

  // Start TSCM sweep
  const startSweep = useMutation({
    mutationFn: async (params: SweepParams) => {
      const { data, error } = await invokeFunction('tscm-intelligence/start-sweep', params,);
      if (error) throw error;
      return data.sweep;
    },
    onSuccess: (sweep) => {
      setActiveSweepId(sweep.id);
      toast.success('TSCM sweep initiated');
      queryClient.invalidateQueries({ queryKey: ['tscm-sweeps', user?.id] });
    },
    onError: (error) => {
      toast.error(`Failed to start sweep: ${error.message}`);
    },
  });

  // Add finding to active sweep
  const addFinding = useMutation({
    mutationFn: async ({ 
      sweepId, 
      findingType, 
      finding 
    }: { 
      sweepId: string; 
      findingType: 'rf' | 'thermal' | 'acoustic' | 'visual';
      finding: TSCMFinding;
    }) => {
      const { error } = await invokeFunction('tscm-intelligence/add-finding', { sweep_id: sweepId, finding_type: findingType, finding },);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.info('Finding recorded');
    },
    onError: (error) => {
      toast.error(`Failed to add finding: ${error.message}`);
    },
  });

  // Complete sweep
  const completeSweep = useMutation({
    mutationFn: async (sweepId: string) => {
      const { data, error } = await invokeFunction('tscm-intelligence/complete-sweep', { sweep_id: sweepId },);
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setActiveSweepId(null);
      const threatLevel = data.analysis?.threatLevel;
      if (threatLevel === 'critical' || threatLevel === 'high') {
        toast.error(`Sweep complete - ${threatLevel.toUpperCase()} threat level detected!`);
      } else {
        toast.success(`Sweep complete - ${threatLevel || 'clear'}`);
      }
      queryClient.invalidateQueries({ queryKey: ['tscm-sweeps', user?.id] });
    },
    onError: (error) => {
      toast.error(`Failed to complete sweep: ${error.message}`);
    },
  });

  // Analyze RF environment
  const analyzeRFEnvironment = useCallback(async (captures: Array<Record<string, unknown>>) => {
    try {
      const { data, error } = await invokeFunction('tscm-intelligence/analyze-rf-environment', { captures },);
      if (error) throw error;
      return data.analysis;
    } catch (error) {
      toast.error('RF analysis failed');
      return null;
    }
  }, []);

  // Detect anomalies
  const detectAnomalies = useCallback(async (
    baselineId: string | null, 
    currentReadings: Array<Record<string, unknown>>
  ) => {
    try {
      const { data, error } = await invokeFunction('tscm-intelligence/detect-anomalies', { baseline_id: baselineId, current_readings: currentReadings },);
      if (error) throw error;
      return data.anomalies;
    } catch (error) {
      toast.error('Anomaly detection failed');
      return [];
    }
  }, []);

  // Generate report
  const generateReport = useCallback(async (sweepId: string) => {
    try {
      const { data, error } = await invokeFunction('tscm-intelligence/generate-report', { sweep_id: sweepId },);
      if (error) throw error;
      return data.report;
    } catch (error) {
      toast.error('Report generation failed');
      return null;
    }
  }, []);

  // Categorize sweeps by threat level
  const criticalSweeps = sweeps.filter(s => s.threat_level === 'critical');
  const highSweeps = sweeps.filter(s => s.threat_level === 'high');
  const activeSweep = sweeps.find(s => !s.completed_at);
  const completedSweeps = sweeps.filter(s => s.completed_at);

  // Get protocol for threat level
  const getProtocol = useCallback((threatLevel: ThreatLevel | null) => {
    if (!threatLevel) return threatProtocols.low;
    return threatProtocols[threatLevel] || threatProtocols.low;
  }, [threatProtocols]);

  return {
    sweeps,
    activeSweep,
    activeSweepId,
    criticalSweeps,
    highSweeps,
    completedSweeps,
    threatProtocols,
    isLoading,
    startSweep: startSweep.mutate,
    isStartingSweep: startSweep.isPending,
    addFinding: addFinding.mutate,
    completeSweep: completeSweep.mutate,
    isCompletingSweep: completeSweep.isPending,
    analyzeRFEnvironment,
    detectAnomalies,
    generateReport,
    getProtocol,
    refetch,
  };
}
