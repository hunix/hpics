import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { RFSignalCapture, SignalType } from '@/types/hardware';
import { toast } from 'sonner';
import { invokeFunction } from '@/lib/api';

interface CaptureSignalParams {
  signal_type: SignalType;
  frequency_hz?: number;
  bandwidth_hz?: number;
  protocol?: string;
  modulation?: string;
  signal_strength_dbm?: number;
  raw_data?: string;
  decoded_data?: Record<string, unknown>;
  device_fingerprint?: Record<string, unknown>;
  location?: { lat: number; lng: number };
  location_name?: string;
  mission_id?: string;
  device_id?: string;
}

interface AnalysisResult {
  threat_classification: 'benign' | 'suspicious' | 'hostile' | 'unknown';
  analysis: {
    signal_characteristics: Record<string, unknown>;
    known_protocols: string[];
    potential_devices: string[];
    threat_indicators: string[];
    recommendations: string[];
  };
  confidence: number;
}

interface ThreatSummary {
  total: number;
  hostile: number;
  suspicious: number;
  benign: number;
  by_type: Record<string, number>;
}

export function useRFSignalIntelligence() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [isCapturing, setIsCapturing] = useState(false);

  // Fetch RF captures
  const {
    data: captures = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['rf-captures', session?.user?.id],
    queryFn: async () => {
      if (!session?.access_token) return [];

      const { data, error } = await invokeFunction('rf-signal-intelligence', { action: 'get_captures', limit: 100 }, { headers: { Authorization: `Bearer ${session.access_token}` } });

      if (error) throw error;
      return data.captures as RFSignalCapture[];
    },
    enabled: !!session?.user?.id,
    staleTime: 30000,
  });

  // Fetch threat summary
  const { data: threatSummary } = useQuery({
    queryKey: ['rf-threat-summary', session?.user?.id],
    queryFn: async () => {
      if (!session?.access_token) return null;

      const { data, error } = await invokeFunction('rf-signal-intelligence', { action: 'get_threat_summary' }, { headers: { Authorization: `Bearer ${session.access_token}` } });

      if (error) throw error;
      return data.summary as ThreatSummary;
    },
    enabled: !!session?.user?.id,
    staleTime: 60000,
  });

  // Capture signal mutation
  const captureSignalMutation = useMutation({
    mutationFn: async (params: CaptureSignalParams): Promise<{ capture_id: string; analysis: AnalysisResult }> => {
      if (!session?.access_token) throw new Error('Not authenticated');

      const { data, error } = await invokeFunction('rf-signal-intelligence', { action: 'capture_signal', capture: params }, { headers: { Authorization: `Bearer ${session.access_token}` } });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['rf-captures'] });
      queryClient.invalidateQueries({ queryKey: ['rf-threat-summary'] });
      
      if (data.analysis.threat_classification === 'hostile') {
        toast.error('⚠️ HOSTILE SIGNAL DETECTED', {
          description: data.analysis.analysis.threat_indicators.join(', '),
          duration: 10000,
        });
      } else if (data.analysis.threat_classification === 'suspicious') {
        toast.warning('Suspicious signal detected', {
          description: data.analysis.analysis.threat_indicators.join(', '),
        });
      } else {
        toast.success('Signal captured and analyzed');
      }
    },
    onError: (error: Error) => {
      toast.error('Failed to capture signal', { description: error.message });
    },
  });

  // Analyze signal without storing
  const analyzeSignal = useCallback(async (params: CaptureSignalParams): Promise<AnalysisResult | null> => {
    if (!session?.access_token) return null;

    try {
      const { data, error } = await invokeFunction('rf-signal-intelligence', { action: 'analyze_signal', capture: params }, { headers: { Authorization: `Bearer ${session.access_token}` } });

      if (error) throw error;
      return data.analysis;
    } catch (error) {
      console.error('Signal analysis failed:', error);
      return null;
    }
  }, [session?.access_token]);

  // Start continuous capture mode
  const startCapture = useCallback(() => {
    setIsCapturing(true);
    toast.info('RF capture mode activated');
  }, []);

  const stopCapture = useCallback(() => {
    setIsCapturing(false);
    toast.info('RF capture mode deactivated');
  }, []);

  // Get captures by threat level
  const hostileCaptures = captures.filter(c => c.threat_classification === 'hostile');
  const suspiciousCaptures = captures.filter(c => c.threat_classification === 'suspicious');

  return {
    captures,
    isLoading,
    threatSummary,
    hostileCaptures,
    suspiciousCaptures,
    isCapturing,
    captureSignal: captureSignalMutation.mutateAsync,
    isCapturingSignal: captureSignalMutation.isPending,
    analyzeSignal,
    startCapture,
    stopCapture,
    refetch,
  };
}
