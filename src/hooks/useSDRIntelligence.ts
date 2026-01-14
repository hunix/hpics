import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { RFSignalCapture } from '@/types/hardware';

interface SpectrumScanParams {
  device_id: string;
  start_frequency_hz: number;
  end_frequency_hz: number;
  step_hz?: number;
  sample_rate?: number;
  dwell_time_ms?: number;
  mission_id?: string;
}

interface SignalDetection {
  frequency_hz: number;
  bandwidth_hz: number;
  power_dbm: number;
  modulation: string | null;
  protocol: string | null;
  classification: 'known' | 'unknown' | 'suspicious';
}

interface FrequencyInfo {
  range: number[];
  name: string;
  type: string;
}

export function useSDRIntelligence() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isScanning, setIsScanning] = useState(false);

  // Fetch known frequency database
  const { data: knownFrequencies = [] } = useQuery<FrequencyInfo[]>({
    queryKey: ['sdr-known-frequencies'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('sdr-intelligence/known-frequencies');
      if (error) throw error;
      return data.frequencies || [];
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });

  // Fetch recent RF captures
  const { data: recentCaptures = [], isLoading, refetch } = useQuery<RFSignalCapture[]>({
    queryKey: ['rf-captures', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('rf_signal_captures')
        .select('*')
        .eq('user_id', user.id)
        .order('captured_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return (data || []) as unknown as RFSignalCapture[];
    },
    enabled: !!user?.id,
    refetchInterval: 5000,
  });

  // Start spectrum scan
  const startScan = useMutation({
    mutationFn: async (params: SpectrumScanParams) => {
      setIsScanning(true);
      const { data, error } = await supabase.functions.invoke('sdr-intelligence/spectrum-scan', {
        body: params,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Spectrum scan initiated');
      queryClient.invalidateQueries({ queryKey: ['rf-captures', user?.id] });
    },
    onError: (error) => {
      toast.error(`Scan failed: ${error.message}`);
      setIsScanning(false);
    },
  });

  // Analyze signal
  const analyzeSignal = useCallback(async (captureId: string, signalData: Record<string, unknown>) => {
    try {
      const { data, error } = await supabase.functions.invoke('sdr-intelligence/analyze-signal', {
        body: { capture_id: captureId, signal_data: signalData },
      });
      
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['rf-captures', user?.id] });
      return data.analysis;
    } catch (error) {
      toast.error('Signal analysis failed');
      return null;
    }
  }, [user?.id, queryClient]);

  // Detect frequency hopping
  const detectFrequencyHopping = useCallback(async (captures: RFSignalCapture[], timeWindowMs = 1000) => {
    try {
      const { data, error } = await supabase.functions.invoke('sdr-intelligence/frequency-hopping-detect', {
        body: { captures, time_window_ms: timeWindowMs },
      });
      
      if (error) throw error;
      return data.analysis;
    } catch (error) {
      toast.error('Hopping detection failed');
      return null;
    }
  }, []);

  // Stop scanning
  const stopScanning = useCallback(() => {
    setIsScanning(false);
    toast.info('Scanning stopped');
  }, []);

  // Categorize captures by threat level
  const hostileCaptures = recentCaptures.filter(c => c.threat_classification === 'hostile');
  const suspiciousCaptures = recentCaptures.filter(c => c.threat_classification === 'suspicious');
  const benignCaptures = recentCaptures.filter(c => c.threat_classification === 'benign');

  return {
    recentCaptures,
    hostileCaptures,
    suspiciousCaptures,
    benignCaptures,
    knownFrequencies,
    isLoading,
    isScanning,
    startScan: startScan.mutate,
    isStartingScan: startScan.isPending,
    stopScanning,
    analyzeSignal,
    detectFrequencyHopping,
    refetch,
  };
}
